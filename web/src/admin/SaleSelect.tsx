import type { SaleData } from '../data';
import { inputClass } from '../components/ui';
import { formatShortDateTime } from '../lib/format';
import { SALE_STATUS, saleState } from './saleUtils';

export default function SaleSelect({
  sales,
  value,
  onChange,
}: {
  sales: SaleData[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} aria-label="בחירת מכירה">
      {sales.map((s) => (
        <option key={s.id} value={s.id}>
          {s.title} · {SALE_STATUS[saleState(s)].label} · נסגרת {formatShortDateTime(s.closesAt)}
        </option>
      ))}
    </select>
  );
}
