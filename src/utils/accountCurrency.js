/** Fallback when GHL account / account-info currency is missing. */
export const DEFAULT_ACCOUNT_CURRENCY = 'USD';

/**
 * @param {object} [options]
 * @param {{ currency?: string | null } | null} [options.ghlAccount] From auth login `account`.
 * @param {string | null | undefined} [options.locationCurrency] From `/quote/account-info/`.
 * @param {string | null | undefined} [options.accountCurrency] Alias for locationCurrency or explicit override.
 */
export function resolveAccountCurrency({
  ghlAccount,
  locationCurrency,
  accountCurrency,
} = {}) {
  if (typeof locationCurrency === 'string' && locationCurrency.trim()) {
    return locationCurrency.trim();
  }
  if (typeof accountCurrency === 'string' && accountCurrency.trim()) {
    return accountCurrency.trim();
  }
  const fromAccount = ghlAccount?.currency;
  if (typeof fromAccount === 'string' && fromAccount.trim()) {
    return fromAccount.trim();
  }
  return DEFAULT_ACCOUNT_CURRENCY;
}
