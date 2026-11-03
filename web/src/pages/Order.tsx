import { formatDateTime, formatPrice } from '../lib/format';
import { useOpenSale } from '../lib/useOpenSale';

// Phase 1 TODO: steppers per item/add-on, sticky cart bar, checkout form → createOrder.
export default function Order() {
  const { loading, sale } = useOpenSale();

  if (loading) return <p className="py-10 text-center">טוען…</p>;

  if (!sale) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-2xl">אין כרגע הזמנות פתוחות</h1>
        <p className="mt-2 text-cocoa-light">עקבו אחריי בוואטסאפ כדי לשמוע על המכירה הבאה 💕</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8">
      <header>
        <h1 className="font-display text-3xl">{sale.title}</h1>
        <p className="mt-1">הזמנות אחרונות עד {formatDateTime(sale.closesAt.toDate())}</p>
        <p className="text-sm text-cocoa-light">איסוף: {sale.pickupText}</p>
      </header>

      <ul className="space-y-3">
        {[...sale.items]
          .sort((a, b) => a.sort - b.sort)
          .map((item) => (
            <li key={item.productId} className="rounded-2xl bg-white/70 p-4 shadow-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{item.name}</span>
                <span>{formatPrice(item.price)}</span>
              </div>
              {item.description && (
                <p className="mt-1 text-sm text-cocoa-light">{item.description}</p>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}
