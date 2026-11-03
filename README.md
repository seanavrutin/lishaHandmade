# Lisha Handmade

Website and order system for Lisha Handmade. The full plan is in [PLAN.md](PLAN.md).

- `web/`: React + Vite + Tailwind (RTL Hebrew), deployed to Cloudflare Pages
- `functions/`: Firebase Cloud Functions (`createOrder`, admin script)
- `shared/`: TypeScript types shared by both

Requires **Node 20** (`nvm use 20.19.0`).

## Local development

```bash
# 1. Firebase emulators (Auth, Firestore, Functions, Storage) – from the repo root
npm --prefix functions run build
firebase emulators:start

# 2. Web app – in another terminal
cd web
cp .env.example .env.local   # VITE_USE_EMULATORS=true
npm run dev
```

Emulator UI: http://127.0.0.1:4000

## Make someone an admin

The user signs in at `/admin` once, then:

```bash
cd functions
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 npm run set-admin -- someone@gmail.com   # local
GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json npm run set-admin -- someone@gmail.com  # prod
```

## Deploy

- **Web:** connect the repo to Cloudflare Pages with root directory `web`, build command
  `npm run build`, output `dist`, and the `VITE_*` env vars from `.env.example`.
- **Backend:** `firebase use <project>` then `firebase deploy --only functions,firestore,storage`.
