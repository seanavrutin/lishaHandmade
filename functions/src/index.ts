import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions, logger } from 'firebase-functions/v2';
import { defineSecret } from 'firebase-functions/params';
import { assertSaleOpen, normalizeOrderRequest, OrderError, priceOrder } from '../../shared/orderLogic';
import type { CreateOrderRequest, CreateOrderResponse, Order, Sale, SiteSettings } from '../../shared/types';
import { sendOrderEmail, sendOwnerEmail } from './orderEmail';

initializeApp();
setGlobalOptions({ region: 'europe-west1', maxInstances: 5 });

const db = getFirestore();
const FIRST_ORDER_NO = 1001;

/** Gmail app password for lisha.handmade@gmail.com – set with `firebase functions:secrets:set GMAIL_APP_PASSWORD`. */
const gmailAppPassword = defineSecret('GMAIL_APP_PASSWORD');

/** True when the caller is listed in /admins/{email} (same rule as firestore.rules). */
async function isAdmin(token: { email?: string; email_verified?: boolean } | undefined) {
  if (!token?.email || !token.email_verified) return false;
  return (await db.collection('admins').doc(token.email.toLowerCase()).get()).exists;
}

/** A failed email is logged and never fails the order. */
async function tryEmail(label: string, orderNo: number, send: () => Promise<unknown>) {
  try {
    await send();
  } catch (err) {
    logger.error(`${label} failed`, { orderNo, error: String(err) });
  }
}

/**
 * Creates an order inside one transaction: checks the sale is open, recomputes prices from the
 * sale document (client prices are never trusted), enforces stock limits and assigns an order number.
 * `manual: true` (admins only) is for phone orders: allowed after closing and without stock limits.
 * Afterwards the customer gets an order-summary email and, for website orders, Lior gets an alert.
 */
export const createOrder = onCall<CreateOrderRequest & { manual?: boolean }>({ secrets: [gmailAppPassword] }, async (request): Promise<CreateOrderResponse> => {
  try {
    const manual = request.data?.manual === true;
    const input = normalizeOrderRequest(request.data, { requireEmail: !manual });
    if (manual && !(await isAdmin(request.auth?.token))) {
      throw new HttpsError('permission-denied', 'נדרשת הרשאת ניהול');
    }

    const { response, sale, items, total } = await db.runTransaction(async (tx) => {
      const saleRef = db.collection('sales').doc(input.saleId);
      const counterRef = db.collection('counters').doc('orders');
      const [saleSnap, counterSnap] = await Promise.all([tx.get(saleRef), tx.get(counterRef)]);

      if (!saleSnap.exists) throw new OrderError('not-found', 'האירוע לא נמצא');
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

      return { response: { orderId: orderRef.id, orderNo, total }, sale, items, total };
    });

    const { orderNo } = response;
    const details = {
      orderNo,
      items,
      total,
      paymentMethod: input.paymentMethod,
      saleTitle: sale.title,
      pickupAt: sale.pickupAt.toMillis(),
      pickupText: sale.pickupText,
      location: sale.location,
    };
    const password = gmailAppPassword.value();
    const { email } = input.customer;

    await Promise.all([
      email &&
        tryEmail('Order email', orderNo, async () => {
          const settings = (await db.collection('settings').doc('site').get()).data() as Partial<SiteSettings> | undefined;
          await sendOrderEmail(
            { ...details, to: email, name: input.customer.name, payboxLink: settings?.payboxLink ?? '', phone: settings?.phone ?? '' },
            password,
          );
        }),
      !manual && tryEmail('Owner email', orderNo, () => sendOwnerEmail({ ...details, customer: input.customer, notes: input.notes }, password)),
    ]);

    return response;
  } catch (err) {
    if (err instanceof OrderError) throw new HttpsError(err.code, err.message);
    throw err;
  }
});
