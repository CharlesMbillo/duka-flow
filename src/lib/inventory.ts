// Append-only inventory ledger API. All stock changes go through here.
import { db, type LedgerEntry, type LedgerMovementType, getCurrentStock } from '@/db/database';

export { getCurrentStock };

export interface MovementOpts {
  transactionId?: number;
  reason?: string;
  createdBy?: string;
}

/**
 * Append a stock movement to the ledger. Sign of `quantity` is normalized
 * based on movement type:
 *   - sale, damage   → forced negative
 *   - purchase, return → forced positive
 *   - adjustment     → sign preserved (caller decides + or -)
 */
export async function addStockMovement(
  productId: number,
  movementType: LedgerMovementType,
  quantity: number,
  opts: MovementOpts = {},
): Promise<number> {
  const magnitude = Math.abs(quantity);
  let signed = quantity;
  switch (movementType) {
    case 'sale':
    case 'damage':
      signed = -magnitude;
      break;
    case 'purchase':
    case 'return':
      signed = magnitude;
      break;
    case 'adjustment':
      signed = quantity;
      break;
  }
  const entry: LedgerEntry = {
    productId,
    movementType,
    quantity: signed,
    transactionId: opts.transactionId,
    reason: opts.reason,
    createdBy: opts.createdBy,
    createdAt: new Date().toISOString(),
  };
  return db.ledger.add(entry);
}

/** Reverse every ledger entry tied to a transaction (used by void). */
export async function reverseTransaction(transactionId: number, reason: string): Promise<void> {
  const entries = await db.ledger.getByTransaction(transactionId);
  const now = new Date().toISOString();
  for (const e of entries) {
    await db.ledger.add({
      productId: e.productId,
      transactionId,
      movementType: 'return',
      quantity: -e.quantity,
      reason: `Reversal: ${reason}`,
      createdAt: now,
    });
  }
}
