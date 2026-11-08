// How an event's pickup date and hours are worded, shared by the website and the order email.

export const PICKUP_TBD = 'השעה תעודכן בהמשך';

/** "13:00-14:00", "החל מ-13:00", "עד 14:00", or the not-decided-yet text when both are empty. */
export function pickupHours(from = '', until = ''): string {
  // Word joiners keep the range on one line on narrow screens.
  if (from && until) return `${from}⁠-⁠${until}`;
  if (from) return `החל מ-${from}`;
  if (until) return `עד ${until}`;
  return PICKUP_TBD;
}

/** → "יום שישי, 13 בנובמבר" */
export const pickupDate = (ms: number) =>
  new Intl.DateTimeFormat('he-IL', {
    timeZone: 'Asia/Jerusalem',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(ms);

/** → "יום שישי, 13 בנובמבר · 13:00-14:00" */
export const pickupSummary = (ms: number, hours: string) => (hours ? `${pickupDate(ms)} · ${hours}` : pickupDate(ms));
