import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { Category } from '@shared/types';

/** Placeholder picture for products without a photo, guessed from the category name. */
function categoryEmoji(category: Category) {
  if (category.includes('קיש') || category.includes('מלוח')) return '🥧';
  if (/מתוק|עוג|קינוח/.test(category)) return '🍰';
  return '🥐';
}

export function Stepper({
  value,
  onChange,
  max,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  label: string;
}) {
  const btn =
    'flex h-9 w-9 items-center justify-center rounded-full text-xl font-semibold transition disabled:opacity-30';
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <button
        type="button"
        className={`${btn} bg-primary text-on-primary`}
        onClick={() => onChange(value + 1)}
        disabled={max != null && value >= max}
        aria-label={`הוספת ${label}`}
      >
        +
      </button>
      <span className="w-7 text-center text-lg font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={`${btn} bg-line text-ink`}
        onClick={() => onChange(value - 1)}
        disabled={value <= 0}
        aria-label={`הורדת ${label}`}
      >
        −
      </button>
    </div>
  );
}

export function ProductImage({ src, category, className = '' }: { src: string; category: Category; className?: string }) {
  if (src) return <img src={src} alt="" className={`object-cover ${className}`} loading="lazy" />;
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-accent/60 to-line text-4xl ${className}`}
      aria-hidden="true"
    >
      {categoryEmoji(category)}
    </div>
  );
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary/90',
  secondary: 'bg-surface text-ink ring-1 ring-line hover:bg-line/40',
  ghost: 'text-ink underline-offset-4 hover:underline',
  danger: 'bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100',
};

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 font-semibold transition disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

export const buttonClass = (variant: Variant = 'primary', extra = '') =>
  `inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 font-semibold transition ${VARIANTS[variant]} ${extra}`;

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-surface/80 p-4 shadow-sm ring-1 ring-line ${className}`}>{children}</div>;
}

export function Loading() {
  return <p className="py-10 text-center text-muted">טוען…</p>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-muted focus:ring-2 focus:ring-accent';
