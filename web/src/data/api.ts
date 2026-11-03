// The one interface every page talks to. Today it is backed by the in-browser demo store
// (mockApi.ts); a Firebase implementation will replace it without touching the pages.
// All dates are epoch milliseconds.
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
  Sale,
  SiteSettings,
} from '@shared/types';

export type SaleData = Sale<number>;
export type OrderData = Order<number>;

export interface AdminUser {
  name: string;
  email: string;
}

export interface OrderPatch {
  paymentStatus?: PaymentStatus;
  status?: OrderStatus;
}

export interface DataApi {
  /** True while running on the demo store (data lives only in this browser). */
  readonly isDemo: boolean;
  /** Called whenever any data changes, so screens can refresh. */
  subscribe(listener: () => void): () => void;

  // Public
  getSettings(): Promise<SiteSettings>;
  getOpenSale(): Promise<SaleData | null>;
  createOrder(req: CreateOrderRequest): Promise<CreateOrderResponse>;

  // Admin auth
  getAdmin(): AdminUser | null;
  signIn(): Promise<void>;
  signOut(): Promise<void>;

  // Admin data
  saveSettings(settings: SiteSettings): Promise<void>;
  listProducts(): Promise<Product[]>;
  saveProduct(product: Product): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  uploadImage(file: File): Promise<string>;
  listSales(): Promise<SaleData[]>;
  getSale(id: string): Promise<SaleData | null>;
  saveSale(sale: SaleData): Promise<SaleData>;
  deleteSale(id: string): Promise<void>;
  listOrders(saleId: string): Promise<OrderData[]>;
  updateOrder(id: string, patch: OrderPatch): Promise<void>;
  createManualOrder(req: CreateOrderRequest): Promise<CreateOrderResponse>;
  resetDemo(): Promise<void>;
}
