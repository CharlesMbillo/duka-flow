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
  INIT: [ESC, 0x40], // Initialize printer
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  DOUBLE_HEIGHT_ON: [ESC, 0x21, 0x10],
  DOUBLE_WIDTH_ON: [ESC, 0x21, 0x20],
  DOUBLE_SIZE_ON: [ESC, 0x21, 0x30],
  NORMAL_SIZE: [ESC, 0x21, 0x00],
  UNDERLINE_ON: [ESC, 0x2d, 0x01],
  UNDERLINE_OFF: [ESC, 0x2d, 0x00],
  CUT_PAPER: [GS, 0x56, 0x00], // Full cut
  CUT_PARTIAL: [GS, 0x56, 0x01], // Partial cut
  FEED_LINES: (n: number) => [ESC, 0x64, n],
};

// Singleton state
let bluetoothDevice: BluetoothDevice | null = null;
let writeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
let printerPaperWidth: PaperWidth = '58mm';

export function setPaperWidth(width: PaperWidth) {
  printerPaperWidth = width;
}

export function getPaperWidth(): PaperWidth {
  return printerPaperWidth;
}

export function isConnected(): boolean {
  return bluetoothDevice?.gatt?.connected === true && writeCharacteristic !== null;
}

export function getDeviceName(): string | null {
  return bluetoothDevice?.name ?? null;
}

export async function connectPrinter(): Promise<string> {
  if (!navigator.bluetooth) {
    throw new Error('WebBluetooth is not supported in this browser. Use Chrome or Edge on Android.');
  }

  // Request Bluetooth device – most thermal printers expose the Serial Port Profile
  const device = await navigator.bluetooth.requestDevice({
    filters: [
      { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Common BLE printer service
    ],
    optionalServices: [
      '000018f0-0000-1000-8000-00805f9b34fb',
      '00001101-0000-1000-8000-00805f9b34fb', // SPP
      'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Another common printer service
    ],
  }).catch(() => {
    // Fallback: accept any Bluetooth device
    return navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
      ],
    });
  });

  const server = await device.gatt!.connect();
  
  // Try known printer service UUIDs
  const serviceUUIDs = [
    '000018f0-0000-1000-8000-00805f9b34fb',
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  ];

  let characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  for (const uuid of serviceUUIDs) {
    try {
      const service = await server.getPrimaryService(uuid);
      const chars = await service.getCharacteristics();
      // Find writable characteristic
      characteristic = chars.find(c =>
        c.properties.write || c.properties.writeWithoutResponse
      ) ?? null;
      if (characteristic) break;
    } catch {
      continue;
    }
  }

  if (!characteristic) {
    throw new Error('Could not find a writable characteristic on this printer. Make sure it is a BLE thermal printer.');
  }

  bluetoothDevice = device;
  writeCharacteristic = characteristic;

  device.addEventListener('gattserverdisconnected', () => {
    bluetoothDevice = null;
    writeCharacteristic = null;
  });

  return device.name || 'Unknown Printer';
}

export async function disconnectPrinter() {
  if (bluetoothDevice?.gatt?.connected) {
    bluetoothDevice.gatt.disconnect();
  }
  bluetoothDevice = null;
  writeCharacteristic = null;
}

// Write data in chunks (BLE has ~20-byte MTU typically, but most printers accept more)
async function writeData(data: Uint8Array) {
  if (!writeCharacteristic) throw new Error('Printer not connected');
  
  const CHUNK_SIZE = 100; // Safe chunk size for BLE
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    if (writeCharacteristic.properties.writeWithoutResponse) {
      await writeCharacteristic.writeValueWithoutResponse(chunk);
    } else {
      await writeCharacteristic.writeValueWithResponse(chunk);
    }
    // Small delay between chunks
    if (i + CHUNK_SIZE < data.length) {
      await new Promise(r => setTimeout(r, 20));
    }
  }
}

function textToBytes(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

function padLine(left: string, right: string, width: number): string {
  const space = width - left.length - right.length;
  if (space <= 0) return left + ' ' + right;
  return left + ' '.repeat(space) + right;
}

function dashedLine(width: number): string {
  return '-'.repeat(width);
}

export async function printReceipt(transaction: Transaction, businessName?: string): Promise<void> {
  const width = CHARS_PER_LINE[printerPaperWidth];
  const bytes: number[] = [];

  const push = (...data: number[]) => bytes.push(...data);
  const pushText = (text: string) => push(...textToBytes(text), LF);
  const pushLine = () => pushText(dashedLine(width));

  // Initialize
  push(...CMD.INIT);

  // Header
  push(...CMD.ALIGN_CENTER);
  push(...CMD.BOLD_ON);
  push(...CMD.DOUBLE_SIZE_ON);
  pushText(businessName || 'KwaPOS');
  push(...CMD.NORMAL_SIZE);
  push(...CMD.BOLD_OFF);
  
  pushText('RECEIPT');
  push(...CMD.ALIGN_LEFT);
  pushLine();

  // Receipt info
  pushText(`Receipt: ${transaction.receiptNumber}`);
  pushText(`Date: ${new Date(transaction.createdAt).toLocaleString('en-KE')}`);
  if (transaction.kraInvoiceNumber) {
    pushText(`KRA Invoice: ${transaction.kraInvoiceNumber}`);
  }
  pushLine();

  // Column header
  push(...CMD.BOLD_ON);
  pushText(padLine('Item', 'Amount', width));
  push(...CMD.BOLD_OFF);
  pushLine();

  // Items
  for (const item of transaction.items) {
    const name = item.productName.length > width - 12
      ? item.productName.substring(0, width - 15) + '...'
      : item.productName;
    const lineTotal = (item.unitPrice * item.quantity).toLocaleString();
    pushText(name);
    const detail = `  ${item.quantity} x ${item.unitPrice.toLocaleString()}`;
    pushText(padLine(detail, lineTotal, width));
    
    // Tax info
    const taxLabel = getTaxLabel(item.taxCategory);
    if (item.taxAmount > 0) {
      pushText(`  ${taxLabel}: ${item.taxAmount.toLocaleString()}`);
    }
  }

  pushLine();

  // Totals
  pushText(padLine('Subtotal:', `KES ${transaction.subtotal.toLocaleString()}`, width));
  pushText(padLine('Tax:', `KES ${transaction.totalTax.toLocaleString()}`, width));
  push(...CMD.BOLD_ON);
  push(...CMD.DOUBLE_HEIGHT_ON);
  pushText(padLine('TOTAL:', `KES ${transaction.total.toLocaleString()}`, width));
  push(...CMD.NORMAL_SIZE);
  push(...CMD.BOLD_OFF);

  pushLine();

  // Payment
  pushText(padLine('Paid:', `KES ${transaction.amountPaid.toLocaleString()}`, width));
  if (transaction.change > 0) {
    pushText(padLine('Change:', `KES ${transaction.change.toLocaleString()}`, width));
  }

  pushLine();

  // Footer
  push(...CMD.ALIGN_CENTER);
  pushText('Thank you for your purchase!');
  pushText('Powered by KwaPOS');
  push(...CMD.ALIGN_LEFT);

  // Feed and cut
  push(...CMD.FEED_LINES(4));
  push(...CMD.CUT_PARTIAL);

  await writeData(new Uint8Array(bytes));
}
