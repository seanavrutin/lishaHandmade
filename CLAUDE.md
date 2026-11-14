# Lisha Handmade

Order website for Lior's pastry business (customers order for weekly pickup events). Hebrew, RTL,
mobile-first; Lior runs everything from `/admin` on her iPhone. Setup, admins and deploy basics are
in [README.md](README.md); the original design is in [PLAN.md](PLAN.md).

## Layout

- `web/`: React 19, Vite, Tailwind v4 (themes are CSS variables under `[data-theme]`), React Router 7
- `functions/`: one callable function, `createOrder` (prices the order, saves it, sends the emails)
- `shared/`: types, order pricing/validation (`orderLogic.ts`) and pickup wording (`pickup.ts`),
  imported as `@shared/...` in web and `../../shared/...` in functions

All user-facing text is Hebrew; code, comments and commit messages are English.

## Environment (Windows)

- The default `node` on this machine is v14. Put Node 20 first on the PATH for every command:
  `C:\Users\SEANAV\AppData\Local\nvm\v20.19.0`
- Type checks: `node node_modules/typescript/bin/tsc -b --noEmit` in `web/`,
  `node node_modules/typescript/bin/tsc -p . --noEmit` in `functions/`
- Dev server: the `web` entry in `.claude/launch.json` (port 5173)

## Deploying

- **Website:** a push to `main` rebuilds Cloudflare Pages (`lisha.avrux.uk`, also
  `lisha-handmade.pages.dev`). Nothing else is needed.
- **Functions:** the user runs the deploy from their own PowerShell window, not Claude. Give them
  this one line (the discovery timeout is required or the deploy fails after 10 seconds):
  ```powershell
  cd C:\personal\lishaHandmade; $env:Path = "C:\Users\SEANAV\AppData\Local\nvm\v20.19.0;" + $env:Path; $env:NO_PROXY = "localhost,127.0.0.1"; $env:FUNCTIONS_DISCOVERY_TIMEOUT = "60"; firebase deploy --only functions --project home-assistant-39485 --force
  ```
- Changes in `shared/` used by the function (e.g. pickup wording in emails) also need a functions deploy.

## Firebase

- Project `home-assistant-39485`; Firestore and Functions in `europe-west1`; Functions on Node 22.
- Storage rules check `admins/{email}` through Firestore, which needs the IAM role
  `roles/firebaserules.firestoreServiceAgent` on the Storage service agent (already granted).
  IAM and permission changes are done by the user, not Claude.
- Emails go through Gmail SMTP from `lisha.handmade@gmail.com` (app password in the secret
  `GMAIL_APP_PASSWORD`; a new secret version needs a functions redeploy). The customer gets an order
  summary; Lior gets a new-order alert at the address in `functions/src/orderEmail.ts`
  (website orders only, not ones she enters in the admin). A failed email never fails the order.

## Behaviour that is intentional

- **Events keep their own copy of each product** (name, price, photo, addons) taken when the event
  is created. Changing a product's price later does not change existing events; Lior edits the
  event itself. Duplicating an event takes the current catalog details and prices. New photos are
  the one thing synced into existing events (`syncImageToSales` in `ProductEditor.tsx`).
- Orders store the price the customer was charged; prices are always recomputed on the server.
- Pickup: a date plus optional "from"/"until" hours (`pickupFrom`, `pickupUntil`); both empty shows
  "השעה תעודכן בהמשך". Shown to customers as "איסוף עצמי".
- Payments are manual (PayBox link, Bit, or pay on pickup); there is no payment integration.

## UI notes

- Full-screen overlays are rendered with `createPortal` to `<body>`, because animated parents break
  `position: fixed`.
- The admin bottom bar hides while a text field has focus (`web/src/lib/useTyping.ts`) to work
  around iPhone Safari leaving fixed bars where the keyboard was.
- Inputs use `text-base` (16px) so iPhone doesn't zoom in on focus.

## Working rules

- Commit and push only when the user asks. Commit straight to `main` (no PRs in this repo).
- Verify UI changes in the browser preview before reporting them done.
