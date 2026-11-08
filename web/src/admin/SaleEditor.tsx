import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { PICKUP_TBD, pickupHours, pickupSummary } from '@shared/pickup';
import type { PaymentMethod, SaleItem, SaleStatus } from '@shared/types';
import { WhatsAppIcon } from '../components/Layout';
import { Button, Card, Field, Loading, ProductImage, buttonClass, inputClass } from '../components/ui';
import { api, type SaleData } from '../data';
import { useApiData } from '../data/hooks';
import { nextWeekday } from '../data/seed';
import { formatPrice, fromDateTimeInput, toDateTimeInput } from '../lib/format';
import { SALE_STATUS, shareText } from './saleUtils';
import SortableList from './SortableList';

function emptySale(): SaleData {
  const closesAt = nextWeekday(3, 17);
  return {
    id: '',
    title: 'הזמנות לסופ״ש',
    message: 'שבוע טוב לכולם 💕\nפותחת הזמנות לסופ״ש הקרוב!',
    opensAt: Date.now(),
    closesAt,
    pickupAt: nextWeekday(5, 12, new Date(closesAt)),
    pickupFrom: '',
    pickupUntil: '',
    pickupText: PICKUP_TBD,
    location: '',
    status: 'draft',
    paymentModes: ['paybox', 'pickup'],
    maxOrders: null,
    items: [],
    sold: {},
    orderCount: 0,
  };
}

/** Per-product settings in the editor; turned into SaleItem snapshots on save. */
interface ItemDraft {
  included: boolean;
  price: string;
  maxQty: string;
  special: boolean;
}

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'paybox', label: 'PayBox' },
  { value: 'pickup', label: 'תשלום באיסוף' },
];

export default function SaleEditor() {
  const { id = 'new' } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { data: products } = useApiData(() => api.listProducts(), []);

  const [sale, setSale] = useState<SaleData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, ItemDraft>>({});
  /** Product ids in the order customers will see them (dragged in the editor). */
  const [order, setOrder] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Load once per id (not on every data change, so typing isn't overwritten).
  useEffect(() => {
    let alive = true;
    const load = isNew
      ? api.getSettings().then((s) => ({ ...emptySale(), location: s.pickupAddress }))
      : api.getSale(id);
    load.then((s) => {
      if (!alive) return;
      if (s) setSale(s);
      else setNotFound(true);
    });
    return () => {
      alive = false;
    };
  }, [id, isNew]);

  useEffect(() => {
    if (!sale || !products) return;
    setDrafts((prev) => {
      if (Object.keys(prev).length) return prev;
      const next: Record<string, ItemDraft> = {};
      for (const p of products) {
        const item = sale.items.find((i) => i.productId === p.id);
        next[p.id] = {
          // New events start empty: Lior ticks what she offers this time.
          included: !isNew && !!item,
          price: String(item?.price ?? p.basePrice),
          maxQty: item?.maxQty != null ? String(item.maxQty) : '',
          special: !!item?.special,
        };
      }
      return next;
    });
    setOrder((prev) => {
      if (prev.length) return prev;
      // This sale's items in their saved order first, then the rest of the catalog.
      const inSale = [...sale.items].sort((a, b) => a.sort - b.sort).map((i) => i.productId);
      const rest = products.map((p) => p.id).filter((pid) => !inSale.includes(pid));
      return [...inSale.filter((pid) => products.some((p) => p.id === pid)), ...rest];
    });
  }, [sale, products, isNew]);

  if (notFound) return <Card>האירוע לא נמצא</Card>;
  if (!sale || !products) return <Loading />;

  const set = <K extends keyof SaleData>(key: K, value: SaleData[K]) => setSale({ ...sale, [key]: value });
  const setDraft = (pid: string, patch: Partial<ItemDraft>) => setDrafts({ ...drafts, [pid]: { ...drafts[pid], ...patch } });
  // The customer-facing text changes only when an hour is touched, so older events keep their wording until edited.
  const setPickupHours = (from: string, until: string) =>
    setSale({ ...sale, pickupFrom: from, pickupUntil: until, pickupText: pickupHours(from, until) });

  // Every catalog product, in the dragged order.
  const visibleIds = order.filter((pid) => products.some((x) => x.id === pid));

  function buildItems(): SaleItem[] {
    return order
      .map((pid) => products!.find((p) => p.id === pid)!)
      .filter((p) => p && drafts[p.id]?.included)
      .map((p, index) => ({
        productId: p.id,
        name: p.name,
        description: p.description,
        imageUrl: p.imageUrl,
        category: p.category,
        price: Number(drafts[p.id].price) || p.basePrice,
        addons: p.addons,
        maxQty: drafts[p.id].maxQty === '' ? null : Math.max(0, Math.floor(Number(drafts[p.id].maxQty))),
        sort: index,
        special: drafts[p.id].special,
      }));
  }

  async function save(status: SaleStatus = sale!.status) {
    const items = buildItems();
    if (!sale!.title.trim()) return setError('נא למלא כותרת');
    if (items.length === 0) return setError('יש לבחור לפחות מוצר אחד');
    if (sale!.closesAt <= sale!.opensAt) return setError('מועד הסגירה חייב להיות אחרי מועד הפתיחה');
    if (sale!.pickupFrom && sale!.pickupUntil && sale!.pickupFrom >= sale!.pickupUntil) {
      return setError('שעת סיום האיסוף חייבת להיות אחרי שעת ההתחלה');
    }
    if (sale!.paymentModes.length === 0) return setError('יש לבחור לפחות אמצעי תשלום אחד');

    setSaving(true);
    setError('');
    try {
      const saved = await api.saveSale({ ...sale!, status, items });
      setSale(saved);
      if (isNew) navigate(`/admin/events/${saved.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    const msg = sale!.orderCount
      ? `לאירוע יש ${sale!.orderCount} הזמנות – הן יימחקו גם כן. למחוק בכל זאת?`
      : 'למחוק את האירוע?';
    if (!confirm(msg)) return;
    await api.deleteSale(sale!.id);
    navigate('/admin/events');
  }

  const dateField = (label: string, key: 'opensAt' | 'closesAt') => (
    <Field label={label}>
      <input
        type="datetime-local"
        className={inputClass}
        value={toDateTimeInput(sale[key])}
        onChange={(e) => e.target.value && set(key, fromDateTimeInput(e.target.value))}
      />
    </Field>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">{isNew ? 'אירוע חדש' : 'עריכת אירוע'}</h1>
        <Link to="/admin/events" className="text-sm underline">
          → לכל האירועים
        </Link>
      </div>

      {!isNew && (
        <Card className="flex items-center justify-between gap-2">
          <span>
            סטטוס:{' '}
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SALE_STATUS[sale.status].className}`}>
              {SALE_STATUS[sale.status].label}
            </span>
          </span>
          <div className="flex gap-2">
            {sale.status !== 'open' && (
              <Button className="py-1.5 text-sm" onClick={() => save('open')} disabled={saving}>
                פרסום
              </Button>
            )}
            {sale.status === 'open' && (
              <Button variant="secondary" className="py-1.5 text-sm" onClick={() => save('closed')} disabled={saving}>
                סגירת הזמנות
              </Button>
            )}
          </div>
        </Card>
      )}

      <Card className="space-y-3">
        <Field label="כותרת">
          <input className={inputClass} value={sale.title} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <Field label="הודעה ללקוחות" hint="מופיעה באתר ובהודעת הוואטסאפ">
          <textarea className={inputClass} rows={4} value={sale.message} onChange={(e) => set('message', e.target.value)} />
        </Field>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">מועדי הזמנה</h2>
        {dateField('פתיחת הזמנות', 'opensAt')}
        {dateField('הזמנות אחרונות עד', 'closesAt')}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">איסוף עצמי</h2>
        <Field label="תאריך איסוף">
          <input
            type="date"
            className={inputClass}
            value={toDateTimeInput(sale.pickupAt).slice(0, 10)}
            onChange={(e) => e.target.value && set('pickupAt', fromDateTimeInput(`${e.target.value}T12:00`))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="משעה (לא חובה)">
            <input
              type="time"
              dir="ltr"
              className={inputClass}
              value={sale.pickupFrom ?? ''}
              onChange={(e) => setPickupHours(e.target.value, sale.pickupUntil ?? '')}
            />
          </Field>
          <Field label="עד שעה">
            <input
              type="time"
              dir="ltr"
              className={inputClass}
              value={sale.pickupUntil ?? ''}
              onChange={(e) => setPickupHours(sale.pickupFrom ?? '', e.target.value)}
            />
          </Field>
        </div>
        <p className="rounded-xl bg-line/50 p-2.5 text-sm">
          יוצג ללקוחות: <strong>איסוף עצמי: {pickupSummary(sale.pickupAt, sale.pickupText)}</strong>
        </p>
        {(sale.pickupFrom || sale.pickupUntil) && (
          <button type="button" className="text-sm underline" onClick={() => setPickupHours('', '')}>
            השעה עוד לא נקבעה – ניקוי השעות
          </button>
        )}
        <Field label="מקום האיסוף">
          <input className={inputClass} value={sale.location} onChange={(e) => set('location', e.target.value)} />
        </Field>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">תשלום והגבלות</h2>
        <div className="flex flex-wrap gap-4">
          {PAYMENT_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-5 w-5 accent-primary"
                checked={sale.paymentModes.includes(opt.value)}
                onChange={(e) =>
                  set(
                    'paymentModes',
                    e.target.checked ? [...sale.paymentModes, opt.value] : sale.paymentModes.filter((m) => m !== opt.value),
                  )
                }
              />
              {opt.label}
            </label>
          ))}
        </div>
        <Field label="מקסימום הזמנות לאירוע" hint="ריק = ללא הגבלה">
          <input
            className={inputClass}
            type="number"
            inputMode="numeric"
            min={1}
            value={sale.maxOrders ?? ''}
            onChange={(e) => set('maxOrders', e.target.value === '' ? null : Number(e.target.value))}
          />
        </Field>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">מוצרים באירוע</h2>
        <p className="text-xs text-muted">
          גוררים את ⋮⋮ כדי לקבוע את סדר ההופעה באתר. אפשר לשנות מחיר לאירוע הזה ולהגביל כמות (ריק = ללא הגבלה).
        </p>
        <SortableList
          ids={visibleIds}
          onReorder={(ids) => setOrder([...ids, ...order.filter((pid) => !ids.includes(pid))])}
          renderItem={(pid, handle) => {
            const p = products.find((x) => x.id === pid)!;
            const d = drafts[pid];
            if (!d) return null;
            return (
              <div className={`rounded-xl bg-surface p-2.5 ring-1 ${d.included ? 'ring-primary/40' : 'opacity-70 ring-line'}`}>
                <div className="flex items-center gap-2">
                  {handle}
                  <label className="flex flex-1 items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-primary"
                    checked={d.included}
                    onChange={(e) => setDraft(p.id, { included: e.target.checked })}
                  />
                  <ProductImage src={p.imageUrl} category={p.category} className="h-10 w-10 rounded-lg" />
                  <span className="flex-1 text-sm font-semibold">{p.name}</span>
                  <span className="text-xs text-muted">{formatPrice(p.basePrice)}</span>
                  </label>
                </div>
                {d.included && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Field label="מחיר (₪)">
                      <input
                        className={inputClass}
                        type="number"
                        inputMode="numeric"
                        value={d.price}
                        onChange={(e) => setDraft(p.id, { price: e.target.value })}
                      />
                    </Field>
                    <Field label={`כמות מקסימלית${sale.sold[p.id] ? ` (נמכרו ${sale.sold[p.id]})` : ''}`}>
                      <input
                        className={inputClass}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder="ללא הגבלה"
                        value={d.maxQty}
                        onChange={(e) => setDraft(p.id, { maxQty: e.target.value })}
                      />
                    </Field>
                    <label
                      className={`col-span-2 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 transition ${
                        d.special ? 'bg-accent/50 font-semibold ring-accent-strong' : 'ring-line'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-5 w-5 accent-primary"
                        checked={d.special}
                        onChange={(e) => setDraft(p.id, { special: e.target.checked })}
                      />
                      <span className="text-accent-strong" aria-hidden="true">
                        ★
                      </span>
                      ספיישל – יסומן ב-״★ ספיישל״ באתר
                    </label>
                  </div>
                )}
              </div>
            );
          }}
        />
      </Card>

      {error && <p className="rounded-xl bg-red-50 p-3 text-red-700 ring-1 ring-red-200">{error}</p>}

      <div className="flex flex-col gap-2">
        {isNew ? (
          <>
            <Button onClick={() => save('open')} disabled={saving} className="py-3">
              שמירה ופרסום
            </Button>
            <Button variant="secondary" onClick={() => save('draft')} disabled={saving}>
              שמירה כטיוטה
            </Button>
          </>
        ) : (
          <Button onClick={() => save()} disabled={saving} className="py-3">
            {saving ? 'שומר…' : 'שמירת שינויים'}
          </Button>
        )}
        {!isNew && sale.status === 'open' && (
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText(sale))}`}
            target="_blank"
            rel="noreferrer"
            className={buttonClass('secondary')}
          >
            <WhatsAppIcon className="h-5 w-5" /> שיתוף בוואטסאפ
          </a>
        )}
        {!isNew && (
          <Button variant="danger" onClick={remove}>
            מחיקת אירוע
          </Button>
        )}
      </div>
    </div>
  );
}
