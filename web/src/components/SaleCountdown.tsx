import { useNow } from '../data/hooks';
import { formatTimeLeft } from '../lib/format';

export default function SaleCountdown({ closesAt }: { closesAt: number }) {
  const now = useNow();
  const left = closesAt - now;
  const urgent = left < 24 * 60 * 60 * 1000;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${
        urgent ? 'bg-primary text-on-primary' : 'bg-accent/60 text-ink'
      }`}
    >
      ⏰ {left > 0 ? `נסגר בעוד ${formatTimeLeft(left)}` : 'ההזמנות נסגרו'}
    </span>
  );
}
