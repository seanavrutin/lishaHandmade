import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { isValidEmail, isValidIsraeliMobile } from '@shared/orderLogic';
import type { PaymentMethod } from '@shared/types';
import { cartSummary, useCart } from '../cart/cart';
import { Button, Card, Field, Loading, buttonClass, inputClass } from '../components/ui';
import { api } from '../data';
import { useApiData } from '../data/hooks';
import ClosedNotice from '../components/ClosedNotice';
import { formatDateTime, formatPrice } from '../lib/format';
import { loadCustomer, saveCustomer, saveLastOrder } from '../lib/lastOrder';

const PAYMENT_LABELS: Record<PaymentMethod, { title: string; text: string }> = {
  paybox: { title: 'PayBox', text: 'תשלום בקישור מיד אחרי ההזמנה' },
  pickup: { title: 'תשלום באיסוף', text: 'מזומן או ביט בזמן האיסוף' },
};

export default function Checkout() {
  const { data: sale, loading } = useApiData(() => api.getOpenSale(), []);
  const cart = useCart();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(loadCustomer);
  const [notes, setNotes] = useState('');
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  if (loading) return <Loading />;

  const lines = sale && cart.saleId === sale.id ? cart.lines : [];
  const summary = sale ? cartSummary(sale, lines) : null;

  if (!sale || !summary || summary.count === 0) {
    return (
      <div className="py-16 text-center">
        {sale ? <h1 className="font-display text-2xl">הסל ריק</h1> : <ClosedNotice />}
        <Link to={sale ? '/order' : '/'} className={buttonClass('primary', 'mt-6')}>
          {sale ? 'לתפריט' : 'לדף הבית'}
        </Link>
      </div>
    );
  }

  const paymentMethod = payment ?? sale.paymentModes[0];
  const nameError = customer.name.trim().length < 2 ? 'נא למלא שם מלא' : '';
  const phoneError = !isValidIsraeliMobile(customer.phone) ? 'נא למלא מספר נייד תקין (05X)' : '';
  const emailError = !isValidEmail(customer.email) ? 'נא למלא כתובת מייל תקינה' : '';
  const agreeError = !agreed ? 'יש לאשר את התקנון' : '';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (nameError || phoneError || emailError || agreeError || !sale || !summary) return;

    setSending(true);
    setError('');
    try {
      const res = await api.createOrder({
        saleId: sale.id,
        customer,
        notes,
        paymentMethod,
        items: summary.rows.map((r) => ({ productId: r.productId, addonIds: r.addonIds, qty: r.qty })),
      });
      saveCustomer(customer);
      saveLastOrder({
        orderId: res.orderId,
        orderNo: res.orderNo,
        total: res.total,
        name: customer.name,
        email: customer.email.trim(),
        paymentMethod,
        items: summary.rows.map((r) => ({ name: r.name, addonNames: r.addonNames, qty: r.qty, lineTotal: r.lineTotal })),
        saleTitle: sale.title,
        pickupAt: sale.pickupAt,
        pickupText: sale.pickupText,
        location: sale.location,
      });
      cart.clear();
      navigate('/order/confirmed', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'משהו השתבש, נסו שוב');
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 py-6" noValidate>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">סיום הזמנה</h1>
        <Link to="/order" className="text-sm underline">
          → חזרה לתפריט
        </Link>
      </div>

      <Card>
        <h2 className="mb-2 font-semibold">ההזמנה שלי</h2>
        <ul className="divide-y divide-line text-sm">
          {summary.rows.map((r) => (
            <li key={r.productId + r.addonIds.join()} className="flex justify-between gap-3 py-2">
              <span>
                {r.qty} × {r.name}
                {r.addonNames.length > 0 && <span className="text-muted"> ({r.addonNames.join(', ')})</span>}
              </span>
              <span className="shrink-0 font-semibold">{formatPrice(r.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t border-primary/20 pt-2 text-lg font-semibold">
          <span>סה״כ</span>
          <span>{formatPrice(summary.total)}</span>
        </div>
        <p className="mt-3 rounded-xl bg-line/50 p-2.5 text-sm">
          🧺 איסוף: <strong>{sale.pickupText}</strong> ({formatDateTime(sale.pickupAt)})
          {sale.location && <> · {sale.location}</>}
        </p>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold">פרטים</h2>
        <Field label="שם מלא *">
          <input
            className={inputClass}
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            autoComplete="name"
            aria-invalid={submitted && !!nameError}
          />
          {submitted && nameError && <span className="text-sm text-red-700">{nameError}</span>}
        </Field>
        <Field label="טלפון נייד *">
          <input
            className={inputClass}
            value={customer.phone}
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            placeholder="050-0000000"
            aria-invalid={submitted && !!phoneError}
          />
          {submitted && phoneError && <span className="text-sm text-red-700">{phoneError}</span>}
        </Field>
        <Field label="מייל *" hint="נשלח לשם את סיכום ההזמנה">
          <input
            className={inputClass}
            value={customer.email}
            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
            type="email"
            inputMode="email"
            autoComplete="email"
            dir="ltr"
            placeholder="name@gmail.com"
            aria-invalid={submitted && !!emailError}
          />
          {submitted && emailError && <span className="text-sm text-red-700">{emailError}</span>}
        </Field>
        <Field label="הערות (לא חובה)">
          <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">תשלום</h2>
        {sale.paymentModes.map((m) => (
          <label
            key={m}
            className={`flex cursor-pointer items-center gap-3 rounded-xl p-3 ring-1 ${
              paymentMethod === m ? 'bg-accent/30 ring-primary' : 'ring-line'
            }`}
          >
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === m}
              onChange={() => setPayment(m)}
              className="h-5 w-5 accent-primary"
            />
            <span>
              <span className="block font-semibold">{PAYMENT_LABELS[m].title}</span>
              <span className="text-sm text-muted">{PAYMENT_LABELS[m].text}</span>
            </span>
          </label>
        ))}
      </Card>

      <label className="flex items-start gap-3 px-1 text-sm">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-5 w-5 accent-primary"
        />
        <span>
          קראתי ואני מסכים/ה ל
          <Link to="/terms" className="underline" target="_blank">
            תקנון
          </Link>
          {submitted && agreeError && <span className="block text-red-700">{agreeError}</span>}
        </span>
      </label>

      {error && <p className="rounded-xl bg-red-50 p-3 text-red-700 ring-1 ring-red-200">{error}</p>}

      <Button type="submit" disabled={sending} className="w-full py-3.5 text-lg">
        {sending ? 'שולח…' : `שליחת הזמנה · ${formatPrice(summary.total)}`}
      </Button>
    </form>
  );
}
