import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { SaleItem } from '@shared/types';
import type { SaleData } from '../data';

export interface CartLine {
  productId: string;
  addonIds: string[];
  qty: number;
}

interface CartState {
  saleId: string | null;
  lines: CartLine[];
}

interface CartApi extends CartState {
  /** A product can have several lines, e.g. 1 plain + 2 with cheese. */
  linesFor(productId: string): CartLine[];
  setProductLines(saleId: string, productId: string, lines: CartLine[]): void;
  clear(): void;
}

const STORAGE_KEY = 'lisha-cart';

const CartContext = createContext<CartApi | null>(null);

function loadCart(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CartState;
  } catch {
    // ignore
  }
  return { saleId: null, lines: [] };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  const value = useMemo<CartApi>(
    () => ({
      ...cart,
      linesFor: (productId) => cart.lines.filter((l) => l.productId === productId),
      setProductLines: (saleId, productId, productLines) =>
        setCart((prev) => {
          // A cart belongs to one sale; starting a new sale starts a new cart.
          const lines = prev.saleId === saleId ? prev.lines : [];
          return { saleId, lines: replaceProductLines(lines, productId, productLines) };
        }),
      clear: () => setCart({ saleId: null, lines: [] }),
    }),
    [cart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

/** Replaces all lines of one product. */
export function replaceProductLines(lines: CartLine[], productId: string, productLines: CartLine[]): CartLine[] {
  return [...lines.filter((l) => l.productId !== productId), ...productLines.filter((l) => l.qty > 0)];
}

/** How many units of the product include the add-on. */
export const addonCount = (lines: CartLine[], addonId: string) =>
  lines.filter((l) => l.addonIds.includes(addonId)).reduce((s, l) => s + l.qty, 0);

/**
 * Builds a product's cart lines from "total units" and "how many of them with each add-on".
 * Add-ons go on the first units, so with one add-on this is simply N plain + M with the add-on.
 */
export function buildProductLines(
  productId: string,
  total: number,
  counts: Record<string, number>,
  addonOrder: string[],
): CartLine[] {
  const byCombo = new Map<string, CartLine>();
  for (let unit = 0; unit < total; unit++) {
    const addonIds = addonOrder.filter((id) => unit < Math.min(counts[id] ?? 0, total));
    const key = addonIds.join('+');
    const line = byCombo.get(key) ?? { productId, addonIds, qty: 0 };
    line.qty++;
    byCombo.set(key, line);
  }
  return [...byCombo.values()];
}

export function unitPrice(item: SaleItem, addonIds: string[]) {
  return item.price + item.addons.filter((a) => addonIds.includes(a.id)).reduce((s, a) => s + a.price, 0);
}

/** Cart lines that still exist in the sale, with names and prices for display. */
export function cartSummary(sale: SaleData, lines: CartLine[]) {
  const rows = lines.flatMap((line) => {
    const item = sale.items.find((i) => i.productId === line.productId);
    if (!item) return [];
    const addonNames = item.addons.filter((a) => line.addonIds.includes(a.id)).map((a) => a.name);
    const price = unitPrice(item, line.addonIds);
    return [{ ...line, name: item.name, addonNames, unitPrice: price, lineTotal: price * line.qty }];
  });
  return {
    rows,
    count: rows.reduce((s, r) => s + r.qty, 0),
    total: rows.reduce((s, r) => s + r.lineTotal, 0),
  };
}
