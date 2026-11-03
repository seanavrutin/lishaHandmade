// Demo backend: everything is kept in localStorage, so the full site works with no server.
// It reuses the shared order logic, so it behaves like the real createOrder function.
import { assertSaleOpen, normalizeOrderRequest, priceOrder } from '@shared/orderLogic';
import type { CreateOrderRequest, Product, SiteSettings } from '@shared/types';
import type { AdminUser, DataApi, OrderData, SaleData } from './api';
import { seedOrders, seedProducts, seedSales, seedSettings } from './seed';
import { resizeImage } from '../lib/image';

interface Db {
  products: Product[];
  sales: SaleData[];
  orders: OrderData[];
  settings: SiteSettings;
  nextOrderNo: number;
}

const DB_KEY = 'lisha-demo-db-v1';
const ADMIN_KEY = 'lisha-demo-admin';
const DEMO_ADMIN: AdminUser = { name: 'ליאור', email: 'demo@lisha.co.il' };

const listeners = new Set<() => void>();
let db: Db = load();

function seed(): Db {
  return {
    products: seedProducts,
    sales: seedSales(),
    orders: seedOrders(),
    settings: seedSettings,
    nextOrderNo: 1004,
  };
}

/** Demo data saved before categories became free names used the keys 'quiche' / 'sweet'. */
function migrate(data: Db): Db {
  // Kept inside the function: load() runs at module start, before top-level consts are initialised.
  const LEGACY_CATEGORIES: Record<string, string> = { quiche: 'קישים', sweet: 'מתוקים' };
  const fix = <T extends { category: string }>(x: T) => ({ ...x, category: LEGACY_CATEGORIES[x.category] ?? x.category });
  return {
    ...data,
    products: data.products.map(fix),
    sales: data.sales.map((s) => ({ ...s, items: s.items.map(fix) })),
  };
}

function load(): Db {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return migrate(JSON.parse(raw) as Db);
  } catch {
    // corrupted or unavailable storage – fall back to fresh demo data
  }
  return seed();
}

function commit() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    // storage full or blocked: keep working in memory
  }
  listeners.forEach((l) => l());
}

/** Small delay so loading states behave like a real network. */
const delay = <T>(value: T, ms = 150) => new Promise<T>((r) => setTimeout(() => r(clone(value)), ms));
const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const newId = () => Math.random().toString(36).slice(2, 10);

function insertOrder(req: CreateOrderRequest, enforceLimits: boolean) {
  const input = normalizeOrderRequest(req);
  const sale = db.sales.find((s) => s.id === input.saleId);
  if (!sale) throw new Error('האירוע לא נמצא');
  if (enforceLimits) assertSaleOpen(sale.status, Date.now(), sale.opensAt, sale.closesAt);

  const { items, total, qtyByProduct } = priceOrder(sale, input, { enforceLimits });
  const order: OrderData = {
    id: newId(),
    orderNo: db.nextOrderNo++,
    saleId: sale.id,
    customer: input.customer,
    notes: input.notes,
    items,
    total,
    paymentMethod: input.paymentMethod,
    paymentStatus: 'unpaid',
    status: 'new',
    createdAt: Date.now(),
  };

  db.orders.push(order);
  sale.orderCount += 1;
  for (const [id, qty] of Object.entries(qtyByProduct)) sale.sold[id] = (sale.sold[id] ?? 0) + qty;
  commit();
  return { orderId: order.id, orderNo: order.orderNo, total };
}

function requireAdmin() {
  if (!mockApi.getAdmin()) throw new Error('נדרשת התחברות');
}

export const mockApi: DataApi = {
  isDemo: true,

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // Defaults first, so demo data saved before a setting existed still gets a value for it.
  getSettings: () => delay({ ...seedSettings, ...db.settings }),

  getOpenSale() {
    const now = Date.now();
    const sale = db.sales.find((s) => s.status === 'open' && s.opensAt <= now && s.closesAt > now);
    return delay(sale ?? null);
  },

  async createOrder(req) {
    await delay(null, 400);
    return insertOrder(req, true);
  },

  getAdmin() {
    try {
      return localStorage.getItem(ADMIN_KEY) ? DEMO_ADMIN : null;
    } catch {
      return null;
    }
  },

  getSignedInEmail() {
    return mockApi.getAdmin()?.email ?? null;
  },

  async signIn() {
    localStorage.setItem(ADMIN_KEY, '1');
    listeners.forEach((l) => l());
  },

  async signOut() {
    localStorage.removeItem(ADMIN_KEY);
    listeners.forEach((l) => l());
  },

  async saveSettings(settings) {
    requireAdmin();
    db.settings = clone(settings);
    commit();
  },

  listProducts: () => delay([...db.products].sort((a, b) => a.sort - b.sort)),

  async saveProduct(product) {
    requireAdmin();
    const saved = { ...clone(product), id: product.id || newId() };
    const i = db.products.findIndex((p) => p.id === saved.id);
    if (i >= 0) db.products[i] = saved;
    else db.products.push(saved);
    commit();
    return clone(saved);
  },

  async deleteProduct(id) {
    requireAdmin();
    db.products = db.products.filter((p) => p.id !== id);
    commit();
  },

  async uploadImage(file) {
    requireAdmin();
    // Demo: store a resized data URL. Firebase version uploads the same blob to Storage.
    const blob = await resizeImage(file);
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  },

  listSales: () => delay([...db.sales].sort((a, b) => b.closesAt - a.closesAt)),

  getSale: (id) => delay(db.sales.find((s) => s.id === id) ?? null),

  async saveSale(sale) {
    requireAdmin();
    const saved = { ...clone(sale), id: sale.id || newId() };
    const i = db.sales.findIndex((s) => s.id === saved.id);
    if (i >= 0) {
      // sold / orderCount are owned by order creation, never by the edit form
      saved.sold = db.sales[i].sold;
      saved.orderCount = db.sales[i].orderCount;
      db.sales[i] = saved;
    } else {
      db.sales.push(saved);
    }
    commit();
    return clone(saved);
  },

  async deleteSale(id) {
    requireAdmin();
    db.sales = db.sales.filter((s) => s.id !== id);
    db.orders = db.orders.filter((o) => o.saleId !== id);
    commit();
  },

  listOrders: (saleId) =>
    delay(db.orders.filter((o) => o.saleId === saleId).sort((a, b) => b.createdAt - a.createdAt)),

  async updateOrder(id, patch) {
    requireAdmin();
    const order = db.orders.find((o) => o.id === id);
    if (!order) throw new Error('ההזמנה לא נמצאה');
    const sale = db.sales.find((s) => s.id === order.saleId);

    // Cancelling gives the stock back; un-cancelling takes it again.
    if (sale && patch.status && (patch.status === 'cancelled') !== (order.status === 'cancelled')) {
      const sign = patch.status === 'cancelled' ? -1 : 1;
      for (const item of order.items) {
        sale.sold[item.productId] = Math.max((sale.sold[item.productId] ?? 0) + sign * item.qty, 0);
      }
      sale.orderCount = Math.max(sale.orderCount + sign, 0);
    }

    Object.assign(order, patch);
    commit();
  },

  async createManualOrder(req) {
    requireAdmin();
    return insertOrder(req, false);
  },

  async resetDemo() {
    db = seed();
    commit();
  },

  async seedStarterData() {
    db = seed();
    commit();
  },
};
