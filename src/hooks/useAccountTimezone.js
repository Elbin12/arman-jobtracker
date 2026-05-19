import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { resolveBusinessTimezone, DEFAULT_ACCOUNT_TIMEZONE } from '../utils/accountTimezone';

/**
 * GHL location/business timezone for job tracker UI — from login `account` only (no account-info API).
 *
 * @param {string | undefined} override Highest priority — e.g. `job.account_timezone` from job API.
 */
export function useAccountTimezone(override) {
  const ghlAccount = useSelector((state) => state.auth.account);

  return useMemo(() => {
    if (override) return override;
    if (ghlAccount?.timezone) {
      return resolveBusinessTimezone({ ghlAccount });
    }
    return DEFAULT_ACCOUNT_TIMEZONE;
  }, [override, ghlAccount?.timezone]);
}

export { DEFAULT_ACCOUNT_TIMEZONE };
