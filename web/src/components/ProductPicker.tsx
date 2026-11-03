import { useEffect, useRef, useState } from 'react';
import type { Category, SaleItem } from '@shared/types';
import { addonCount, buildProductLines, type CartLine } from '../cart/cart';
import type { SaleData } from '../data';
import { formatPrice } from '../lib/format';
import { ProductImage, Stepper } from './ui';

interface Props {
  sale: SaleData;
  linesFor: (productId: string) => CartLine[];
  setLines: (productId: string, lines: CartLine[]) => void;
  /** Admin manual orders ignore stock limits. */
  ignoreStock?: boolean;
  /** Sticky category tabs; `tabsTop` is the Tailwind top offset under the sticky header. */
  tabs?: boolean;
  tabsTop?: string;
}

/** Section key for items marked "special" in the event; they also stay in their own category. */
const SPECIALS = '__specials__';
const sectionTitle = (key: string) => (key === SPECIALS ? '★ מיוחדים ★' : key);

/** Product cards grouped by category, with optional sticky category tabs that follow the scroll. */
export default function ProductPicker({ sale, linesFor, setLines, ignoreStock, tabs, tabsTop = 'top-14' }: Props) {
  const items = [...sale.items].sort((a, b) => a.sort - b.sort);
  const hasSpecials = !!tabs && items.some((i) => i.special);
  const categories = [...(hasSpecials ? [SPECIALS] : []), ...new Set(items.map((i) => i.category))] as Category[];
  const itemsOf = (key: string) => (key === SPECIALS ? items.filter((i) => i.special) : items.filter((i) => i.category === key));
  const [active, setActive] = useState<Category>(categories[0]);
  const sections = useRef(new Map<Category, HTMLElement>());

  // Highlight the tab of the section currently under the tabs.
  useEffect(() => {
    if (!tabs) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.getAttribute('data-category') as Category);
      },
      { rootMargin: '-130px 0px -55% 0px' },
    );
    sections.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [tabs, categories.join()]);

  const jump = (c: Category) => {
    setActive(c);
    sections.current.get(c)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-8">
      {tabs && categories.length > 1 && (
        <nav className={`sticky ${tabsTop} z-20 -mx-4 bg-page/90 px-4 py-2 backdrop-blur`} aria-label="קטגוריות">
          <div className="flex gap-1 overflow-x-auto rounded-full bg-surface p-1 shadow-sm ring-1 ring-line">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => jump(c)}
                aria-current={active === c}
                className={`flex-1 shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition ${
                  active === c ? 'bg-primary text-on-primary shadow' : 'text-muted hover:text-ink'
                }`}
              >
                {sectionTitle(c)}
              </button>
            ))}
          </div>
        </nav>
      )}

      {categories.map((category) => (
        <section
          key={category}
          data-category={category}
          ref={(el) => {
            if (el) sections.current.set(category, el);
            else sections.current.delete(category);
          }}
          className="scroll-mt-32 space-y-3"
        >
          <h2 className={`font-display text-2xl ${category === SPECIALS ? 'text-accent-strong' : ''}`}>{sectionTitle(category)}</h2>
          {itemsOf(category).map((item) => (
              <ProductCard
                key={item.productId}
                item={item}
                specialBadge={!!item.special && category !== SPECIALS && hasSpecials}
                lines={linesFor(item.productId)}
                left={item.maxQty == null || ignoreStock ? null : Math.max(item.maxQty - (sale.sold[item.productId] ?? 0), 0)}
                onChange={(lines) => setLines(item.productId, lines)}
              />
            ))}
        </section>
      ))}
    </div>
  );
}

/**
 * One stepper for the total, then per add-on "how many of them with it" (never more than the total).
 * E.g. 3 quiches, of which 2 with cheese → cart lines: 1 plain + 2 with cheese.
 */
function ProductCard({
  item,
  lines,
  left,
  onChange,
  specialBadge,
}: {
  item: SaleItem;
  specialBadge?: boolean;
  lines: CartLine[];
  left: number | null;
  onChange: (lines: CartLine[]) => void;
}) {
  const total = lines.reduce((s, l) => s + l.qty, 0);
  const counts = Object.fromEntries(item.addons.map((a) => [a.id, addonCount(lines, a.id)]));
  const addonOrder = item.addons.map((a) => a.id);
  const soldOut = left === 0;
  const lineTotal = item.price * total + item.addons.reduce((s, a) => s + a.price * counts[a.id], 0);

  const update = (nextTotal: number, nextCounts: Record<string, number>) =>
    onChange(buildProductLines(item.productId, nextTotal, nextCounts, addonOrder));

  return (
    <article
      className={`rounded-2xl bg-surface/80 p-3 shadow-sm ring-1 transition ${soldOut ? 'opacity-60' : ''} ${
        total > 0 ? 'ring-2 ring-primary/40' : 'ring-line'
      }`}
    >
      <div className="flex gap-3">
        <ProductImage src={item.imageUrl} category={item.category} className="h-24 w-24 shrink-0 rounded-xl" />
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="font-semibold leading-snug">
            {item.name}
            {specialBadge && (
              <span className="mr-1.5 inline-block whitespace-nowrap rounded-full bg-accent/60 px-2 py-0.5 align-middle text-[11px] font-semibold text-accent-strong">
                ★ מיוחד
              </span>
            )}
          </h3>
          {item.description && <p className="mt-0.5 text-sm text-muted">{item.description}</p>}
          {left != null && (
            <p className={`mt-1 text-xs font-semibold ${soldOut ? 'text-red-700' : 'text-accent-strong'}`}>
              {soldOut ? 'אזל המלאי' : left <= 5 ? `נשארו ${left} אחרונים!` : `נשארו ${left}`}
            </p>
          )}
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="text-lg font-bold tabular-nums">{formatPrice(item.price)}</span>
            <Stepper value={total} max={left ?? 20} onChange={(n) => update(n, counts)} label={item.name} />
          </div>
        </div>
      </div>

      {item.addons.length > 0 &&
        (total === 0 ? (
          <p className="mt-2 text-xs text-muted">
            {item.addons.map((a) => `אפשר להוסיף ${a.name} (+${formatPrice(a.price)})`).join(' · ')}
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {item.addons.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 rounded-xl bg-accent/35 px-3 py-2">
                <span className="text-sm">
                  מתוכם עם <strong>{a.name}</strong>{' '}
                  <span className="whitespace-nowrap text-muted">(+{formatPrice(a.price)})</span>
                </span>
                <Stepper
                  value={counts[a.id]}
                  max={total}
                  onChange={(n) => update(total, { ...counts, [a.id]: n })}
                  label={`${item.name} עם ${a.name}`}
                />
              </div>
            ))}
            <p className="px-1 text-xs text-muted">
              {total} יח׳
              {item.addons.map((a) => (counts[a.id] > 0 ? ` · ${counts[a.id]} עם ${a.name}` : '')).join('')}
              {' · '}
              <strong className="text-ink">{formatPrice(lineTotal)}</strong>
            </p>
          </div>
        ))}
    </article>
  );
}
