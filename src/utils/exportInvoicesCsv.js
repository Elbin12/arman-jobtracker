import { DEFAULT_ACCOUNT_CURRENCY } from './accountCurrency';

/**
 * CSV with UTF-8 BOM opens cleanly in Excel.
 * @param {Array<Record<string, unknown>>} invoices
 * @param {string} [contactLabel]
 */
export function exportInvoicesToCsv(invoices, contactLabel = '') {
  if (!Array.isArray(invoices) || invoices.length === 0) return;

  const headers = [
    'Invoice number',
    'Invoice id',
    'Status',
    'Issue date',
    'Due date',
    'Total',
    'Amount paid',
    'Balance due',
    'Currency',
    'Overdue',
  ];

  const escape = (v) => {
    const s = v == null ? '' : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const fmtDate = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toISOString().slice(0, 10);
    } catch {
      return String(iso);
    }
  };

  const rows = invoices.map((inv) =>
    [
      inv.invoice_number ?? '',
      inv.invoice_id ?? inv.id ?? '',
      inv.status ?? '',
      fmtDate(inv.issue_date),
      fmtDate(inv.due_date),
      inv.total ?? '',
      inv.amount_paid ?? '',
      inv.amount_due ?? '',
      inv.currency ?? DEFAULT_ACCOUNT_CURRENCY,
      inv.is_overdue ? 'Yes' : 'No',
    ].map(escape),
  );

  const bom = '\uFEFF';
  const csv = [headers.map(escape), ...rows].map((r) => r.join(',')).join('\r\n');
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safe = contactLabel.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') || 'contact';
  a.href = url;
  a.download = `invoices-${safe}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
