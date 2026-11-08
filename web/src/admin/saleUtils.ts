import { useSearchParams } from 'react-router';
import { pickupSummary } from '@shared/pickup';
import type { SaleStatus } from '@shared/types';
import { api, type SaleData } from '../data';
import { useApiData } from '../data/hooks';
import { formatDateTime } from '../lib/format';

export const SALE_STATUS: Record<SaleStatus, { label: string; className: string }> = {
  draft: { label: 'טיוטה', className: 'bg-line text-ink' },
  open: { label: 'פתוח', className: 'bg-green-100 text-green-800' },
  closed: { label: 'סגור', className: 'bg-gray-200 text-gray-700' },
};

/** Effective state for display: an "open" sale whose deadline passed shows as closed. */
export function saleState(sale: SaleData, now = Date.now()): SaleStatus {
  return sale.status === 'open' && now >= sale.closesAt ? 'closed' : sale.status;
}

/** The sale selected via ?sale=…, defaulting to the open sale, else the most recent one. */
export function useSelectedSale() {
  const [params, setParams] = useSearchParams();
  const { data: sales, loading } = useApiData(() => api.listSales(), []);
  const requested = params.get('sale');
  const sale =
    sales?.find((s) => s.id === requested) ?? sales?.find((s) => saleState(s) === 'open') ?? sales?.[0] ?? null;

  return {
    sales: sales ?? [],
    sale,
    loading,
    select: (id: string) => setParams({ sale: id }, { replace: true }),
  };
}

/** WhatsApp text Lior sends to customers when opening a sale. */
export function shareText(sale: SaleData) {
  const url = `${window.location.origin}/order`;
  return `${sale.message}\n\nהזמנות אחרונות עד *${formatDateTime(sale.closesAt)}*\nאיסוף עצמי: ${pickupSummary(sale.pickupAt, sale.pickupText)}\n\nלהזמנה 👇\n${url}`;
}

const WEEK = 7 * 24 * 60 * 60 * 1000;

/** Copy of a sale as a new draft, moved forward by whole weeks until its deadline is in the future. */
export function duplicateSale(sale: SaleData, now = Date.now()): SaleData {
  let shift = WEEK;
  while (sale.closesAt + shift <= now) shift += WEEK;
  return {
    ...sale,
    id: '',
    status: 'draft',
    opensAt: Math.max(sale.opensAt + shift, now),
    closesAt: sale.closesAt + shift,
    pickupAt: sale.pickupAt + shift,
    sold: {},
    orderCount: 0,
  };
}
