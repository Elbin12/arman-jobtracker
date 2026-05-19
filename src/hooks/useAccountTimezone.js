import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { useGetAccountInfoQuery } from '../store/api/user/quoteApi';
import { resolveBusinessTimezone, DEFAULT_ACCOUNT_TIMEZONE } from '../utils/accountTimezone';

/**
 * GHL location/business timezone for job tracker UI (not employee payroll timezone).
 *
 * @param {string | undefined} override
 *   Highest priority — e.g. `job.account_timezone` from job API.
 */
export function useAccountTimezone(override) {
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

    if (needsLocationLookup && locationAccountInfo?.timezone) {
      return resolveBusinessTimezone({ locationTimezone: locationAccountInfo.timezone });
    }

    if (ghlAccount?.timezone) {
      return resolveBusinessTimezone({ ghlAccount });
    }

    return DEFAULT_ACCOUNT_TIMEZONE;
  }, [
    override,
    needsLocationLookup,
    locationAccountInfo?.timezone,
    ghlAccount?.timezone,
    ghlAccount?.location_id,
    locationId,
  ]);
}

export { DEFAULT_ACCOUNT_TIMEZONE };
