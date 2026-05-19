import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { resolveAccountCurrency, DEFAULT_ACCOUNT_CURRENCY } from '../utils/accountCurrency';

/**
 * GHL location currency for admin UI — from login `account` only (no account-info API).
 *
 * @param {string | undefined} override Highest priority — e.g. per-record currency from API.
 */
export function useAccountCurrency(override) {
  const ghlAccount = useSelector((state) => state.auth.account);

  return useMemo(() => {
    if (override) return override;
    if (ghlAccount?.currency) {
      return resolveAccountCurrency({ ghlAccount });
    }
    return DEFAULT_ACCOUNT_CURRENCY;
  }, [override, ghlAccount?.currency]);
}

export { DEFAULT_ACCOUNT_CURRENCY };
