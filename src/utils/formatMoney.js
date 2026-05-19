import { DEFAULT_ACCOUNT_CURRENCY } from './accountCurrency';

function localeForCurrency(currency) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).resolvedOptions().locale;
  } catch {
    return 'en-US';
  }
}

/**
 * @param {number | string | null | undefined} amount
 * @param {string} [currency]
 * @returns {string}
 */
export function formatMoney(amount, currency = DEFAULT_ACCOUNT_CURRENCY) {
  const n = typeof amount === 'string' ? Number.parseFloat(amount) : Number(amount);
  if (amount == null || amount === '' || Number.isNaN(n)) return '—';
  try {
    return new Intl.NumberFormat(localeForCurrency(currency), {
      style: 'currency',
      currency,
    }).format(n);
  } catch {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: DEFAULT_ACCOUNT_CURRENCY,
    }).format(n);
  }
}

/** @param {number | string | null | undefined} amount */
export function formatMoneyOrZero(amount, currency = DEFAULT_ACCOUNT_CURRENCY) {
  const n = typeof amount === 'string' ? Number.parseFloat(amount) : Number(amount);
  if (amount == null || amount === '' || Number.isNaN(n)) {
    return formatMoney(0, currency);
  }
  return formatMoney(n, currency);
}

/** Symbol only (e.g. $, CA$, €) for form labels. */
export function getCurrencySymbol(currency = DEFAULT_ACCOUNT_CURRENCY) {
  try {
    const parts = new Intl.NumberFormat(localeForCurrency(currency), {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    return parts.find((p) => p.type === 'currency')?.value ?? '$';
  } catch {
    return '$';
  }
}

/**
 * ASCII-safe currency strings for jsPDF (Helvetica / WinAnsi only).
 * Unicode symbols like ₹ render as wrong glyphs (often "1") in PDFs.
 */
const PDF_CURRENCY_PREFIX = {
  USD: '$',
  CAD: 'CA$',
  AUD: 'A$',
  NZD: 'NZ$',
  MXN: 'MX$',
  INR: 'Rs.',
  GBP: 'GBP',
  EUR: 'EUR',
  CHF: 'CHF',
  JPY: 'JPY',
  CNY: 'CNY',
  SGD: 'SGD',
  HKD: 'HKD',
  AED: 'AED',
  SAR: 'SAR',
};

const PDF_PREFIX_NO_SPACE = new Set(['$', 'CA$', 'A$', 'NZ$', 'MX$']);

function formatPdfAmountNumber(n) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(n));
}

function pdfCurrencyPrefix(currency = DEFAULT_ACCOUNT_CURRENCY) {
  const code = String(currency || DEFAULT_ACCOUNT_CURRENCY).trim().toUpperCase();
  return PDF_CURRENCY_PREFIX[code] ?? code;
}

function joinPdfPrefixAndAmount(prefix, formatted, sign) {
  if (PDF_PREFIX_NO_SPACE.has(prefix) || prefix.endsWith('$')) {
    return `${sign}${prefix}${formatted}`;
  }
  return `${sign}${prefix} ${formatted}`;
}

/**
 * Format money for jsPDF — use instead of formatMoney() in PDF generators.
 * INR → "Rs. 270.63", USD → "$270.63"
 */
export function formatMoneyForPdf(amount, currency = DEFAULT_ACCOUNT_CURRENCY) {
  const n = typeof amount === 'string' ? Number.parseFloat(amount) : Number(amount);
  if (amount == null || amount === '' || Number.isNaN(n)) return '—';
  const prefix = pdfCurrencyPrefix(currency);
  const sign = n < 0 ? '-' : '';
  return joinPdfPrefixAndAmount(prefix, formatPdfAmountNumber(n), sign);
}

export function formatMoneyOrZeroForPdf(amount, currency = DEFAULT_ACCOUNT_CURRENCY) {
  const n = typeof amount === 'string' ? Number.parseFloat(amount) : Number(amount);
  if (amount == null || amount === '' || Number.isNaN(n)) {
    return formatMoneyForPdf(0, currency);
  }
  return formatMoneyForPdf(n, currency);
}

/** Compact amount for tight UI (e.g. mobile dashboard): $12.5k */
export function formatMoneyCompact(amount, currency = DEFAULT_ACCOUNT_CURRENCY) {
  const n = typeof amount === 'string' ? Number.parseFloat(amount) : Number(amount);
  if (amount == null || Number.isNaN(n)) return '—';
  const sym = getCurrencySymbol(currency);
  const sign = n < 0 ? '−' : '';
  return `${sign}${sym}${(Math.abs(n) / 1000).toFixed(1)}k`;
}
