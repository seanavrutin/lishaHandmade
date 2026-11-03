import { Link } from 'react-router';
import { WhatsAppIcon } from '../components/Layout';
import { Button, Card, Loading, buttonClass } from '../components/ui';
import { api } from '../data';
import { useApiData, useNow } from '../data/hooks';
import { formatDateTime, formatPrice, formatTimeLeft } from '../lib/format';
import { computeProduction, orderStats } from './production';
import SaleSelect from './SaleSelect';
import { SALE_STATUS, saleState, shareText, useSelectedSale } from './saleUtils';

export default function Dashboard() {
  const { sales, sale, loading, select } = useSelectedSale();
  const { data: orders } = useApiData(() => (sale ? api.listOrders(sale.id) : Promise.resolve([])), [sale?.id]);
  const now = useNow();

  if (loading) return <Loading />;
  if (!sale) {
    return (
      <Card className="text-center">
        <p>עוד אין אירועים.</p>
        <Link to="/admin/events/new" className={buttonClass('primary', 'mt-3')}>
          פתיחת אירוע ראשון
        </Link>
      </Card>
    );
  }

  const state = saleState(sale, now);
  const stats = orderStats(orders ?? []);
  const production = computeProduction(orders ?? []);

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <SaleSelect sales={sales} value={sale.id} onChange={select} />
      </div>

      <Card className="space-y-2 print:hidden">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-display text-2xl">{sale.title}</h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SALE_STATUS[state].className}`}>
            {SALE_STATUS[state].label}
          </span>
        </div>
        <p className="text-sm">
          {state === 'open' ? (
            <>
              נסגר בעוד <strong>{formatTimeLeft(sale.closesAt - now)}</strong> ({formatDateTime(sale.closesAt)})
            </>
          ) : (
            <>מועד סגירה: {formatDateTime(sale.closesAt)}</>
          )}
          <br />
          איסוף: {sale.pickupText} · {formatDateTime(sale.pickupAt)}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {state === 'open' && (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText(sale))}`}
              target="_blank"
              rel="noreferrer"
              className={buttonClass('primary', 'text-sm')}
            >
              <WhatsAppIcon className="h-4 w-4" /> שיתוף בוואטסאפ
            </a>
          )}
          <Link to={`/admin/events/${sale.id}`} className={buttonClass('secondary', 'text-sm')}>
            עריכת אירוע
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 print:hidden">
        <Stat label="הזמנות" value={String(stats.count)} to={`/admin/orders?sale=${sale.id}`} />
        <Stat label="סה״כ הכנסות" value={formatPrice(stats.revenue)} />
        <Stat label="שולם" value={formatPrice(stats.paid)} />
        <Stat
          label={`ממתין לתשלום (${stats.unpaidCount})`}
          value={formatPrice(stats.unpaid)}
          to={`/admin/orders?sale=${sale.id}&filter=unpaid`}
          highlight={stats.unpaidCount > 0}
        />
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl">סיכום הכנה 👩‍🍳</h2>
          <Button variant="ghost" className="px-2 text-sm print:hidden" onClick={() => window.print()}>
            🖨️ הדפסה
          </Button>
        </div>
        <p className="mb-2 hidden text-sm print:block">
          {sale.title} · איסוף {formatDateTime(sale.pickupAt)}
        </p>
        {production.length === 0 ? (
          <p className="text-muted">עוד אין הזמנות.</p>
        ) : (
          <ul className="divide-y divide-line">
            {production.map((row) => (
              <li key={row.productId} className="py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{row.name}</span>
                  <span className="text-2xl font-bold tabular-nums">{row.total}</span>
                </div>
                {row.variants.length > 0 && (
                  <p className="text-sm text-muted">{row.variants.map((v) => `${v.label}: ${v.qty}`).join(' · ')}</p>
                )}
                {row.unpaid > 0 && <p className="text-xs text-accent-strong">מתוכם {row.unpaid} עדיין לא שולמו</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, to, highlight }: { label: string; value: string; to?: string; highlight?: boolean }) {
  const body = (
    <Card className={`h-full ${highlight ? 'ring-2 ring-accent-strong' : ''}`}>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </Card>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}
