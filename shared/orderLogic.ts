// Order validation and pricing shared by the createOrder Cloud Function and the web demo backend,
// so both enforce exactly the same rules.
import type { CreateOrderRequest, OrderItem, Sale } from './types';

export type OrderErrorCode = 'invalid-argument' | 'failed-precondition' | 'resource-exhausted' | 'not-found';

export class OrderError extends Error {
  constructor(
    public readonly code: OrderErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export const MAX_QTY_PER_LINE = 20;

export const normalizePhone = (phone: string) => phone.replace(/[\s-]/g, '');

/** Israeli mobile number: 05X-XXXXXXX, with or without dashes / +972. */
export const isValidIsraeliMobile = (phone: string) => /^(?:\+972|0)5\d{8}$/.test(normalizePhone(phone));

/** Validates and cleans an untrusted order request. */
export function normalizeOrderRequest(data: CreateOrderRequest): CreateOrderRequest {
  const name = String(data?.customer?.name ?? '').trim();
  const phone = normalizePhone(String(data?.customer?.phone ?? ''));

  if (typeof data?.saleId !== 'string' || !data.saleId) {
    throw new OrderError('invalid-argument', 'חסרה מכירה');
  }
  if (name.length < 2 || name.length > 80) throw new OrderError('invalid-argument', 'נא למלא שם מלא');
  if (!isValidIsraeliMobile(phone)) throw new OrderError('invalid-argument', 'מספר טלפון לא תקין');
  if (!Array.isArray(data.items) || data.items.length === 0 || data.items.length > 30) {
    throw new OrderError('invalid-argument', 'ההזמנה ריקה');
  }

  const items = data.items.map((i) => {
    const qty = Number(i?.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      throw new OrderError('invalid-argument', 'כמות לא תקינה');
    }
    return {
      productId: String(i.productId),
      addonIds: Array.isArray(i.addonIds) ? i.addonIds.map(String) : [],
      qty,
    };
  });

  return {
    saleId: data.saleId,
    customer: { name, phone },
    notes: String(data.notes ?? '').slice(0, 500),
    paymentMethod: data.paymentMethod,
    items,
  };
}

/** Throws unless the sale is open at `now`. All times in epoch milliseconds. */
export function assertSaleOpen(status: Sale['status'], now: number, opensAt: number, closesAt: number) {
  if (status !== 'open' || now < opensAt) {
    throw new OrderError('failed-precondition', 'המכירה אינה פתוחה כרגע');
  }
  if (now >= closesAt) throw new OrderError('failed-precondition', 'ההזמנות למכירה זו נסגרו');
}

/**
 * Prices an order from the sale document (never from client prices) and checks limits.
 * `enforceLimits: false` is for orders the admin adds manually (phone orders, after closing).
 */
export function priceOrder(
  sale: Sale<unknown>,
  req: CreateOrderRequest,
  { enforceLimits = true }: { enforceLimits?: boolean } = {},
) {
  if (enforceLimits) {
    if (sale.maxOrders != null && sale.orderCount >= sale.maxOrders) {
      throw new OrderError('resource-exhausted', 'כל ההזמנות למכירה זו נתפסו');
    }
    if (!sale.paymentModes.includes(req.paymentMethod)) {
      throw new OrderError('invalid-argument', 'אמצעי התשלום אינו זמין');
    }
  }

  const items: OrderItem[] = [];
  const qtyByProduct: Record<string, number> = {};

  for (const line of req.items) {
    const saleItem = sale.items.find((i) => i.productId === line.productId);
    if (!saleItem) throw new OrderError('invalid-argument', 'מוצר לא זמין במכירה');

    const addons = line.addonIds.map((id) => {
      const addon = saleItem.addons.find((a) => a.id === id);
      if (!addon) throw new OrderError('invalid-argument', 'תוספת לא קיימת');
      return addon;
    });

    const unitPrice = saleItem.price + addons.reduce((sum, a) => sum + a.price, 0);
    items.push({
      productId: saleItem.productId,
      name: saleItem.name,
      addonIds: addons.map((a) => a.id),
      addonNames: addons.map((a) => a.name),
      unitPrice,
      qty: line.qty,
      lineTotal: unitPrice * line.qty,
    });
    qtyByProduct[saleItem.productId] = (qtyByProduct[saleItem.productId] ?? 0) + line.qty;
  }

  if (enforceLimits) {
    for (const [productId, qty] of Object.entries(qtyByProduct)) {
      const saleItem = sale.items.find((i) => i.productId === productId)!;
      const sold = sale.sold?.[productId] ?? 0;
      if (saleItem.maxQty != null && sold + qty > saleItem.maxQty) {
        const left = Math.max(saleItem.maxQty - sold, 0);
        throw new OrderError('resource-exhausted', `נשארו רק ${left} יחידות של ${saleItem.name}`);
      }
    }
  }

  const total = items.reduce((sum, i) => sum + i.lineTotal, 0);
  return { items, total, qtyByProduct };
}
