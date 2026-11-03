// The site theme is a site setting (chosen in admin → settings). Colours live in index.css.
// `?theme=name` in the URL previews a theme in this browser only, without saving it.
export const THEMES = {
  cocoa: 'שוקולד וקרם',
  blush: 'ורוד פודרה',
  sage: 'ירוק מרווה',
  terracotta: 'טרקוטה',
  sky: 'תכלת שמיים',
  powder: 'תכלת ואפרסק',
  noir: 'שחור וזהב',
} as const;

export type ThemeName = keyof typeof THEMES;

export const DEFAULT_THEME: ThemeName = 'cocoa';
const CACHE_KEY = 'lisha-theme';

export const isTheme = (v: unknown): v is ThemeName => typeof v === 'string' && v in THEMES;

const previewTheme = () => {
  const v = new URLSearchParams(window.location.search).get('theme');
  return isTheme(v) ? v : null;
};

/** Before the first render: use the last known site theme, so the page doesn't flash. */
export function applyInitialTheme() {
  let cached: string | null = null;
  try {
    cached = localStorage.getItem(CACHE_KEY);
  } catch {
    // ignore
  }
  document.documentElement.dataset.theme = previewTheme() ?? (isTheme(cached) ? cached : DEFAULT_THEME);
}

/** Applies the site theme from settings (a URL preview still wins) and caches it for the next visit. */
export function applySiteTheme(theme: string) {
  const name = isTheme(theme) ? theme : DEFAULT_THEME;
  try {
    localStorage.setItem(CACHE_KEY, name);
  } catch {
    // ignore
  }
  document.documentElement.dataset.theme = previewTheme() ?? name;
}
