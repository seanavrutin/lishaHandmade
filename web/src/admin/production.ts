import type { OrderData } from '../data';

export interface ProductionRow {
  productId: string;
  name: string;
  total: number;
  unpaid: number;
  /** e.g. [{ label: 'רגיל', qty: 3 }, { label: 'עם תוספת גבינה', qty: 2 }] */
  variants: { label: string; qty: number }[];
}

/** What to bake: quantities per product and variant, across all non-cancelled orders. */
export function computeProduction(orders: OrderData[]): ProductionRow[] {
  const rows = new Map<string, ProductionRow>();

  for (const order of orders) {
    if (order.status === 'cancelled') continue;
    for (const item of order.items) {
      const row = rows.get(item.productId) ?? { productId: item.productId, name: item.name, total: 0, unpaid: 0, variants: [] };
      row.total += item.qty;
      if (order.paymentStatus !== 'paid') row.unpaid += item.qty;

      const label = item.addonNames.length ? `עם ${item.addonNames.join(' + ')}` : 'רגיל';
      const variant = row.variants.find((v) => v.label === label);
      if (variant) variant.qty += item.qty;
      else row.variants.push({ label, qty: item.qty });

      rows.set(item.productId, row);
    }
  }

  return [...rows.values()].map((r) => ({
    ...r,
    // only list variants when there is more than plain
    variants: r.variants.length === 1 && r.variants[0].label === 'רגיל' ? [] : r.variants,
  }));
}

export function orderStats(orders: OrderData[]) {
  const active = orders.filter((o) => o.status !== 'cancelled');
  const paid = active.filter((o) => o.paymentStatus === 'paid');
  return {
    count: active.length,
    revenue: active.reduce((s, o) => s + o.total, 0),
    paid: paid.reduce((s, o) => s + o.total, 0),
    unpaid: active.filter((o) => o.paymentStatus !== 'paid').reduce((s, o) => s + o.total, 0),
    unpaidCount: active.length - paid.length,
    pickedUp: active.filter((o) => o.status === 'picked_up').length,
  };
}
