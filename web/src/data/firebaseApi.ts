// Firebase backend: Firestore for data, Cloud Functions for order creation, Auth for the admin,
// Storage for photos. Auth / Functions / Storage SDKs load on first use so public pages stay light.
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  addDoc,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { CreateOrderRequest, CreateOrderResponse, Order, Product, Sale, SiteSettings } from '@shared/types';
import { db } from '../lib/firebase';
import { resizeImage } from '../lib/image';
import type { AdminUser, DataApi, OrderData, SaleData } from './api';
import { seedProducts, seedSales, seedSettings } from './seed';

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// ---------- conversions (Firestore stores Timestamps, the app uses epoch ms) ----------

const ms = (t: unknown) => (t instanceof Timestamp ? t.toMillis() : typeof t === 'number' ? t : Date.now());

function toSale(snap: DocumentSnapshot<DocumentData>): SaleData {
  const d = snap.data() as Sale<Timestamp>;
  return {
    ...d,
    id: snap.id,
    opensAt: ms(d.opensAt),
    closesAt: ms(d.closesAt),
    pickupAt: ms(d.pickupAt),
    sold: d.sold ?? {},
    orderCount: d.orderCount ?? 0,
  };
}

function toOrder(snap: DocumentSnapshot<DocumentData>): OrderData {
  const d = snap.data() as Order<Timestamp>;
  return { ...d, id: snap.id, createdAt: ms(d.createdAt) };
}

/** Sale fields Lior edits. `sold` / `orderCount` are owned by order creation and never sent from the form. */
function saleFields(s: SaleData) {
  return {
    title: s.title,
    message: s.message,
    opensAt: Timestamp.fromMillis(s.opensAt),
    closesAt: Timestamp.fromMillis(s.closesAt),
    pickupAt: Timestamp.fromMillis(s.pickupAt),
    pickupFrom: s.pickupFrom ?? '',
    pickupUntil: s.pickupUntil ?? '',
    pickupText: s.pickupText,
    location: s.location,
    status: s.status,
    paymentModes: s.paymentModes,
    maxOrders: s.maxOrders,
    items: s.items,
  };
}

const withoutId = <T extends { id: string }>({ id: _id, ...rest }: T) => rest;

// ---------- auth (lazy) ----------

let authState: { user: User | null; admin: AdminUser | null } = { user: null, admin: null };
let authLoading: Promise<typeof import('../lib/auth')> | null = null;
let stopOrdersWatch: (() => void) | null = null;

function ensureAuth() {
  if (!authLoading) {
    authLoading = import('../lib/auth').then(async (mod) => {
      const { onAuthStateChanged } = await import('firebase/auth');
      onAuthStateChanged(mod.auth, async (user) => {
        let admin: AdminUser | null = null;
        if (user?.email && user.emailVerified) {
          // Rules let a signed-in user read only their own entry in `admins`.
          const entry = await getDoc(doc(db, 'admins', user.email.toLowerCase())).catch(() => null);
          if (entry?.exists()) admin = { name: user.displayName ?? user.email, email: user.email };
        }
        authState = { user, admin };
        watchOrders(!!admin);
        emit();
      });
      return mod;
    });
  }
  return authLoading;
}

/** While an admin is signed in, new orders refresh the admin screens live. */
function watchOrders(on: boolean) {
  stopOrdersWatch?.();
  stopOrdersWatch = null;
  if (!on) return;
  let first = true;
  stopOrdersWatch = onSnapshot(collection(db, 'orders'), () => {
    if (first) first = false;
    else emit();
  });
}

function requireAdmin() {
  if (!authState.admin) throw new Error('נדרשת התחברות');
}

async function callCreateOrder(req: CreateOrderRequest & { manual?: boolean }) {
  const [{ functions }, { httpsCallable }] = await Promise.all([import('../lib/functions'), import('firebase/functions')]);
  try {
    const res = await httpsCallable<typeof req, CreateOrderResponse>(functions, 'createOrder')(req);
    return res.data;
  } catch (err) {
    // HttpsError messages from the function are already in Hebrew.
    throw new Error(err instanceof Error && err.message && !err.message.startsWith('internal') ? err.message : 'משהו השתבש, נסו שוב');
  }
}

export const firebaseApi: DataApi = {
  isDemo: false,

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async getSettings() {
    const snap = await getDoc(doc(db, 'settings', 'site'));
    return { ...seedSettings, ...(snap.data() as Partial<SiteSettings> | undefined) };
  },

  async getOpenSale() {
    const snap = await getDocs(query(collection(db, 'sales'), where('status', '==', 'open')));
    const now = Date.now();
    return (
      snap.docs
        .map(toSale)
        .filter((s) => s.opensAt <= now && s.closesAt > now)
        .sort((a, b) => a.closesAt - b.closesAt)[0] ?? null
    );
  },

  createOrder: (req) => callCreateOrder(req),

  getAdmin() {
    void ensureAuth();
    return authState.admin;
  },

  getSignedInEmail() {
    void ensureAuth();
    return authState.user?.email ?? null;
  },

  async signIn() {
    const { auth } = await ensureAuth();
    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
    await signInWithPopup(auth, new GoogleAuthProvider());
  },

  async signOut() {
    const { auth } = await ensureAuth();
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  },

  async saveSettings(settings) {
    requireAdmin();
    await setDoc(doc(db, 'settings', 'site'), settings);
    emit();
  },

  async listProducts() {
    const snap = await getDocs(query(collection(db, 'products'), orderBy('sort')));
    return snap.docs.map((d) => ({ ...(d.data() as Product), id: d.id }));
  },

  async saveProduct(product) {
    requireAdmin();
    let id = product.id;
    if (id) await setDoc(doc(db, 'products', id), withoutId(product));
    else id = (await addDoc(collection(db, 'products'), withoutId(product))).id;
    emit();
    return { ...product, id };
  },

  async deleteProduct(id) {
    requireAdmin();
    await deleteDoc(doc(db, 'products', id));
    emit();
  },

  async uploadImage(file) {
    requireAdmin();
    const [{ storage }, { ref, uploadBytes, getDownloadURL }] = await Promise.all([
      import('../lib/storage'),
      import('firebase/storage'),
    ]);
    const blob = await resizeImage(file);
    const target = ref(storage, `images/${crypto.randomUUID()}.jpg`);
    await uploadBytes(target, blob, { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000' });
    return getDownloadURL(target);
  },

  async listSales() {
    const snap = await getDocs(collection(db, 'sales'));
    return snap.docs.map(toSale).sort((a, b) => b.closesAt - a.closesAt);
  },

  async getSale(id) {
    const snap = await getDoc(doc(db, 'sales', id));
    return snap.exists() ? toSale(snap) : null;
  },

  async saveSale(sale) {
    requireAdmin();
    if (sale.id) {
      await updateDoc(doc(db, 'sales', sale.id), saleFields(sale));
      emit();
      return (await this.getSale(sale.id))!;
    }
    const ref = await addDoc(collection(db, 'sales'), { ...saleFields(sale), sold: {}, orderCount: 0 });
    emit();
    return { ...sale, id: ref.id, sold: {}, orderCount: 0 };
  },

  async deleteSale(id) {
    requireAdmin();
    const orders = await getDocs(query(collection(db, 'orders'), where('saleId', '==', id)));
    const batch = writeBatch(db);
    orders.docs.forEach((o) => batch.delete(o.ref));
    batch.delete(doc(db, 'sales', id));
    await batch.commit();
    emit();
  },

  async listOrders(saleId) {
    // Sorted here rather than with orderBy, so no composite index is needed.
    const snap = await getDocs(query(collection(db, 'orders'), where('saleId', '==', saleId)));
    return snap.docs.map(toOrder).sort((a, b) => b.createdAt - a.createdAt);
  },

  async updateOrder(id, patch) {
    requireAdmin();
    await runTransaction(db, async (tx) => {
      const orderRef = doc(db, 'orders', id);
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists()) throw new Error('ההזמנה לא נמצאה');
      const order = toOrder(orderSnap);

      // Cancelling gives the stock back; un-cancelling takes it again.
      if (patch.status && (patch.status === 'cancelled') !== (order.status === 'cancelled')) {
        const sign = patch.status === 'cancelled' ? -1 : 1;
        const qty: Record<string, number> = {};
        for (const item of order.items) qty[item.productId] = (qty[item.productId] ?? 0) + item.qty;
        tx.update(doc(db, 'sales', order.saleId), {
          orderCount: increment(sign),
          ...Object.fromEntries(Object.entries(qty).map(([pid, n]) => [`sold.${pid}`, increment(sign * n)])),
        });
      }
      tx.update(orderRef, { ...patch });
    });
    emit();
  },

  createManualOrder: (req) => {
    requireAdmin();
    return callCreateOrder({ ...req, manual: true });
  },

  async resetDemo() {
    throw new Error('לא זמין באתר האמיתי');
  },

  async seedStarterData() {
    requireAdmin();
    const batch = writeBatch(db);
    for (const p of seedProducts) batch.set(doc(db, 'products', p.id), withoutId(p));
    batch.set(doc(db, 'settings', 'site'), seedSettings, { merge: true });
    // The weekend sale as a draft, so Lior reviews the dates before publishing.
    const sale = seedSales().find((s) => s.id === 'demo-weekend')!;
    batch.set(doc(db, 'sales', 'weekend-1'), { ...saleFields({ ...sale, status: 'draft' }), sold: {}, orderCount: 0 });
    await batch.commit();
    emit();
  },
};
