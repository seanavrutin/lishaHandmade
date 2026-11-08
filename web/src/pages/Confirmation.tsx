import { pickupSummary } from '@shared/pickup';
import { useState } from 'react';
import { Link } from 'react-router';
import { WhatsAppIcon } from '../components/Layout';
import { Card, buttonClass } from '../components/ui';
import { api } from '../data';
import { useApiData } from '../data/hooks';
import { formatPrice, whatsappLink } from '../lib/format';
import { loadLastOrder, type LastOrder } from '../lib/lastOrder';

const TZ = 'Asia/Jerusalem';
const DAY = 24 * 60 * 60 * 1000;

/** Google Calendar `dates` value: the pickup hours (1 hour if only one is set), or all day when no hours are set. */
function calendarDates({ pickupAt, pickupFrom, pickupUntil }: LastOrder) {
  const day = (ms: number) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(ms).replace(/-/g, '');
  if (!pickupFrom && !pickupUntil) return `${day(pickupAt)}/${day(pickupAt + DAY)}`;

  const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  const start = pickupFrom ? minutes(pickupFrom) : Math.max(0, minutes(pickupUntil!) - 60);
  const end = pickupUntil ? minutes(pickupUntil) : Math.min(23 * 60 + 59, minutes(pickupFrom!) + 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = (m: number) => `${day(pickupAt)}T${pad(Math.floor(m / 60))}${pad(m % 60)}00`;
  return `${stamp(start)}/${stamp(end)}`;
}

function calendarLink(title: string, order: LastOrder) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: calendarDates(order),
    ctz: TZ,
    location: order.location,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export default function Confirmation() {
  const [order] = useState(loadLastOrder);
  const { data: settings } = useApiData(() => api.getSettings(), []);
  const [copied, setCopied] = useState(false);

  if (!order) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-2xl">לא נמצאה הזמנה</h1>
        <Link to="/" className={buttonClass('primary', 'mt-6')}>
          לדף הבית
        </Link>
      </div>
    );
  }

  const copyPhone = async () => {
    if (!settings) return;
    try {
      await navigator.clipboard.writeText(settings.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked – the number is visible anyway
    }
  };

  return (
    <div className="space-y-5 py-8">
      <div className="text-center">
        <div className="text-5xl" aria-hidden="true">
          🎉
        </div>
        <h1 className="mt-2 font-display text-3xl">תודה {order.name.split(' ')[0]}!</h1>
        <p className="mt-1 text-lg">
          ההזמנה התקבלה · מספר הזמנה <strong>#{order.orderNo}</strong>
        </p>
        {order.email && !api.isDemo && (
          <p className="mt-1 text-sm text-muted">
            סיכום ההזמנה נשלח ל-<span dir="ltr">{order.email}</span> 📧
          </p>
        )}
      </div>

      {order.paymentMethod === 'paybox' ? (
        <Card className="space-y-3 text-center ring-2 ring-accent-strong">
          <h2 className="font-display text-xl">נשאר רק לשלם 💳</h2>
          <p>
            סכום לתשלום: <strong className="text-2xl">{formatPrice(order.total)}</strong>
          </p>
          <p className="rounded-xl bg-line/50 p-2 text-sm">
            נא לציין בהערה לתשלום: <strong>הזמנה #{order.orderNo}</strong>
          </p>
          {settings?.payboxLink && (
            <a href={settings.payboxLink} target="_blank" rel="noreferrer" className={buttonClass('primary', 'w-full py-3.5 text-lg')}>
              לתשלום ב-PayBox
            </a>
          )}
          {settings && (
            <p className="text-sm text-muted">
              אפשר גם בביט למספר{' '}
              <button type="button" onClick={copyPhone} className="font-semibold text-ink underline" dir="ltr">
                {settings.phone}
              </button>{' '}
              {copied ? '✓ הועתק' : '(לחיצה להעתקה)'}
            </p>
          )}
        </Card>
      ) : (
        <Card className="text-center">
          <p>
            התשלום ({formatPrice(order.total)}) יתבצע <strong>באיסוף</strong> – במזומן או בביט.
          </p>
        </Card>
      )}

      <Card>
        <h2 className="mb-2 font-semibold">{order.saleTitle}</h2>
        <ul className="divide-y divide-line text-sm">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex justify-between gap-3 py-2">
              <span>
                {i.qty} × {i.name}
                {i.addonNames.length > 0 && <span className="text-muted"> ({i.addonNames.join(', ')})</span>}
              </span>
              <span className="shrink-0">{formatPrice(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t border-primary/20 pt-2 font-semibold">
          <span>סה״כ</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </Card>

      <Card className="space-y-3">
        <p>
          🧺 איסוף עצמי: <strong>{pickupSummary(order.pickupAt, order.pickupText)}</strong>
          {order.location && (
            <>
              <br />
              <span className="text-sm text-muted">{order.location}</span>
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={calendarLink(`איסוף הזמנה #${order.orderNo} – Lisha Handmade`, order)}
            target="_blank"
            rel="noreferrer"
            className={buttonClass('secondary', 'text-sm')}
          >
            📅 הוספה ליומן
          </a>
          {settings && (
            <a
              href={whatsappLink(settings.phone, `היי ליאור, לגבי הזמנה #${order.orderNo}`)}
              target="_blank"
              rel="noreferrer"
              className={buttonClass('secondary', 'text-sm')}
            >
              <WhatsAppIcon className="h-4 w-4" /> הודעה לליאור
            </a>
          )}
        </div>
      </Card>

      <p className="text-center">
        <Link to="/" className="underline">
          חזרה לדף הבית
        </Link>
      </p>
    </div>
  );
}
