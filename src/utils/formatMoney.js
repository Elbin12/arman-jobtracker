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

/** Compact amount for tight UI (e.g. mobile dashboard): $12.5k */
export function formatMoneyCompact(amount, currency = DEFAULT_ACCOUNT_CURRENCY) {
  const n = typeof amount === 'string' ? Number.parseFloat(amount) : Number(amount);
  if (amount == null || Number.isNaN(n)) return '—';
  const sym = getCurrencySymbol(currency);
  const sign = n < 0 ? '−' : '';
  return `${sign}${sym}${(Math.abs(n) / 1000).toFixed(1)}k`;
}
