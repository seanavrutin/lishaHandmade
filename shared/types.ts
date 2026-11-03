// Shared data model for the web app and Cloud Functions.
// Timestamps are typed generically so both the client SDK and firebase-admin fit.

/** Category name as customers see it, e.g. "קישים". Free text, created in the admin. */
export type Category = string;

export type PaymentMethod = 'paybox' | 'pickup';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type OrderStatus = 'new' | 'ready' | 'picked_up' | 'cancelled';
export type SaleStatus = 'draft' | 'open' | 'closed';

export interface Addon {
  id: string;
  name: string; // e.g. "תוספת גבינה"
  price: number; // added to the unit price, in ₪
}

export interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  basePrice: number;
  category: Category;
  addons: Addon[];
  active: boolean;
  sort: number;
}

/** Snapshot of a catalog product inside a sale – editing the catalog never changes a live sale. */
export interface SaleItem {
  productId: string;
  name: string;
  description: string;
  imageUrl: string;
  category: Category;
  price: number;
  addons: Addon[];
  maxQty: number | null; // null = unlimited
  sort: number;
  /** Shown in the "מיוחדים" tab as well as in its own category. */
  special?: boolean;
}

export interface Sale<T = unknown> {
  id: string;
  title: string;
  message: string;
  opensAt: T;
  closesAt: T;
  pickupAt: T;
  pickupText: string;
  location: string;
  status: SaleStatus;
  paymentModes: PaymentMethod[];
  maxOrders: number | null;
  items: SaleItem[];
  sold: Record<string, number>; // productId -> qty, written by functions only
  orderCount: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  addonIds: string[];
  addonNames: string[];
  unitPrice: number;
  qty: number;
  lineTotal: number;
}

export interface Order<T = unknown> {
  id: string;
  orderNo: number;
  saleId: string;
  customer: { name: string; phone: string };
  notes: string;
  items: OrderItem[];
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: T;
}

export interface SiteSettings {
  aboutText: string;
  phone: string;
  payboxLink: string;
  pickupAddress: string;
  instagram: string;
  /** Site colour theme – one of the theme names in web/src/lib/theme.ts. */
  theme: string;
}

/** Payload sent by the client to the createOrder function. Prices are recomputed on the server. */
export interface CreateOrderRequest {
  saleId: string;
  customer: { name: string; phone: string };
  notes: string;
  paymentMethod: PaymentMethod;
  items: { productId: string; addonIds: string[]; qty: number }[];
}

export interface CreateOrderResponse {
  orderId: string;
  orderNo: number;
  total: number;
}
