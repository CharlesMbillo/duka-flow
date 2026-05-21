import { useEffect, useState } from 'react';
import { db, type EtimsQueueItem } from '@/db/database';

export function useEtimsQueue() {
  const [items, setItems] = useState<EtimsQueueItem[]>([]);

  useEffect(() => {
    let stop = false;
    const load = async () => {
      const all = await db.etimsQueue.getAll();
      if (!stop) setItems(all);
    };
    load();
    const id = window.setInterval(load, 4000);
    return () => { stop = true; window.clearInterval(id); };
  }, []);

  const pending = items.filter((i) => i.status !== 'submitted');
  return { items, pending, pendingCount: pending.length };
}
