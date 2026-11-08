import { Link } from 'react-router';
import { cartSummary, useCart } from '../cart/cart';
import ProductPicker from '../components/ProductPicker';
import SaleCountdown from '../components/SaleCountdown';
import { Card, Loading, buttonClass } from '../components/ui';
import { api } from '../data';
import { useApiData } from '../data/hooks';
import ClosedNotice from '../components/ClosedNotice';
import { formatDateTime, formatPrice } from '../lib/format';

export default function Order() {
  const { data: sale, loading } = useApiData(() => api.getOpenSale(), []);
  const cart = useCart();

  if (loading) return <Loading />;

  if (!sale) {
    return (
      <div className="py-16 text-center">
        <ClosedNotice />
        <Link to="/" className={buttonClass('secondary', 'mt-6')}>
          חזרה לדף הבית
        </Link>
      </div>
    );
  }

  const lines = cart.saleId === sale.id ? cart.lines : [];
  const { count, total } = cartSummary(sale, lines);

  return (
    <div className="space-y-6 pb-28 pt-6">
      <Card className="space-y-2">
        <SaleCountdown closesAt={sale.closesAt} />
        <h1 className="font-display text-3xl">{sale.title}</h1>
        <p className="text-sm">
          הזמנות אחרונות עד <strong>{formatDateTime(sale.closesAt)}</strong>
          <br />
          איסוף: <strong>{sale.pickupText}</strong>
          {sale.location && <> · {sale.location}</>}
        </p>
      </Card>

      <ProductPicker
        sale={sale}
        tabs
        linesFor={(pid) => (cart.saleId === sale.id ? cart.linesFor(pid) : [])}
        setLines={(pid, lines) => cart.setProductLines(sale.id, pid, lines)}
      />

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-page/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
          <Link
            to="/checkout"
            className="mx-auto flex max-w-3xl items-center justify-between rounded-full bg-primary px-5 py-3.5 text-on-primary shadow-lg"
          >
            <span className="text-sm">
              {count} פריטים · <strong className="text-base">{formatPrice(total)}</strong>
            </span>
            <span className="font-semibold">להמשך ←</span>
          </Link>
        </div>
      )}
    </div>
  );
}
