import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { useGetAccountInfoQuery } from '../store/api/user/quoteApi';
import { resolveAccountCurrency, DEFAULT_ACCOUNT_CURRENCY } from '../utils/accountCurrency';

/**
 * GHL location currency for admin UI (from login `account` or account-info when URL location differs).
 *
 * @param {string | undefined} override Highest priority — e.g. per-record currency from API.
 */
export function useAccountCurrency(override) {
  const ghlAccount = useSelector((state) => state.auth.account);
  const [searchParams] = useSearchParams();
  const locationId = searchParams.get('location_id');

  const needsLocationLookup =
    Boolean(locationId) &&
    (!ghlAccount?.location_id || ghlAccount.location_id !== locationId);

  const { data: locationAccountInfo } = useGetAccountInfoQuery(
    { location_id: locationId },
    { skip: !needsLocationLookup },
  );

  return useMemo(() => {
    if (override) return override;

    if (needsLocationLookup && locationAccountInfo?.currency) {
      return resolveAccountCurrency({ locationCurrency: locationAccountInfo.currency });
    }

    if (ghlAccount?.currency) {
      return resolveAccountCurrency({ ghlAccount });
    }

    return DEFAULT_ACCOUNT_CURRENCY;
  }, [
    override,
    needsLocationLookup,
    locationAccountInfo?.currency,
    ghlAccount?.currency,
    ghlAccount?.location_id,
    locationId,
  ]);
}

export { DEFAULT_ACCOUNT_CURRENCY };
