const TZ = 'Asia/Jerusalem';

const currency = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});

/** 60 → "‏60 ₪" */
export const formatPrice = (amount: number) => currency.format(amount);

/** → "יום רביעי, 5 בנובמבר, 17:00" */
export const formatDateTime = (ms: number) =>
  new Intl.DateTimeFormat('he-IL', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(ms);

/** → "5.11, 17:00" */
export const formatShortDateTime = (ms: number) =>
  new Intl.DateTimeFormat('he-IL', {
    timeZone: TZ,
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(ms);

/** → "5.11" */
export const formatShortDate = (ms: number) =>
  new Intl.DateTimeFormat('he-IL', { timeZone: TZ, day: 'numeric', month: 'numeric' }).format(ms);

/** Remaining time in Hebrew: "יומיים ו־3 שעות", "4 שעות ו־12 דקות", "12 דקות". */
export function formatTimeLeft(ms: number): string {
  if (ms <= 0) return 'נסגר';
  const minutes = Math.floor(ms / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  const d = days === 1 ? 'יום' : days === 2 ? 'יומיים' : `${days} ימים`;
  const h = hours === 1 ? 'שעה' : hours === 2 ? 'שעתיים' : `${hours} שעות`;
  const m = mins === 1 ? 'דקה' : `${mins} דקות`;

  if (days > 0) return hours > 0 ? `${d} ו־${h}` : d;
  if (hours > 0) return mins > 0 ? `${h} ו־${m}` : h;
  return m;
}

/** 0501234567 → 972501234567, for wa.me links. */
export const toWhatsAppNumber = (phone: string) => phone.replace(/[\s-]/g, '').replace(/^(\+972|0)/, '972');

export const whatsappLink = (phone: string, text?: string) =>
  `https://wa.me/${toWhatsAppNumber(phone)}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/** epoch ms ↔ value of <input type="datetime-local"> (local time). */
export function toDateTimeInput(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const fromDateTimeInput = (value: string) => new Date(value).getTime();
