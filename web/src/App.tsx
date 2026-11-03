import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import Layout from './components/Layout';
import Home from './pages/Home';
import Order from './pages/Order';
import NotFound from './pages/NotFound';

// Admin is loaded only when visiting /admin, so customers never download it.
const AdminApp = lazy(() => import('./admin/AdminApp'));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="order" element={<Order />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route
        path="admin/*"
        element={
          <Suspense fallback={<p className="p-6 text-center">טוען…</p>}>
            <AdminApp />
          </Suspense>
        }
      />
    </Routes>
  );
}
