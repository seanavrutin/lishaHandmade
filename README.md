# Lisha Handmade

Website and order system for Lisha Handmade. The full plan is in [PLAN.md](PLAN.md).

- `web/`: React + Vite + Tailwind (RTL Hebrew), deployed to Cloudflare Pages
- `functions/`: Firebase Cloud Functions (`createOrder`)
- `shared/`: TypeScript types and order rules shared by both

Requires **Node 20+** on the PATH (`nvm use 20.19.0`). The Firebase CLI analyses the functions with
whatever `node` comes first, and Node 14 fails with `Cannot find module 'node:crypto'`.

Firebase project: **Lisha Handmade** (`home-assistant-39485`, a reused project, hence the ID).

## Data source

`web/src/data/index.ts` picks the backend:

- `VITE_DATA_SOURCE=firebase` → real Firebase (`web/.env.production`, used by Cloudflare builds)
- anything else → the in-browser demo (`npm run dev` by default)

To run locally against the real Firebase: `npx vite --mode production`.

## Local development with emulators

```bash
# 1. Firebase emulators (Auth, Firestore, Functions, Storage) – from the repo root
npm --prefix functions run build
firebase emulators:start

# 2. Web app – in another terminal
cd web
cp .env.example .env.local   # VITE_DATA_SOURCE=firebase, VITE_USE_EMULATORS=true
npm run dev
```

Emulator UI: http://127.0.0.1:4000

## Admins

An admin is a document `admins/{email}` (lower-case Google email) in Firestore. Firestore rules,
Storage rules and the `createOrder` function all check it. To add Lior: Firebase console →
Firestore → `admins` → Add document → Document ID = her Gmail address (any field, e.g. `name`).

## Deploy

- **Web:** Cloudflare Pages project `lisha-handmade`, connected to this repo. Every push to `main`
  deploys to https://lisha-handmade.pages.dev, other branches get preview URLs.
  Root directory `web`, build `npm run build`, output `dist`, Node from `web/.nvmrc`.
- **Backend:**
  ```bash
  firebase deploy --only "firestore:rules,storage,functions" --project home-assistant-39485 --force
  ```
  Functions run on Node 22 (`functions/package.json` → `engines`). If a callable function returns
  403 after a fresh deploy, allow public access on its Cloud Run service (Security tab).
