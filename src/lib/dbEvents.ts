// Cross-component / cross-tab event bus for instant data sync.
// Any mutation to local data calls emit('<table>') and all subscribers refresh.

type Table = 'products' | 'transactions' | 'cartItems' | 'settings' | 'inventoryLedger';

const CHANNEL_NAME = 'kwapos-db';
const channel: BroadcastChannel | null =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

const target = new EventTarget();

export function emit(table: Table) {
  target.dispatchEvent(new CustomEvent(table));
  channel?.postMessage(table);
}

export function subscribe(table: Table, handler: () => void): () => void {
  const local = () => handler();
  target.addEventListener(table, local);

  const remote = (e: MessageEvent) => {
    if (e.data === table) handler();
  };
  channel?.addEventListener('message', remote);

  return () => {
    target.removeEventListener(table, local);
    channel?.removeEventListener('message', remote);
  };
}

if (channel) {
  channel.addEventListener('message', (e) => {
    target.dispatchEvent(new CustomEvent(String(e.data)));
  });
}
