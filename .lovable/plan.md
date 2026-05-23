## Plan

Two focused additions on top of the existing offline IndexedDB stack.

### 1. Voiding & Void Reporting

**Data model (src/db/database.ts)**
- Extend `Transaction` with: `voided?: boolean`, `voidedAt?: string`, `voidReason?: string`, `voidedBy?: 'owner' | 'salesman'`.
- Add `db.transactions.void(id, reason, role)` that:
  - Loads the transaction, marks it voided, writes back via `put`.
  - Restores stock for each line item (`product.stock += qty`).
  - Emits `transactions` and `products` events so POS, Inventory, and History refresh instantly.
- Bump `DB_VERSION` to 2 (no schema changes needed beyond keyPath, but version bump is harmless and future-proof).

**Authorization**
- Only `owner` role may void. Use existing `useRole` + `RoleGate` PIN flow — Salesman triggering void prompts for owner PIN.

**UI**
- `HistoryPage.tsx`: in the receipt dialog, add a red "Void Sale" button (hidden if already voided). Confirm dialog requires a reason (textarea). Voided rows in the list get a `Voided` badge, strikethrough total, and are excluded from the sales total/count summary.
- New filter chips at top of History: `All / Active / Voided`.
- `SalesPage.tsx` / reporting helpers: exclude voided txs from revenue and tax totals; show voided count separately.

**Void Report**
- New export action in History: "Void Report (CSV)" via `src/lib/receipt.ts` → `downloadVoidReport(transactions)`.
- Columns: Receipt #, Original Date, Voided At, Voided By, Reason, Items, Subtotal, Tax, Total.
- Header summary row with total voided count and value.

**eTIMS note**
- Voided transactions get `kraSubmissionStatus = 'pending'` re-queued as a credit note placeholder entry in `etimsQueue` (status `queued`, payload tagged `type: 'void'`). Sync logic stays as-is for now — just ensures voids are not lost.

### 2. Offline-First Capability

The PWA plugin is already wired in `vite.config.ts` and IndexedDB is already the source of truth. What's missing is registration, an offline UX, and a sync indicator.

**Service worker registration**
- `src/main.tsx`: import `registerSW` from `virtual:pwa-register` with `{ immediate: true, onNeedRefresh, onOfflineReady }`.
- Show a toast (sonner) when the app is offline-ready and another when a new version is available with a "Reload" action.
- Add `/// <reference types="vite-plugin-pwa/client" />` in `src/vite-env.d.ts`.

**Offline indicator (always-on UX)**
- New `src/hooks/useOnline.ts` listening to `online`/`offline` window events.
- New `src/components/OfflineBadge.tsx`: small pill in the AppShell header — green "Online" / amber "Offline — sales saved locally". Mounted in `AppShell.tsx` next to the role switcher.

**Sync queue UI**
- `src/hooks/useEtimsQueue.ts`: poll `db.etimsQueue.getAll()` (and subscribe via `dbEvents`) to expose `pendingCount`.
- Badge on Settings nav item and a "Pending eTIMS submissions" card on `SettingsPage.tsx` showing queued count and last attempt; button "Retry sync now" (no-op stub if network down).

**Background sync trigger**
- `src/lib/sync.ts`: `attemptEtimsSync()` iterates queue items, marks `submitting`, then `submitted` (stub — real KRA call is out of scope here). Called:
  - on app start (after seed),
  - whenever `online` event fires,
  - on manual retry button.
- Emits `transactions` to refresh History submission status badges.

**Install affordance**
- `LandingPage.tsx` + `InstallPage.tsx` already exist. Wire the `beforeinstallprompt` event into a small `useInstallPrompt` hook so the "Install App" button actually triggers the native prompt when available.

**Manifest/cache verification**
- Confirm `navigateFallback` for SPA routes (add `'/index.html'` to workbox so deep links work offline).
- Add `cleanupOutdatedCaches: true` and `skipWaiting: true`.

### Files

```text
src/db/database.ts                   edit  (void method, fields, version bump)
src/lib/receipt.ts                   edit  (downloadVoidReport)
src/pages/HistoryPage.tsx            edit  (void button, filter, badges)
src/pages/SalesPage.tsx              edit  (exclude voided)
src/main.tsx                         edit  (registerSW)
src/vite-env.d.ts                    edit  (pwa client types)
src/hooks/useOnline.ts               new
src/hooks/useEtimsQueue.ts           new
src/hooks/useInstallPrompt.ts        new
src/components/OfflineBadge.tsx      new
src/components/layout/AppShell.tsx   edit  (mount OfflineBadge)
src/pages/SettingsPage.tsx           edit  (sync queue card)
src/pages/InstallPage.tsx            edit  (use install prompt hook)
src/lib/sync.ts                      new
vite.config.ts                       edit  (skipWaiting, cleanupOutdatedCaches, navigateFallback)
```

### Out of scope

- Real KRA eTIMS network submission (kept as a stub — schema and queue are ready).
- Cloud sync of transactions across devices (no auth backend in this scope).
