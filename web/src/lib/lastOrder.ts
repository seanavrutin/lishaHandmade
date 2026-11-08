import type { OrderItem, PaymentMethod } from '@shared/types';

/** What the confirmation page needs; kept on the customer's device (customers can't read orders). */
export interface LastOrder {
  orderId: string;
  orderNo: number;
  total: number;
  name: string;
  email?: string;
  paymentMethod: PaymentMethod;
  items: Pick<OrderItem, 'name' | 'addonNames' | 'qty' | 'lineTotal'>[];
  saleTitle: string;
  pickupAt: number;
  pickupFrom?: string;
  pickupUntil?: string;
  pickupText: string;
  location: string;
}

const KEY = 'lisha-last-order';

export function saveLastOrder(order: LastOrder) {
  try {
    localStorage.setItem(KEY, JSON.stringify(order));
  } catch {
    // ignore
  }
}

export function loadLastOrder(): LastOrder | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LastOrder) : null;
  } catch {
    return null;
  }
}

const CUSTOMER_KEY = 'lisha-customer';

export function loadCustomer(): { name: string; phone: string; email: string } {
  const empty = { name: '', phone: '', email: '' };
  try {
    const raw = localStorage.getItem(CUSTOMER_KEY);
    if (raw) return { ...empty, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return empty;
}

export function saveCustomer(customer: { name: string; phone: string; email: string }) {
  try {
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
  } catch {
    // ignore
  }
}
