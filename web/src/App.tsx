import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes } from 'react-router';
import { CartProvider } from './cart/cart';
import Layout from './components/Layout';
import { Loading } from './components/ui';
import { api } from './data';
import { useApiData } from './data/hooks';
import { applySiteTheme } from './lib/theme';
import Checkout from './pages/Checkout';
import Confirmation from './pages/Confirmation';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Order from './pages/Order';
import Terms from './pages/Terms';

// Admin is loaded only when visiting /admin, so customers never download it.
const AdminApp = lazy(() => import('./admin/AdminApp'));

/** Keeps <html data-theme> in sync with the theme saved in site settings. */
function ThemeSync() {
  const { data: settings } = useApiData(() => api.getSettings(), []);
  useEffect(() => {
    if (settings) applySiteTheme(settings.theme);
  }, [settings]);
  return null;
}

export default function App() {
  return (
    <CartProvider>
      <ThemeSync />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="order" element={<Order />} />
          <Route path="order/confirmed" element={<Confirmation />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route
          path="admin/*"
          element={
            <Suspense fallback={<Loading />}>
              <AdminApp />
            </Suspense>
          }
        />
      </Routes>
    </CartProvider>
  );
}
