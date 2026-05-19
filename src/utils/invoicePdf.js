import { format, parseISO } from 'date-fns';
import { DEFAULT_ACCOUNT_CURRENCY } from './accountCurrency';
import { formatMoney as formatMoneyUtil } from './formatMoney';

const BLUE = [20, 90, 180];
const BLUE_DARK = [15, 70, 150];
const RED_DUE = [198, 40, 40];
const MUTED = [100, 108, 120];
const BORDER = [220, 224, 230];

const COMPANY = () => ({
  tradeName: import.meta.env.VITE_COMPANY_NAME || 'TruShine Window Cleaning',
  legalName: import.meta.env.VITE_COMPANY_LEGAL_NAME || null,
  address:
    import.meta.env.VITE_COMPANY_ADDRESS ||
    '3525 Murdock St, Houston, TX, 77047, United States',
  phone: import.meta.env.VITE_COMPANY_PHONE || '+1 832-713-3545',
  email: import.meta.env.VITE_COMPANY_EMAIL || 'trushinehouston@gmail.com',
  logoUrl:
    import.meta.env.VITE_COMPANY_LOGO_URL ||
    'https://storage.googleapis.com/msgsndr/b8qvo7VooP3JD3dIZU42/media/683efc8fd5817643ff8194f0.jpeg',
});

function formatMoney(amount, currency = DEFAULT_ACCOUNT_CURRENCY) {
  return formatMoneyUtil(amount, currency);
}

function formatLongDate(iso) {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMMM d, yyyy');
  } catch {
    try {
      return format(new Date(iso), 'MMMM d, yyyy');
    } catch {
      return String(iso);
    }
  }
}

function billToName(contact) {
  if (!contact) return 'Customer';
  const n = [contact.first_name, contact.last_name].filter(Boolean).join(' ').trim();
  return n || contact.company_name || contact.email || 'Customer';
}

function billToLines(contact, billToAddress) {
  const lines = [];
  const addrParts = billToAddress
    ? [
        billToAddress.street_address,
        [billToAddress.city, billToAddress.state, billToAddress.postal_code].filter(Boolean).join(', '),
      ].filter(Boolean)
    : [];
  const addr =
    addrParts.length > 0 ? addrParts.join(', ') : billToAddress?.full_address || '';
  if (addr) lines.push({ icon: 'addr', text: addr });
  if (contact?.email) lines.push({ icon: 'mail', text: contact.email });
  if (contact?.phone) lines.push({ icon: 'phone', text: contact.phone });
  return lines;
}

/** @param {Record<string, unknown>} invoice */
function normalizeLineItems(invoice) {
  const raw = invoice.items ?? invoice.line_items ?? invoice.products ?? invoice.services;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((li) => {
      const qty = Number(li.quantity ?? li.qty ?? li.units ?? 1) || 1;
      const unit = Number(li.unit_price ?? li.price ?? li.rate ?? 0);
      const tax = Number(li.tax ?? li.tax_amount ?? li.line_tax ?? 0);
      let lineTotal = Number(li.total ?? li.amount ?? li.line_total ?? NaN);
      if (Number.isNaN(lineTotal)) lineTotal = unit * qty + tax;
      return {
        description: String(li.description ?? li.name ?? li.title ?? li.product_name ?? 'Item').trim() || 'Item',
        qty,
        unitPrice: unit,
        tax,
        total: lineTotal,
      };
    });
  }

  const total = Number(invoice.total ?? 0);
  const tax = Number(
    invoice.tax_amount ?? invoice.tax_total ?? invoice.tax ?? Math.max(0, total - Number(invoice.subtotal ?? total)),
  );
  const subtotal =
    invoice.subtotal != null
      ? Number(invoice.subtotal)
      : Number.isFinite(total) && Number.isFinite(tax)
        ? Math.max(0, total - tax)
        : total;

  return [
    {
      description: String(invoice.memo ?? invoice.title ?? invoice.notes ?? 'Invoice amount').trim() || 'Invoice amount',
      qty: 1,
      unitPrice: subtotal,
      tax,
      total: Number.isFinite(total) ? total : subtotal + tax,
    },
  ];
}

function sumLineItems(lines) {
  let sub = 0;
  let tx = 0;
  for (const l of lines) {
    sub += l.unitPrice * l.qty;
    tx += l.tax;
  }
  return { subtotal: sub, taxSum: tx };
}

async function loadLogoDataUrl(url) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * @param {Record<string, unknown>} invoice
 * @param {Record<string, unknown> | null} contact
 * @param {Record<string, unknown> | null} billToAddress
 */
export async function buildInvoicePdf(invoice, contact, billToAddress) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const innerW = pageW - margin * 2;
  let y = 0;

  const co = COMPANY();
  const statusLabel = invoice.status
    ? String(invoice.status)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : '—';
  const invNo = invoice.invoice_number ?? invoice.invoice_id ?? invoice.id ?? '—';
  const invNoDisplay = String(invNo).startsWith('#') ? String(invNo) : `#${invNo}`;
  const currency = invoice.currency || DEFAULT_ACCOUNT_CURRENCY;
  const amountDue = Number(invoice.amount_due ?? invoice.total ?? 0);
  const lines = normalizeLineItems(invoice);
  const computed = sumLineItems(lines);
  let subtotal =
    invoice.subtotal != null ? Number(invoice.subtotal) : computed.subtotal;
  let taxAmt =
    invoice.tax_amount != null || invoice.tax_total != null
      ? Number(invoice.tax_amount ?? invoice.tax_total)
      : computed.taxSum;
  const invTotal = Number(
    invoice.total != null && invoice.total !== '' ? invoice.total : subtotal + taxAmt,
  );

  // --- Header (blue band) ---
  const headerH = 26;
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, pageW, headerH, 'F');

  let logoData = await loadLogoDataUrl(co.logoUrl);
  const logoSize = 11;
  const logoY = (headerH - logoSize) / 2;
  if (logoData) {
    try {
      doc.addImage(logoData, 'JPEG', margin, logoY, logoSize, logoSize);
    } catch {
      try {
        doc.addImage(logoData, 'PNG', margin, logoY, logoSize, logoSize);
      } catch {
        logoData = null;
      }
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', margin + logoSize + 4, headerH / 2 + 2);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(invNoDisplay, margin + logoSize + 4, headerH / 2 + 8);

  const badgeW = doc.getTextWidth(statusLabel) + 14;
  const badgeX = pageW - margin - badgeW;
  const badgeY = headerH / 2 - 4;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(badgeX, badgeY, badgeW, 9, 2, 2, 'F');
  doc.setTextColor(...BLUE_DARK);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(statusLabel, badgeX + badgeW / 2 - doc.getTextWidth(statusLabel) / 2, badgeY + 6.2);

  y = headerH + 10;
  doc.setTextColor(0, 0, 0);

  // --- From / Bill to ---
  const colGap = 8;
  const colW = (innerW - colGap) / 2;
  const leftX = margin;
  const rightX = margin + colW + colGap;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 44, 52);
  doc.text('From', leftX, y);
  doc.text('Bill To', rightX, y);
  y += 6;

  const bodyY0 = y;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(40, 44, 52);
  doc.text(co.tradeName, leftX, bodyY0, { maxWidth: colW });
  doc.text(billToName(contact), rightX, bodyY0, { maxWidth: colW });

  let leftY = bodyY0 + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  if (co.legalName) {
    doc.text(co.legalName, leftX, leftY, { maxWidth: colW });
    leftY += 4;
  }

  doc.setFontSize(8.5);
  doc.setTextColor(55, 58, 65);
  [co.email, co.phone, co.address].forEach((t) => {
    doc.text(String(t), leftX, leftY, { maxWidth: colW });
    leftY += 4.5;
  });

  let rightY = bodyY0 + 6;
  billToLines(contact, billToAddress).forEach((row) => {
    doc.text(row.text, rightX, rightY, { maxWidth: colW });
    rightY += 4.5;
  });

  y = Math.max(leftY, rightY) + 8;

  doc.setDrawColor(...BORDER);
  doc.line(margin, y, pageW - margin, y);
  y += 7;

  // --- Detail strip ---
  const stripH = 16;
  doc.setFillColor(248, 249, 252);
  doc.roundedRect(margin, y, innerW, stripH, 1.5, 1.5, 'F');
  const cols = 4;
  const cellW = innerW / cols;
  const stripY = y;
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.setFont('helvetica', 'bold');
  const labels = ['Invoice number', 'Issue date', 'Due date', 'Amount due'];
  const values = [
    invNoDisplay,
    formatLongDate(invoice.issue_date),
    formatLongDate(invoice.due_date),
    formatMoney(amountDue, currency),
  ];
  for (let i = 0; i < cols; i++) {
    const cx = margin + i * cellW + 3;
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'bold');
    doc.text(labels[i], cx, stripY + 5);
    doc.setFontSize(9);
    if (i === cols - 1) doc.setTextColor(...RED_DUE);
    else doc.setTextColor(28, 32, 40);
    doc.setFont('helvetica', 'bold');
    doc.text(String(values[i]), cx, stripY + 11);
  }
  y = stripY + stripH + 10;

  // --- Items heading ---
  doc.setTextColor(28, 32, 40);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Items', margin, y);
  y += 6;

  doc.setFillColor(238, 240, 245);
  doc.rect(margin, y, innerW, 7, 'F');
  doc.setFontSize(8);
  doc.setTextColor(80, 86, 98);
  doc.setFont('helvetica', 'bold');
  const wDesc = innerW * 0.42;
  const wQty = innerW * 0.12;
  const wUnit = innerW * 0.16;
  const wTax = innerW * 0.14;
  const wTot = innerW * 0.16;
  let tx = margin + 2;
  doc.text('Description', tx, y + 5);
  tx += wDesc;
  doc.text('Quantity', tx, y + 5);
  tx += wQty;
  doc.text('Unit price', tx, y + 5);
  tx += wUnit;
  doc.text('Tax', tx, y + 5);
  tx += wTax;
  doc.text('Total', tx, y + 5);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 45);
  doc.setFontSize(8.5);

  const drawRow = (desc, qty, unit, tax, tot) => {
    if (y > pageH - 40) {
      doc.addPage();
      y = margin;
    }
    const descLines = doc.splitTextToSize(desc, wDesc - 4);
    const rowH = Math.max(8, descLines.length * 3.8);
    doc.setDrawColor(...BORDER);
    doc.line(margin, y, pageW - margin, y);

    let rowY = y + 5;
    descLines.forEach((ln, i) => {
      doc.text(ln, margin + 2, rowY + i * 3.8);
    });
    doc.text(String(qty.toFixed(2)), margin + wDesc + 2, rowY);
    doc.text(formatMoney(unit, currency), margin + wDesc + wQty + 2, rowY);
    doc.text(formatMoney(tax, currency), margin + wDesc + wQty + wUnit + 2, rowY);
    doc.setFont('helvetica', 'bold');
    doc.text(formatMoney(tot, currency), margin + wDesc + wQty + wUnit + wTax + 2, rowY);
    doc.setFont('helvetica', 'normal');
    y += rowH + 2;
  };

  lines.forEach((li) => {
    drawRow(li.description, li.qty, li.unitPrice, li.tax, li.total);
  });

  doc.setDrawColor(...BORDER);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // --- Pricing breakdown (right) ---
  const boxW = 72;
  const boxLeft = pageW - margin - boxW;
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.setFont('helvetica', 'bold');
  doc.text('PRICING BREAKDOWN', boxLeft, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(45, 48, 56);

  const rowLine = (label, val, bold = false, red = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    if (red) doc.setTextColor(...RED_DUE);
    else doc.setTextColor(45, 48, 56);
    doc.text(label, boxLeft, y);
    doc.text(val, pageW - margin - 2, y, { align: 'right' });
    y += 5;
  };

  rowLine('Subtotal', formatMoney(subtotal, currency));
  rowLine('Tax', formatMoney(taxAmt, currency));
  doc.setDrawColor(...BORDER);
  doc.line(boxLeft, y + 1, pageW - margin, y + 1);
  y += 4;
  rowLine('Invoice total', formatMoney(invTotal, currency), true);
  rowLine('Total', formatMoney(invTotal, currency), true);
  rowLine('Amount due', formatMoney(amountDue, currency), true, true);

  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(160, 165, 175);
  doc.text(`${co.tradeName} · Thank you for your business.`, margin, y);

  return doc;
}

export async function downloadInvoicePdf(invoice, contact, billToAddress) {
  const doc = await buildInvoicePdf(invoice, contact, billToAddress);
  const raw = invoice.invoice_number ?? invoice.invoice_id ?? invoice.id ?? 'invoice';
  const safe = String(raw).replace(/[^\w.-]+/g, '_');
  doc.save(`invoice-${safe}.pdf`);
}
