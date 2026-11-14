// Emails sent after an order, through the business Gmail: a summary to the customer and an alert to Lior.
import { pickupSummary } from '../../shared/pickup';
import type { Order, OrderItem, PaymentMethod } from '../../shared/types';

export const SENDER = 'lisha.handmade@gmail.com';
/** Where Lior gets new-order alerts. */
export const OWNER_EMAIL = 'liorshchory36@gmail.com';

export interface OrderEmail {
  to: string;
  name: string;
  orderNo: number;
  items: OrderItem[];
  total: number;
  paymentMethod: PaymentMethod;
  saleTitle: string;
  pickupAt: number;
  pickupText: string;
  location: string;
  payboxLink: string;
  phone: string;
}

export interface OwnerOrderEmail {
  orderNo: number;
  customer: Order['customer'];
  notes: string;
  items: OrderItem[];
  total: number;
  paymentMethod: PaymentMethod;
  saleTitle: string;
  pickupAt: number;
  pickupText: string;
  location: string;
}

const ils = (n: number) => `${n.toLocaleString('he-IL')} ₪`;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const itemRows = (items: OrderItem[]) =>
  items
    .map((i) => {
      const addons = i.addonNames.length ? ` <span style="color:#8a6656">(${esc(i.addonNames.join(', '))})</span>` : '';
      return `<tr><td style="padding:6px 0">${i.qty} × ${esc(i.name)}${addons}</td><td style="padding:6px 0;text-align:left;white-space:nowrap">${ils(i.lineTotal)}</td></tr>`;
    })
    .join('');

const itemLine = (i: OrderItem) => `${i.qty} × ${i.name}${i.addonNames.length ? ` (${i.addonNames.join(', ')})` : ''} – ${ils(i.lineTotal)}`;

export function buildEmail(o: OrderEmail) {
  const firstName = o.name.split(' ')[0];
  const rows = itemRows(o.items);

  const payment =
    o.paymentMethod === 'paybox'
      ? `<p style="margin:0 0 8px"><strong>תשלום:</strong> ${ils(o.total)} ב-PayBox. נא לציין בהערה: <strong>הזמנה #${o.orderNo}</strong></p>` +
        (o.payboxLink
          ? `<p style="margin:0 0 8px"><a href="${esc(o.payboxLink)}" style="display:inline-block;background:#5a3a2e;color:#fff;text-decoration:none;padding:10px 22px;border-radius:999px;font-weight:bold">לתשלום ב-PayBox</a></p>`
          : '') +
        `<p style="margin:0;color:#8a6656;font-size:14px">אפשר גם בביט למספר ${esc(o.phone)}</p>`
      : `<p style="margin:0"><strong>תשלום:</strong> ${ils(o.total)} באיסוף – במזומן או בביט.</p>`;

  const html = `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;background:#f7efe6;font-family:Arial,Helvetica,sans-serif;color:#3b2a24">
<div style="max-width:520px;margin:0 auto;padding:24px 16px" dir="rtl">
  <div style="text-align:center;margin-bottom:16px">
    <div style="font-family:Georgia,serif;font-size:26px;letter-spacing:8px;font-weight:bold;color:#5a3a2e">LISHA</div>
    <div style="font-family:Georgia,serif;font-style:italic;color:#c46f68;font-size:18px">handmade</div>
  </div>
  <div style="background:#fff;border-radius:16px;padding:20px">
    <h1 style="margin:0 0 4px;font-size:22px">תודה ${esc(firstName)}! 💕</h1>
    <p style="margin:0 0 16px">ההזמנה שלך התקבלה · <strong>הזמנה #${o.orderNo}</strong></p>
    <p style="margin:0 0 6px;font-weight:bold">${esc(o.saleTitle)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:15px">${rows}
      <tr><td style="padding:8px 0;border-top:1px solid #efe2d3;font-weight:bold">סה״כ</td><td style="padding:8px 0;border-top:1px solid #efe2d3;text-align:left;font-weight:bold">${ils(o.total)}</td></tr>
    </table>
    <div style="background:#f7efe6;border-radius:12px;padding:12px;margin:16px 0">${payment}</div>
    <p style="margin:0"><strong>🧺 איסוף עצמי:</strong> ${esc(pickupSummary(o.pickupAt, o.pickupText))}${o.location ? `<br><span style="color:#8a6656">${esc(o.location)}</span>` : ''}</p>
  </div>
  <p style="text-align:center;color:#8a6656;font-size:13px;margin-top:16px">לשאלות: ליאור · ${esc(o.phone)}<br>Lisha Handmade</p>
</div></body></html>`;

  const text = [
    `תודה ${firstName}! ההזמנה שלך התקבלה – הזמנה #${o.orderNo}`,
    o.saleTitle,
    ...o.items.map(itemLine),
    `סה״כ: ${ils(o.total)}`,
    o.paymentMethod === 'paybox'
      ? `תשלום ב-PayBox${o.payboxLink ? `: ${o.payboxLink}` : ''} (נא לציין: הזמנה #${o.orderNo}), או בביט ל-${o.phone}`
      : 'תשלום באיסוף – במזומן או בביט',
    `איסוף עצמי: ${pickupSummary(o.pickupAt, o.pickupText)}${o.location ? ` · ${o.location}` : ''}`,
    `לשאלות: ליאור · ${o.phone}`,
  ].join('\n');

  return { subject: `סיכום הזמנה #${o.orderNo} – Lisha Handmade`, html, text };
}

export function buildOwnerEmail(o: OwnerOrderEmail) {
  const { name, phone, email } = o.customer;
  const paymentText = o.paymentMethod === 'paybox' ? 'PayBox / ביט' : 'תשלום באיסוף';
  const pickup = `${pickupSummary(o.pickupAt, o.pickupText)}${o.location ? ` · ${o.location}` : ''}`;

  const html = `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;background:#f7efe6;font-family:Arial,Helvetica,sans-serif;color:#3b2a24">
<div style="max-width:520px;margin:0 auto;padding:24px 16px" dir="rtl">
  <div style="background:#fff;border-radius:16px;padding:20px">
    <h1 style="margin:0 0 4px;font-size:22px">הזמנה חדשה #${o.orderNo} 🎉</h1>
    <p style="margin:0 0 16px;color:#8a6656">${esc(o.saleTitle)}</p>
    <div style="background:#f7efe6;border-radius:12px;padding:12px;margin:0 0 16px">
      <p style="margin:0 0 4px"><strong>${esc(name)}</strong></p>
      <p style="margin:0 0 4px"><a href="tel:${esc(phone)}" dir="ltr" style="color:#5a3a2e">${esc(phone)}</a></p>
      ${email ? `<p style="margin:0"><a href="mailto:${esc(email)}" dir="ltr" style="color:#5a3a2e">${esc(email)}</a></p>` : ''}
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:15px">${itemRows(o.items)}
      <tr><td style="padding:8px 0;border-top:1px solid #efe2d3;font-weight:bold">סה״כ</td><td style="padding:8px 0;border-top:1px solid #efe2d3;text-align:left;font-weight:bold">${ils(o.total)}</td></tr>
    </table>
    <p style="margin:12px 0 0"><strong>תשלום:</strong> ${paymentText}</p>
    <p style="margin:6px 0 0"><strong>🧺 איסוף עצמי:</strong> ${esc(pickup)}</p>
    ${o.notes ? `<p style="margin:12px 0 0;white-space:pre-wrap"><strong>הערות:</strong> ${esc(o.notes)}</p>` : ''}
  </div>
</div></body></html>`;

  const text = [
    `הזמנה חדשה #${o.orderNo} – ${o.saleTitle}`,
    name,
    phone,
    ...(email ? [email] : []),
    '',
    ...o.items.map(itemLine),
    `סה״כ: ${ils(o.total)}`,
    `תשלום: ${paymentText}`,
    `איסוף עצמי: ${pickup}`,
    ...(o.notes ? [`הערות: ${o.notes}`] : []),
  ].join('\n');

  return { subject: `הזמנה חדשה #${o.orderNo} – ${name} – ${ils(o.total)}`, html, text };
}

type Mail = { to: string; replyTo?: string; subject: string; html: string; text: string };

/** Sends through Gmail (app password from the GMAIL_APP_PASSWORD secret). */
async function send(mail: Mail, appPassword: string) {
  // Loaded on first send, so the function starts (and the deploy check runs) faster.
  const { createTransport } = await import('nodemailer');
  const transport = createTransport({ service: 'gmail', auth: { user: SENDER, pass: appPassword } });
  await transport.sendMail({ from: `"Lisha Handmade" <${SENDER}>`, ...mail });
}

export const sendOrderEmail = (o: OrderEmail, appPassword: string) => send({ to: o.to, ...buildEmail(o) }, appPassword);

/** Replying to this email goes straight to the customer. */
export const sendOwnerEmail = (o: OwnerOrderEmail, appPassword: string) =>
  send({ to: OWNER_EMAIL, replyTo: o.customer.email || undefined, ...buildOwnerEmail(o) }, appPassword);
