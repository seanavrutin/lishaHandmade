import { Link, useNavigate } from 'react-router';
import { Card, Loading, buttonClass } from '../components/ui';
import { api } from '../data';
import { useApiData } from '../data/hooks';
import { formatShortDate, formatShortDateTime } from '../lib/format';
import { SALE_STATUS, duplicateSale, saleState } from './saleUtils';

export default function Sales() {
  const { data: sales, loading } = useApiData(() => api.listSales(), []);
  const navigate = useNavigate();

  if (loading) return <Loading />;

  async function duplicate(id: string) {
    const source = sales?.find((s) => s.id === id);
    if (!source) return;
    const copy = await api.saveSale(duplicateSale(source));
    navigate(`/admin/events/${copy.id}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">אירועים</h1>
        <Link to="/admin/events/new" className={buttonClass('primary', 'text-sm')}>
          + אירוע חדש
        </Link>
      </div>
      <p className="text-sm text-muted">טיפ: ״שכפול״ יוצר את אותו אירוע לשבוע הבא, עם כל התאריכים מוזזים בשבוע.</p>

      <ul className="space-y-3">
        {(sales ?? []).map((s) => {
          const state = saleState(s);
          return (
            <li key={s.id}>
              <Card className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-xs text-muted">
                      נסגר {formatShortDateTime(s.closesAt)} · איסוף {formatShortDate(s.pickupAt)} · {s.orderCount} הזמנות
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${SALE_STATUS[state].className}`}>
                    {SALE_STATUS[state].label}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link to={`/admin/events/${s.id}`} className={buttonClass('secondary', 'flex-1 py-2 text-sm')}>
                    עריכה
                  </Link>
                  <button type="button" onClick={() => duplicate(s.id)} className={buttonClass('secondary', 'flex-1 py-2 text-sm')}>
                    שכפול לשבוע הבא
                  </button>
                  <Link to={`/admin/orders?sale=${s.id}`} className={buttonClass('secondary', 'flex-1 py-2 text-sm')}>
                    הזמנות
                  </Link>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
