import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  Order,
  OrderItem,
  Sale,
} from '../../shared/types';

initializeApp();
setGlobalOptions({ region: 'europe-west1', maxInstances: 5 });

const db = getFirestore();
const FIRST_ORDER_NO = 1001;
const MAX_QTY_PER_LINE = 20;

/**
 * Creates an order inside one transaction: checks the sale is open, recomputes prices from the
 * sale document (client prices are never trusted), enforces stock limits and assigns an order number.
 */
export const createOrder = onCall<CreateOrderRequest>(async (request): Promise<CreateOrderResponse> => {
  const input = validate(request.data);

  return db.runTransaction(async (tx) => {
    const saleRef = db.collection('sales').doc(input.saleId);
    const counterRef = db.collection('counters').doc('orders');
    const [saleSnap, counterSnap] = await Promise.all([tx.get(saleRef), tx.get(counterRef)]);

    if (!saleSnap.exists) throw new HttpsError('not-found', 'המכירה לא נמצאה');
    const sale = saleSnap.data() as Sale<Timestamp>;

    const now = Timestamp.now().toMillis();
    if (sale.status !== 'open' || now < sale.opensAt.toMillis()) {
      throw new HttpsError('failed-precondition', 'המכירה אינה פתוחה כרגע');
    }
    if (now >= sale.closesAt.toMillis()) {
      throw new HttpsError('failed-precondition', 'ההזמנות למכירה זו נסגרו');
    }
    if (sale.maxOrders != null && sale.orderCount >= sale.maxOrders) {
      throw new HttpsError('resource-exhausted', 'כל ההזמנות למכירה זו נתפסו');
    }
    if (!sale.paymentModes.includes(input.paymentMethod)) {
      throw new HttpsError('invalid-argument', 'אמצעי התשלום אינו זמין');
    }

    const items: OrderItem[] = [];
    const qtyByProduct: Record<string, number> = {};

    for (const line of input.items) {
      const saleItem = sale.items.find((i) => i.productId === line.productId);
      if (!saleItem) throw new HttpsError('invalid-argument', 'מוצר לא זמין במכירה');

      const addons = line.addonIds.map((id) => {
        const addon = saleItem.addons.find((a) => a.id === id);
        if (!addon) throw new HttpsError('invalid-argument', 'תוספת לא קיימת');
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

    for (const [productId, qty] of Object.entries(qtyByProduct)) {
      const saleItem = sale.items.find((i) => i.productId === productId)!;
      const sold = sale.sold?.[productId] ?? 0;
      if (saleItem.maxQty != null && sold + qty > saleItem.maxQty) {
        const left = Math.max(saleItem.maxQty - sold, 0);
        throw new HttpsError('resource-exhausted', `נשארו רק ${left} יחידות של ${saleItem.name}`);
      }
    }

    const orderNo = counterSnap.exists ? (counterSnap.get('next') as number) : FIRST_ORDER_NO;
    const total = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const orderRef = db.collection('orders').doc();

    const order: Omit<Order<FieldValue>, 'id'> = {
      orderNo,
      saleId: input.saleId,
      customer: input.customer,
      notes: input.notes,
      items,
      total,
      paymentMethod: input.paymentMethod,
      paymentStatus: 'unpaid',
      status: 'new',
      createdAt: FieldValue.serverTimestamp(),
    };

    tx.create(orderRef, order);
    tx.set(counterRef, { next: orderNo + 1 }, { merge: true });
    tx.update(saleRef, {
      orderCount: FieldValue.increment(1),
      ...Object.fromEntries(
        Object.entries(qtyByProduct).map(([id, qty]) => [`sold.${id}`, FieldValue.increment(qty)]),
      ),
    });

    return { orderId: orderRef.id, orderNo, total };
  });
});

function validate(data: CreateOrderRequest): CreateOrderRequest {
  const name = String(data?.customer?.name ?? '').trim();
  const phone = String(data?.customer?.phone ?? '').replace(/[\s-]/g, '');

  if (typeof data?.saleId !== 'string' || !data.saleId) {
    throw new HttpsError('invalid-argument', 'חסרה מכירה');
  }
  if (name.length < 2 || name.length > 80) throw new HttpsError('invalid-argument', 'נא למלא שם מלא');
  if (!/^(?:\+972|0)5\d{8}$/.test(phone)) throw new HttpsError('invalid-argument', 'מספר טלפון לא תקין');
  if (!Array.isArray(data.items) || data.items.length === 0 || data.items.length > 30) {
    throw new HttpsError('invalid-argument', 'ההזמנה ריקה');
  }

  const items = data.items.map((i) => {
    const qty = Number(i?.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      throw new HttpsError('invalid-argument', 'כמות לא תקינה');
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
