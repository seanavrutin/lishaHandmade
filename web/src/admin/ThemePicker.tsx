import { THEMES, type ThemeName } from '../lib/theme';

/**
 * Each option renders inside its own data-theme, so the card is a true preview of that theme's
 * colours and heading font.
 */
export default function ThemePicker({ value, onChange }: { value: string; onChange: (theme: ThemeName) => void }) {
  return (
    <>
      <p className="text-xs text-muted">לחיצה מחליפה את העיצוב מיד, לכל המבקרים באתר.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(Object.keys(THEMES) as ThemeName[]).map((name) => {
          const selected = value === name;
          return (
            <button
              key={name}
              type="button"
              data-theme={name}
              onClick={() => onChange(name)}
              aria-pressed={selected}
              className={`relative overflow-hidden rounded-2xl bg-page p-3 text-start text-ink transition active:scale-[0.98] ${
                selected ? 'ring-4 ring-primary' : 'ring-1 ring-line'
              }`}
            >
              <span className="block font-display text-lg leading-tight">{THEMES[name]}</span>
              <span className="mt-2 flex items-center gap-1.5" aria-hidden="true">
                <span className="h-6 w-6 rounded-full bg-primary" />
                <span className="h-6 w-6 rounded-full bg-accent" />
                <span className="h-6 w-6 rounded-full bg-accent-strong" />
                <span className="h-6 w-6 rounded-full bg-surface ring-1 ring-line" />
              </span>
              <span className="mt-2 block rounded-full bg-primary py-1 text-center text-xs font-semibold text-on-primary">
                להזמנה
              </span>
              {selected && (
                <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-sm text-on-primary">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
