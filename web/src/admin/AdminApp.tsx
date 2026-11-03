import { Link, NavLink, Route, Routes } from 'react-router';
import DemoBanner from '../components/DemoBanner';
import { Button } from '../components/ui';
import { api } from '../data';
import { useAdmin } from '../data/hooks';
import Dashboard from './Dashboard';
import ManualOrder from './ManualOrder';
import Orders from './Orders';
import ProductEditor from './ProductEditor';
import Products from './Products';
import SaleEditor from './SaleEditor';
import Sales from './Sales';
import Settings from './Settings';

const TABS = [
  { to: '/admin', label: 'ראשי', icon: '📊', end: true },
  { to: '/admin/orders', label: 'הזמנות', icon: '🧾' },
  { to: '/admin/sales', label: 'מכירות', icon: '📅' },
  { to: '/admin/products', label: 'מוצרים', icon: '🥧' },
  { to: '/admin/settings', label: 'הגדרות', icon: '⚙️' },
];

export default function AdminApp() {
  const admin = useAdmin();

  if (!admin) {
    return (
      <div className="flex min-h-dvh flex-col">
        <DemoBanner />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="font-display text-3xl">ניהול Lisha Handmade</h1>
          <Button onClick={() => api.signIn()} className="px-8 py-3">
            {api.isDemo ? 'כניסה (מצב הדגמה)' : 'כניסה עם Google'}
          </Button>
          {api.isDemo && <p className="text-sm text-muted">באתר האמיתי הכניסה תהיה עם חשבון Google של ליאור בלבד</p>}
          <Link to="/" className="text-sm underline">
            חזרה לאתר
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <DemoBanner />
      <header className="sticky top-0 z-20 border-b border-line bg-page/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <span className="font-display text-lg">ניהול · Lisha</span>
          <div className="flex gap-4 text-sm">
            <Link to="/" className="underline">
              לאתר
            </Link>
            <button type="button" onClick={() => api.signOut()} className="underline">
              התנתקות
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4 print:pb-0">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/new" element={<ManualOrder />} />
          <Route path="sales" element={<Sales />} />
          <Route path="sales/:id" element={<SaleEditor />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductEditor />} />
          <Route path="settings" element={<Settings />} />
        </Routes>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur print:hidden">
        <ul className="mx-auto flex max-w-3xl">
          {TABS.map((t) => (
            <li key={t.to} className="flex-1">
              <NavLink
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `flex flex-col items-center py-2 text-xs ${isActive ? 'font-semibold text-ink' : 'text-muted'}`
                }
              >
                <span className="text-xl" aria-hidden="true">
                  {t.icon}
                </span>
                {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
