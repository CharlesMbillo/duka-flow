/// <reference types="web-bluetooth" />

/**
 * WebBluetooth ESC/POS thermal printer service
 * Supports 58mm (32 chars/line) and 80mm (48 chars/line) printers
 */

import { type Transaction, getTaxLabel } from '@/db/database';

export type PaperWidth = '58mm' | '80mm';

const CHARS_PER_LINE: Record<PaperWidth, number> = {
  '58mm': 32,
  '80mm': 48,
};

// ESC/POS command constants
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const CMD = {
  INIT: [ESC, 0x40],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  DOUBLE_HEIGHT_ON: [ESC, 0x21, 0x10],
  DOUBLE_SIZE_ON: [ESC, 0x21, 0x30],
  NORMAL_SIZE: [ESC, 0x21, 0x00],
  CUT_PARTIAL: [GS, 0x56, 0x01],
  FEED_LINES: (n: number) => [ESC, 0x64, n],
};

let bluetoothDevice: any = null;
let writeChar: any = null;
let printerPaperWidth: PaperWidth = '58mm';

export function setPaperWidth(width: PaperWidth) { printerPaperWidth = width; }
export function getPaperWidth(): PaperWidth { return printerPaperWidth; }
export function isConnected(): boolean { return bluetoothDevice?.gatt?.connected === true && writeChar !== null; }
export function getDeviceName(): string | null { return bluetoothDevice?.name ?? null; }

export async function connectPrinter(): Promise<string> {
  const bt = (navigator as any).bluetooth;
  if (!bt) throw new Error('WebBluetooth not supported. Use Chrome/Edge on Android.');

  let device: any;
  try {
    device = await bt.requestDevice({
      filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
      ],
    });
  } catch {
    device = await bt.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
      ],
    });
  }

  const server = await device.gatt.connect();
  const serviceUUIDs = [
    '000018f0-0000-1000-8000-00805f9b34fb',
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  ];

  let characteristic: any = null;
  for (const uuid of serviceUUIDs) {
    try {
      const service = await server.getPrimaryService(uuid);
      const chars = await service.getCharacteristics();
      characteristic = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse) ?? null;
      if (characteristic) break;
    } catch { continue; }
  }

  if (!characteristic) throw new Error('No writable characteristic found. Ensure this is a BLE thermal printer.');

  bluetoothDevice = device;
  writeChar = characteristic;
  device.addEventListener('gattserverdisconnected', () => { bluetoothDevice = null; writeChar = null; });
  return device.name || 'Unknown Printer';
}

export async function disconnectPrinter() {
  if (bluetoothDevice?.gatt?.connected) bluetoothDevice.gatt.disconnect();
  bluetoothDevice = null;
  writeChar = null;
}

async function writeData(data: Uint8Array) {
  if (!writeChar) throw new Error('Printer not connected');
  const CHUNK = 100;
  for (let i = 0; i < data.length; i += CHUNK) {
    const chunk = data.slice(i, i + CHUNK);
    if (writeChar.properties.writeWithoutResponse) {
      await writeChar.writeValueWithoutResponse(chunk);
    } else {
      await writeChar.writeValueWithResponse(chunk);
    }
    if (i + CHUNK < data.length) await new Promise(r => setTimeout(r, 20));
  }
}

function textToBytes(text: string): number[] { return Array.from(new TextEncoder().encode(text)); }

function padLine(left: string, right: string, width: number): string {
  const space = width - left.length - right.length;
  return space <= 0 ? left + ' ' + right : left + ' '.repeat(space) + right;
}

function dashedLine(width: number): string { return '-'.repeat(width); }

export async function printReceipt(transaction: Transaction, businessName?: string): Promise<void> {
  const width = CHARS_PER_LINE[printerPaperWidth];
  const bytes: number[] = [];
  const push = (...data: number[]) => bytes.push(...data);
  const pushText = (text: string) => push(...textToBytes(text), LF);
  const pushLine = () => pushText(dashedLine(width));

  push(...CMD.INIT);

  // Header
  push(...CMD.ALIGN_CENTER, ...CMD.BOLD_ON, ...CMD.DOUBLE_SIZE_ON);
  pushText(businessName || 'KwaPOS');
  push(...CMD.NORMAL_SIZE, ...CMD.BOLD_OFF);
  pushText('RECEIPT');
  push(...CMD.ALIGN_LEFT);
  pushLine();

  pushText(`Receipt: ${transaction.receiptNumber}`);
  pushText(`Date: ${new Date(transaction.createdAt).toLocaleString('en-KE')}`);
  if (transaction.kraInvoiceNumber) pushText(`KRA Invoice: ${transaction.kraInvoiceNumber}`);
  pushLine();

  push(...CMD.BOLD_ON);
  pushText(padLine('Item', 'Amount', width));
  push(...CMD.BOLD_OFF);
  pushLine();

  for (const item of transaction.items) {
    const name = item.productName.length > width - 12
      ? item.productName.substring(0, width - 15) + '...'
      : item.productName;
    pushText(name);
    pushText(padLine(`  ${item.quantity} x ${item.unitPrice.toLocaleString()}`, (item.unitPrice * item.quantity).toLocaleString(), width));
    if (item.taxAmount > 0) pushText(`  ${getTaxLabel(item.taxCategory)}: ${item.taxAmount.toLocaleString()}`);
  }

  pushLine();
  pushText(padLine('Subtotal:', `KES ${transaction.subtotal.toLocaleString()}`, width));
  pushText(padLine('Tax:', `KES ${transaction.totalTax.toLocaleString()}`, width));
  push(...CMD.BOLD_ON, ...CMD.DOUBLE_HEIGHT_ON);
  pushText(padLine('TOTAL:', `KES ${transaction.total.toLocaleString()}`, width));
  push(...CMD.NORMAL_SIZE, ...CMD.BOLD_OFF);
  pushLine();
  pushText(padLine('Paid:', `KES ${transaction.amountPaid.toLocaleString()}`, width));
  if (transaction.change > 0) pushText(padLine('Change:', `KES ${transaction.change.toLocaleString()}`, width));
  pushLine();

  push(...CMD.ALIGN_CENTER);
  pushText('Thank you for your purchase!');
  pushText('Powered by KwaPOS');
  push(...CMD.ALIGN_LEFT);
  push(...CMD.FEED_LINES(4));
  push(...CMD.CUT_PARTIAL);

  await writeData(new Uint8Array(bytes));
}
