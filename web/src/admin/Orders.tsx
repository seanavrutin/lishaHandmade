import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { WhatsAppIcon } from '../components/Layout';
import { Card, Loading, buttonClass, inputClass } from '../components/ui';
import { api, type OrderData } from '../data';
import { useApiData } from '../data/hooks';
import { formatPrice, formatShortDateTime, whatsappLink } from '../lib/format';
import SaleSelect from './SaleSelect';
import { useSelectedSale } from './saleUtils';

const FILTERS = {
  all: { label: 'הכל', test: (o: OrderData) => o.status !== 'cancelled' },
  unpaid: { label: 'לא שולמו', test: (o: OrderData) => o.status !== 'cancelled' && o.paymentStatus !== 'paid' },
  paid: { label: 'שולמו', test: (o: OrderData) => o.status !== 'cancelled' && o.paymentStatus === 'paid' },
  waiting: { label: 'לא נאספו', test: (o: OrderData) => o.status !== 'cancelled' && o.status !== 'picked_up' },
  cancelled: { label: 'בוטלו', test: (o: OrderData) => o.status === 'cancelled' },
} as const;

type FilterKey = keyof typeof FILTERS;

export default function Orders() {
  const { sales, sale, loading, select } = useSelectedSale();
  const [params, setParams] = useSearchParams();
  const filter = (params.get('filter') as FilterKey) in FILTERS ? (params.get('filter') as FilterKey) : 'all';
  const [search, setSearch] = useState('');
  const { data: orders } = useApiData(() => (sale ? api.listOrders(sale.id) : Promise.resolve([])), [sale?.id]);

  if (loading) return <Loading />;
  if (!sale) return <Card>עוד אין מכירות.</Card>;

  const q = search.trim();
  const shown = (orders ?? [])
    .filter(FILTERS[filter].test)
    .filter((o) => !q || o.customer.name.includes(q) || o.customer.phone.includes(q) || String(o.orderNo).includes(q));

  const setFilter = (f: FilterKey) => setParams({ sale: sale.id, filter: f }, { replace: true });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">הזמנות</h1>
        <Link to={`/admin/orders/new?sale=${sale.id}`} className={buttonClass('primary', 'text-sm')}>
          + הזמנה ידנית
        </Link>
      </div>

      <SaleSelect sales={sales} value={sale.id} onChange={select} />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {(Object.keys(FILTERS) as FilterKey[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm ${
              filter === f ? 'bg-primary text-on-primary' : 'bg-surface text-ink ring-1 ring-line'
            }`}
          >
            {FILTERS[f].label} ({(orders ?? []).filter(FILTERS[f].test).length})
          </button>
        ))}
      </div>

      <input
        className={inputClass}
        placeholder="חיפוש לפי שם, טלפון או מספר הזמנה"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        type="search"
      />

      {shown.length === 0 ? (
        <p className="py-6 text-center text-muted">אין הזמנות להצגה</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((o) => (
            <li key={o.id}>
              <OrderCard order={o} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: OrderData }) {
  const paid = order.paymentStatus === 'paid';
  const pickedUp = order.status === 'picked_up';
  const cancelled = order.status === 'cancelled';
  const update = (patch: Parameters<typeof api.updateOrder>[1]) => api.updateOrder(order.id, patch);

  const reminder = `היי ${order.customer.name.split(' ')[0]}, תזכורת קטנה לתשלום ${formatPrice(order.total)} על הזמנה #${order.orderNo} 💕\nתודה, ליאור`;

  return (
    <Card className={`space-y-3 ${cancelled ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">
            #{order.orderNo} · {order.customer.name}
          </p>
          <p className="text-xs text-muted">
            <span dir="ltr">{order.customer.phone}</span> · {formatShortDateTime(order.createdAt)} ·{' '}
            {order.paymentMethod === 'paybox' ? 'PayBox' : 'תשלום באיסוף'}
          </p>
        </div>
        <span className="text-lg font-bold">{formatPrice(order.total)}</span>
      </div>

      <ul className="text-sm">
        {order.items.map((i, idx) => (
          <li key={idx}>
            {i.qty} × {i.name}
            {i.addonNames.length > 0 && <span className="text-muted"> ({i.addonNames.join(', ')})</span>}
          </li>
        ))}
      </ul>

      {order.notes && <p className="rounded-lg bg-line/50 p-2 text-sm">📝 {order.notes}</p>}

      {!cancelled && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => update({ paymentStatus: paid ? 'unpaid' : 'paid' })}
            className={`rounded-xl py-2 text-sm font-semibold ring-1 ${
              paid ? 'bg-green-100 text-green-800 ring-green-200' : 'bg-surface text-ink ring-line'
            }`}
          >
            {paid ? '✓ שולם' : 'סימון כשולם'}
          </button>
          <button
            type="button"
            onClick={() => update({ status: pickedUp ? 'new' : 'picked_up' })}
            className={`rounded-xl py-2 text-sm font-semibold ring-1 ${
              pickedUp ? 'bg-green-100 text-green-800 ring-green-200' : 'bg-surface text-ink ring-line'
            }`}
          >
            {pickedUp ? '✓ נאסף' : 'סימון כנאסף'}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <a href={`tel:${order.customer.phone}`} className="underline">
          📞 התקשרות
        </a>
        <a href={whatsappLink(order.customer.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
          <WhatsAppIcon className="h-4 w-4" /> וואטסאפ
        </a>
        {!paid && !cancelled && (
          <a href={whatsappLink(order.customer.phone, reminder)} target="_blank" rel="noreferrer" className="underline">
            🔔 תזכורת תשלום
          </a>
        )}
        <button
          type="button"
          className="mr-auto text-muted underline"
          onClick={() => {
            if (cancelled) update({ status: 'new' });
            else if (confirm(`לבטל את הזמנה #${order.orderNo}? המלאי יוחזר למכירה.`)) update({ status: 'cancelled' });
          }}
        >
          {cancelled ? 'שחזור הזמנה' : 'ביטול'}
        </button>
      </div>
    </Card>
  );
}
