import { useState, useEffect, useCallback } from 'react';
import {
  connectPrinter,
  disconnectPrinter,
  isConnected,
  getDeviceName,
  setPaperWidth,
  getPaperWidth,
  printReceipt,
  type PaperWidth,
} from '@/lib/printer';
import { type Transaction } from '@/db/database';
import { db } from '@/db/database';
import { toast } from 'sonner';

export function usePrinter() {
  const [connected, setConnected] = useState(isConnected());
  const [deviceName, setDeviceName] = useState(getDeviceName());
  const [paperWidth, setPaperWidthState] = useState<PaperWidth>(getPaperWidth());
  const [connecting, setConnecting] = useState(false);
  const [printing, setPrinting] = useState(false);

  // Sync connection state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setConnected(isConnected());
      setDeviceName(getDeviceName());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const name = await connectPrinter();
      setConnected(true);
      setDeviceName(name);
      toast.success(`Connected to ${name}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to connect to printer');
    }
    setConnecting(false);
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectPrinter();
    setConnected(false);
    setDeviceName(null);
    toast.success('Printer disconnected');
  }, []);

  const changePaperWidth = useCallback((width: PaperWidth) => {
    setPaperWidth(width);
    setPaperWidthState(width);
  }, []);

  const print = useCallback(async (transaction: Transaction) => {
    if (!isConnected()) {
      toast.error('No printer connected');
      return;
    }
    setPrinting(true);
    try {
      const bizSetting = await db.settings.getByKey('businessName');
      await printReceipt(transaction, bizSetting?.value);
      toast.success('Receipt printed');
    } catch (e: any) {
      toast.error(e.message || 'Print failed');
    }
    setPrinting(false);
  }, []);

  const supported = typeof navigator !== 'undefined' && !!(navigator as any).bluetooth;

  return {
    supported,
    connected,
    connecting,
    printing,
    deviceName,
    paperWidth,
    connect,
    disconnect,
    changePaperWidth,
    print,
  };
}
