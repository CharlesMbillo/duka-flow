// Background eTIMS sync stub.
// Iterates queued items and marks them as submitted. Real KRA submission
// integration is plugged in here later.

import { db } from '@/db/database';

let running = false;

export async function attemptEtimsSync(): Promise<{ submitted: number; failed: number }> {
  if (running) return { submitted: 0, failed: 0 };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { submitted: 0, failed: 0 };
  }
  running = true;
  let submitted = 0;
  let failed = 0;
  try {
    const queue = await db.etimsQueue.getAll();
    for (const item of queue) {
      if (item.status === 'submitted') continue;
      try {
        await db.etimsQueue.put({ ...item, status: 'submitting', lastAttempt: new Date().toISOString() });
        // TODO: real KRA submission goes here.
        await db.etimsQueue.put({
          ...item,
          status: 'submitted',
          attempts: (item.attempts ?? 0) + 1,
          lastAttempt: new Date().toISOString(),
          kraInvoiceNumber: item.kraInvoiceNumber ?? `KRA-${Date.now()}`,
        });
        submitted++;
      } catch (e) {
        await db.etimsQueue.put({
          ...item,
          status: 'failed',
          attempts: (item.attempts ?? 0) + 1,
          lastAttempt: new Date().toISOString(),
          errorMessage: String(e),
        });
        failed++;
      }
    }
  } finally {
    running = false;
  }
  return { submitted, failed };
}

export function installSyncTriggers() {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', () => { attemptEtimsSync(); });
  // Attempt once on startup
  setTimeout(() => { attemptEtimsSync(); }, 1500);
}
