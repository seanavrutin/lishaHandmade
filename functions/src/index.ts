import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { assertSaleOpen, normalizeOrderRequest, OrderError, priceOrder } from '../../shared/orderLogic';
import type { CreateOrderRequest, CreateOrderResponse, Order, Sale } from '../../shared/types';

initializeApp();
setGlobalOptions({ region: 'europe-west1', maxInstances: 5 });

const db = getFirestore();
const FIRST_ORDER_NO = 1001;

/** True when the caller is listed in /admins/{email} (same rule as firestore.rules). */
async function isAdmin(token: { email?: string; email_verified?: boolean } | undefined) {
  if (!token?.email || !token.email_verified) return false;
  return (await db.collection('admins').doc(token.email.toLowerCase()).get()).exists;
}

/**
 * Creates an order inside one transaction: checks the sale is open, recomputes prices from the
 * sale document (client prices are never trusted), enforces stock limits and assigns an order number.
 * `manual: true` (admins only) is for phone orders: allowed after closing and without stock limits.
 */
export const createOrder = onCall<CreateOrderRequest & { manual?: boolean }>(async (request): Promise<CreateOrderResponse> => {
  try {
    const input = normalizeOrderRequest(request.data);
    const manual = request.data?.manual === true;
    if (manual && !(await isAdmin(request.auth?.token))) {
      throw new HttpsError('permission-denied', 'נדרשת הרשאת ניהול');
    }

    return await db.runTransaction(async (tx) => {
      const saleRef = db.collection('sales').doc(input.saleId);
      const counterRef = db.collection('counters').doc('orders');
      const [saleSnap, counterSnap] = await Promise.all([tx.get(saleRef), tx.get(counterRef)]);

      if (!saleSnap.exists) throw new OrderError('not-found', 'המכירה לא נמצאה');
      const sale = saleSnap.data() as Sale<Timestamp>;

      if (!manual) assertSaleOpen(sale.status, Date.now(), sale.opensAt.toMillis(), sale.closesAt.toMillis());
      const { items, total, qtyByProduct } = priceOrder(sale, input, { enforceLimits: !manual });

      const orderNo = counterSnap.exists ? (counterSnap.get('next') as number) : FIRST_ORDER_NO;
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
  } catch (err) {
    if (err instanceof OrderError) throw new HttpsError(err.code, err.message);
    throw err;
  }
});
