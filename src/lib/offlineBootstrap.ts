// Wires up offline-first behaviour at app startup:
// - Requests persistent storage so the browser does not evict IndexedDB
//   under storage pressure (critical for an offline-first POS).
// - Installs sync triggers that flush the eTIMS queue when the device
//   reconnects.
// - Broadcasts online/offline transitions for any UI that wants to react.

import { installSyncTriggers, attemptEtimsSync } from './sync';

let installed = false;

export async function bootstrapOffline(): Promise<void> {
  if (installed) return;
  installed = true;

  // Ask the browser to keep our IndexedDB data even when storage is tight.
  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      const already = await navigator.storage.persisted?.();
      if (!already) {
        await navigator.storage.persist();
      }
    }
  } catch {
    // Best-effort only; the app still works without persistent storage.
  }

  // Flush queued submissions on startup and whenever the device comes back online.
  installSyncTriggers();

  // Re-attempt sync when the tab becomes visible again (mobile background return).
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        attemptEtimsSync();
      }
    });
  }
}
