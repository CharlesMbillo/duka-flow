## Goal

Refactor inventory from a mutable `Product.stock` field to an append-only **ledger** in IndexedDB. Stock becomes a computed value derived from `inventoryLedger` entries, giving a full audit trail, safe reversals, and clean offline-sync semantics. Scope is **local-first (IndexedDB only)** — no Supabase tables yet, since the rest of KwaPOS runs entirely on Dexie/IndexedDB.

## Architecture

```text
Sale ─┐
Void ─┼─► addStockMovement() ─► inventoryLedger (append-only)
Adj. ─┘                                │
                                       ▼
                              getCurrentStock(id) = Σ quantity
                                       │
                                       ▼
                       useProducts() exposes { ...product, stock }
```

`Product.stock` stays on the type as a **derived, read-only** field populated by the hook (so `ProductGrid`, low-stock alerts, etc. keep working unchanged). The field is no longer written by sales/voids.

## Changes

### 1. `src/db/database.ts`
- Bump `DB_VERSION` to `2`.
- Add `LedgerEntry` interface: `{ id?, productId, transactionId?, movementType: 'purchase'|'sale'|'return'|'damage'|'adjustment', quantity, reason?, createdBy?, createdAt }`.
- Create `inventoryLedger` object store with indexes on `productId` and `transactionId`.
- In `onupgradeneeded` v1→v2: read every existing product, write an `adjustment` ledger entry seeded with current `stock` ("Initial migration"), then drop the `stock` field from products on disk.
- Add `db.ledger` API: `getAll`, `getByProduct(productId)`, `getByTransaction(txId)`, `add(entry)` (emits `inventoryLedger` event).
- Add helpers `getCurrentStock(productId)` and `getAllStockLevels(): Map<number, number>` that fold the ledger.
- Update seed: after `db.products.add`, write an initial `purchase` ledger entry for each sample's starting stock instead of relying on the field.

### 2. `src/lib/inventory.ts` (new)
- `addStockMovement(productId, type, quantity, opts?)` — normalizes sign (`sale`/`damage` negative, `purchase`/`return` positive, `adjustment` as-is), writes ledger, emits events.
- `reverseTransaction(transactionId, reason)` — fetches all ledger rows for that tx and writes inverse entries (used by void).
- Re-exports `getCurrentStock`.

### 3. `src/hooks/useCart.ts` / `CheckoutDialog` flow
- In `checkout()`, instead of `product.stock -= qty` + `db.products.put`, call `addStockMovement(productId, 'sale', qty, { transactionId, reason })` for each line. Pre-check stock via `getCurrentStock` and abort with a toast if insufficient.

### 4. `src/db/database.ts` — `transactions.void`
- Replace the in-place `product.stock += item.quantity` loop with `reverseTransaction(tx.id, 'Void: ' + reason)`. Keeps eTIMS void queueing unchanged.

### 5. `src/hooks/useProducts.ts`
- After loading products, fold the ledger once (`getAllStockLevels`) and attach `stock` to each product in memory. Subscribe to the new `inventoryLedger` event in addition to `products`/`transactions` so the grid refreshes live.

### 6. `src/pages/InventoryPage.tsx`
- Add a **Stock History** drawer per product (uses `db.ledger.getByProduct`) showing date, type badge, qty, reason.
- Replace any direct stock edits in the product form with an **Adjust Stock** dialog that writes an `adjustment` ledger entry with a required reason.
- "Receive stock" action writes a `purchase` entry.

### 7. `src/lib/dbEvents.ts`
- Add `'inventoryLedger'` to the event channel union.

### 8. Tests (`src/lib/inventory.test.ts`)
- Sum of mixed movements equals expected stock.
- `reverseTransaction` restores stock to pre-sale level.
- History returns entries in newest-first order.

## Explicitly out of scope

- Supabase `inventory_ledger` table, materialized view, triggers, and `refresh_product_stock` RPC. KwaPOS currently has no Supabase-backed product/sale tables; adding them is a separate, larger piece of work. The local ledger is structured so a future sync layer can push entries 1:1.
- Client-side stock cache with TTL (premature — the per-product fold over a small IndexedDB index is already fast; we'll add caching only if profiling shows it's needed).
- Branch reconciliation / multi-store analytics.

## Migration safety

The v1→v2 IndexedDB upgrade seeds one ledger entry per existing product equal to its current `stock`, so users see identical stock numbers after the upgrade — no data loss, no manual recount.
