const TZ = 'Asia/Jerusalem';

const currency = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});

/** 60 → "‏60 ₪" */
export const formatPrice = (amount: number) => currency.format(amount);

/** → "יום רביעי, 5 בנובמבר, 17:00" */
export const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat('he-IL', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

/** Israeli mobile number: 05X-XXXXXXX, with or without dashes / +972. */
export const isValidIsraeliMobile = (phone: string) =>
  /^(?:\+972|0)5\d{8}$/.test(phone.replace(/[\s-]/g, ''));
