import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import type { PaymentMethod } from '@shared/types';
import { cartSummary, replaceProductLines, type CartLine } from '../cart/cart';
import ProductPicker from '../components/ProductPicker';
import { Button, Card, Field, Loading, inputClass } from '../components/ui';
import { api } from '../data';
import { formatPrice } from '../lib/format';
import SaleSelect from './SaleSelect';
import { useSelectedSale } from './saleUtils';

/** For orders Lior takes by phone – also allowed after the sale closed, and without stock limits. */
export default function ManualOrder() {
  const { sales, sale, loading, select } = useSelectedSale();
  const navigate = useNavigate();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pickup');
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) return <Loading />;
  if (!sale) return <Card>עוד אין מכירות.</Card>;

  const { count, total } = cartSummary(sale, lines);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!sale) return;
    setSaving(true);
    setError('');
    try {
      const res = await api.createManualOrder({ saleId: sale.id, customer: { name, phone }, notes, paymentMethod, items: lines });
      if (alreadyPaid) await api.updateOrder(res.orderId, { paymentStatus: 'paid' });
      navigate(`/admin/orders?sale=${sale.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירה');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">הזמנה ידנית</h1>
        <Link to={`/admin/orders?sale=${sale.id}`} className="text-sm underline">
          ביטול
        </Link>
      </div>

      <SaleSelect
        sales={sales}
        value={sale.id}
        onChange={(id) => {
          setLines([]);
          select(id);
        }}
      />

      <ProductPicker
        sale={sale}
        ignoreStock
        linesFor={(pid) => lines.filter((l) => l.productId === pid)}
        setLines={(pid, productLines) => setLines((prev) => replaceProductLines(prev, pid, productLines))}
      />

      <Card className="space-y-3">
        <Field label="שם הלקוח/ה">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="טלפון">
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" dir="ltr" required />
        </Field>
        <Field label="הערות">
          <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <Field label="אמצעי תשלום">
          <select className={inputClass} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
            <option value="pickup">תשלום באיסוף</option>
            <option value="paybox">PayBox</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={alreadyPaid} onChange={(e) => setAlreadyPaid(e.target.checked)} className="h-5 w-5 accent-primary" />
          כבר שולם
        </label>
      </Card>

      {error && <p className="rounded-xl bg-red-50 p-3 text-red-700 ring-1 ring-red-200">{error}</p>}

      <Button type="submit" disabled={saving || count === 0} className="w-full py-3">
        {saving ? 'שומר…' : `שמירת הזמנה · ${count} פריטים · ${formatPrice(total)}`}
      </Button>
    </form>
  );
}
