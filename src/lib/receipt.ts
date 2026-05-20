// One-click receipt printing and one-click sales report (CSV) export.

import type { Transaction } from '@/db/database';
import { format } from 'date-fns';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );
}

export function printReceipt(tx: Transaction, businessName = 'KwaPOS') {
  const w = window.open('', '_blank', 'width=380,height=600');
  if (!w) return;

  const rows = tx.items
    .map(
      (i) =>
        `<tr><td>${escapeHtml(i.productName)} ×${i.quantity}</td><td style="text-align:right">KES ${(
          i.unitPrice * i.quantity
        ).toLocaleString()}</td></tr>`,
    )
    .join('');

  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${tx.receiptNumber}</title>
    <style>
      body{font-family:ui-monospace,Menlo,monospace;padding:12px;max-width:300px;margin:0 auto;color:#000}
      h1{font-size:16px;text-align:center;margin:4px 0}
      .muted{color:#555;font-size:11px;text-align:center}
      table{width:100%;font-size:12px;border-collapse:collapse;margin-top:8px}
      td{padding:2px 0}
      .totals td{border-top:1px dashed #999;padding-top:4px}
      .grand{font-weight:700;font-size:14px;border-top:1px solid #000;padding-top:4px}
      @media print { @page { margin: 4mm; } }
    </style></head><body>
    <h1>${escapeHtml(businessName)}</h1>
    <div class="muted">${format(new Date(tx.createdAt), 'MMM d, yyyy · h:mm:ss a')}</div>
    <div class="muted">Receipt: ${escapeHtml(tx.receiptNumber)}</div>
    <table>${rows}</table>
    <table class="totals">
      <tr><td>Subtotal</td><td style="text-align:right">KES ${tx.subtotal.toLocaleString()}</td></tr>
      <tr><td>Tax</td><td style="text-align:right">KES ${tx.totalTax.toLocaleString()}</td></tr>
      <tr class="grand"><td>Total</td><td style="text-align:right">KES ${tx.total.toLocaleString()}</td></tr>
      <tr><td>Paid (Cash)</td><td style="text-align:right">KES ${tx.amountPaid.toLocaleString()}</td></tr>
      ${tx.change > 0 ? `<tr><td>Change</td><td style="text-align:right">KES ${tx.change.toLocaleString()}</td></tr>` : ''}
    </table>
    <p class="muted" style="margin-top:12px">Asante! Karibu tena.</p>
    <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),300);}<\/script>
  </body></html>`);
  w.document.close();
}

export function downloadSalesReport(transactions: Transaction[]) {
  const header = [
    'Receipt',
    'Date',
    'Items',
    'Subtotal',
    'Tax',
    'Total',
    'Paid',
    'Change',
    'Payment',
  ];
  const rows = transactions.map((tx) => [
    tx.receiptNumber,
    new Date(tx.createdAt).toISOString(),
    tx.items.reduce((n, i) => n + i.quantity, 0),
    tx.subtotal,
    tx.totalTax,
    tx.total,
    tx.amountPaid,
    tx.change,
    tx.paymentMethod,
  ]);

  const csv = [header, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kwapos-sales-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
