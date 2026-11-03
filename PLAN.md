# Lisha Handmade – Project Plan

Website for **Lisha Handmade** (ליאור), a home pastry business: brand presentation + weekly/holiday
order windows, replacing the current Google Form. Entire site in Hebrew (RTL), mobile-first.

## 1. Core concept: the "sale" (מכירה)

Lior doesn't run an always-open shop – she opens **order windows**:

- Title + message (her usual WhatsApp text), e.g. "הזמנות לסופ״ש", "מכירת חג"
- `opensAt` / `closesAt` – e.g. closes Wednesday 17:00, enforced server-side
- Pickup details – e.g. "שישי בצהריים" + location
- Products picked from the permanent catalog, with optional price override and quantity limit
  ("נשארו 3 אחרונים"), optional cap on total orders
- Allowed payment methods for this sale

Weekly routine for Lior: **"שכפול המכירה הקודמת"** (dates shift +7 days) → review → publish →
**"שיתוף בוואטסאפ"** (opens WhatsApp with her message + link prefilled).

## 2. Customer UX (mobile-first, RTL)

- **Home `/`** – hero, brand story, open-sale banner with countdown, big **להזמנה** button,
  gallery, contact, floating WhatsApp button.
- **Order `/order`** – no open sale → "אין כרגע הזמנות פתוחות". Open sale → products by category
  (קישים / מתוקים), cards with photo, description, price, **+/− stepper**.
  Add-ons (e.g. cheese) shown as separate rows: "רגיל ₪60" / "עם תוספת גבינה ₪70", each with a
  stepper. Sticky bottom bar: "4 פריטים · ₪250 · להמשך".
- **Checkout** – name, phone (05X validation), notes, pickup details, payment method, terms
  checkbox. Details remembered in localStorage.
- **Confirmation** – order number, summary, payment instructions, add-to-calendar, WhatsApp Lior.

## 3. Admin UX (`/admin`, mobile-first, lazy-loaded)

- Google sign-in (popup), allowlisted via custom claim `admin: true`. No public sign-up.
- **Dashboard** – current sale status, order count, revenue, time left.
- **סיכום הכנה (production list)** – per-product totals incl. add-ons, paid vs unpaid.
- **Orders** – filter by payment status, call/WhatsApp customer, mark paid, mark picked up,
  manual order (phone orders), cancel, print/export.
  WhatsApp payment reminder with prefilled text.
- **Products** – CRUD, photo upload (resized in browser), add-ons, category, active, sort.
- **Sales** – create / duplicate / extend / close early / archive.
- **Site content** – about text, photos, phone, Instagram.

## 4. Payments

Lior has / will have **עוסק פטור**. No paid gateway at launch.

| Phase | Methods | Confirmation |
|---|---|---|
| Launch | **PayBox business link** (free up to yearly cap – verify terms), **pay on pickup** | Lior marks "שולם" in admin |
| Later (optional) | Payment gateway (Grow / PayPlus / Cardcom…) – card, Bit, Apple Pay, Google Pay | Automatic via webhook |

- Confirmation page shows amount + order number to put in the payment note.
- Bit/PayBox buttons: copy number + open app (Android intent; iOS fallback to store) – test on devices.
- Payment is a separate step in code (`paymentMethod` + `paymentStatus`), so adding a gateway is
  one extra function (`paymentWebhook`), not a rewrite.
- **Receipts (קבלה)**: עוסק פטור must issue one per payment – via gateway later, or a receipts app
  (Morning / iCount) now. Possible future: auto-create receipt via their API when marked paid.

## 5. Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + TypeScript, Tailwind v4 (RTL), React Router – **Cloudflare Pages** + own domain |
| Auth | Firebase Auth (Google, popup) |
| Database | Firestore (`me-west1` or `europe-west1`) |
| Images | Firebase Storage |
| Server logic | Cloud Functions 2nd gen (TypeScript) |
| Plan | Firebase **Blaze** (needed for Functions + Storage) with a budget alert – expected cost ≈ $0 |

Notes:
- `.co.il` must be bought from an Israeli registrar (LiveDNS / Domain The Net), nameservers → Cloudflare.
- Add the domain to Firebase Auth authorized domains.
- Two Firebase projects: `lisha-dev` and `lisha-prod`. Develop against the Emulator Suite.
- Times stored as Timestamps (UTC), displayed in `Asia/Jerusalem`.

## 6. Firestore data model

```
products/{productId}
  name, description, imageUrl, basePrice, category, active, sort
  addons: [{ id, name, price }]

sales/{saleId}
  title, message, opensAt, closesAt, pickupAt, pickupText, location,
  status: draft | open | closed, paymentModes: ["paybox", "pickup"], maxOrders
  items: [{ productId, name, imageUrl, price, addons, maxQty, sort }]   ← snapshot from catalog
  sold: { [productId]: qty }, orderCount                                 ← written by functions only

orders/{orderId}
  orderNo, saleId, customer: { name, phone }, notes,
  items: [{ productId, name, unitPrice, qty, addonIds, lineTotal }],
  total, paymentMethod, paymentStatus: unpaid | paid | refunded,
  status: new | ready | picked_up | cancelled, createdAt

counters/orders     ← running order number
settings/site       ← editable site content
```

## 7. Cloud Functions

- `createOrder` (callable) – one transaction: sale open & before `closesAt` → recompute prices from
  the sale doc (never trust client) → check stock → increment `sold` → next order number → create order.
- `setAdmin` – one-off script (run by us) to grant `admin: true` to Lior's account.
- Later: `paymentWebhook`, `expirePendingOrders` (only with a gateway).

## 8. Security rules

- Public: read `products` where `active`, `sales` where status is `open`, `settings/site`.
- `orders`: admin only (customers write via `createOrder`).
- `products`, `sales`, `settings`: write = admin only.

## 9. Repo structure

```
lishaHandmade/
  web/            React app (Cloudflare Pages: root `web`, build `npm run build`, output `dist`)
  functions/      Cloud Functions (TypeScript)
  shared/         Shared TypeScript types (Product, Sale, Order)
  firestore.rules, storage.rules, firestore.indexes.json, firebase.json
```

## 10. Phases

1. **Phase 1 – replace the Google Form**: brand site, order flow, admin (catalog, sales, orders,
   production list), PayBox link + pay on pickup.
2. **Phase 2**: notifications to Lior on new orders (Telegram/email), admin as PWA, receipts integration.
3. **Phase 3 (optional)**: payment gateway, SMS confirmations, coupons, Instagram feed, analytics.

Legal pages: תקנון ומדיניות ביטול, מדיניות פרטיות, הצהרת נגישות (build to WCAG AA).

## 11. Needed from Lior

Logo, brand colours (suggested: cream / blush pink / chocolate brown), **good product photos**,
brand story text, pickup address, PayBox business link.
