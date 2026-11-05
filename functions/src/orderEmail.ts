// Order-summary email sent to the customer after a website order, through the business Gmail.
import type { OrderItem, PaymentMethod } from '../../shared/types';

export const SENDER = 'lisha.handmade@gmail.com';

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

const ils = (n: number) => `${n.toLocaleString('he-IL')} ₪`;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const when = (ms: number) =>
  new Intl.DateTimeFormat('he-IL', {
    timeZone: 'Asia/Jerusalem',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(ms);

export function buildEmail(o: OrderEmail) {
  const firstName = o.name.split(' ')[0];
  const rows = o.items
    .map((i) => {
      const addons = i.addonNames.length ? ` <span style="color:#8a6656">(${esc(i.addonNames.join(', '))})</span>` : '';
      return `<tr><td style="padding:6px 0">${i.qty} × ${esc(i.name)}${addons}</td><td style="padding:6px 0;text-align:left;white-space:nowrap">${ils(i.lineTotal)}</td></tr>`;
    })
    .join('');

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
    <p style="margin:0"><strong>🧺 איסוף:</strong> ${esc(o.pickupText)}<br><span style="color:#8a6656">${when(o.pickupAt)}${o.location ? ` · ${esc(o.location)}` : ''}</span></p>
  </div>
  <p style="text-align:center;color:#8a6656;font-size:13px;margin-top:16px">לשאלות: ליאור · ${esc(o.phone)}<br>Lisha Handmade</p>
</div></body></html>`;

  const text = [
    `תודה ${firstName}! ההזמנה שלך התקבלה – הזמנה #${o.orderNo}`,
    o.saleTitle,
    ...o.items.map((i) => `${i.qty} × ${i.name}${i.addonNames.length ? ` (${i.addonNames.join(', ')})` : ''} – ${ils(i.lineTotal)}`),
    `סה״כ: ${ils(o.total)}`,
    o.paymentMethod === 'paybox'
      ? `תשלום ב-PayBox${o.payboxLink ? `: ${o.payboxLink}` : ''} (נא לציין: הזמנה #${o.orderNo}), או בביט ל-${o.phone}`
      : 'תשלום באיסוף – במזומן או בביט',
    `איסוף: ${o.pickupText} – ${when(o.pickupAt)}${o.location ? ` · ${o.location}` : ''}`,
    `לשאלות: ליאור · ${o.phone}`,
  ].join('\n');

  return { subject: `סיכום הזמנה #${o.orderNo} – Lisha Handmade`, html, text };
}

/** Sends the summary through Gmail (app password from the GMAIL_APP_PASSWORD secret). */
export async function sendOrderEmail(o: OrderEmail, appPassword: string) {
  // Loaded on first send, so the function starts (and the deploy check runs) faster.
  const { createTransport } = await import('nodemailer');
  const transport = createTransport({ service: 'gmail', auth: { user: SENDER, pass: appPassword } });
  const { subject, html, text } = buildEmail(o);
  await transport.sendMail({ from: `"Lisha Handmade" <${SENDER}>`, to: o.to, subject, html, text });
}
