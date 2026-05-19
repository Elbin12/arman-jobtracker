import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetAccountInfoQuery } from '../store/api/user/quoteApi';
import {
  getDefaultCompanyProfile,
  getLoadingCompanyProfile,
  mapAccountInfoToCompanyProfile,
} from '../utils/companyProfile';
import { resolveAccountCurrency, DEFAULT_ACCOUNT_CURRENCY } from '../utils/accountCurrency';
import { formatMoney, getCurrencySymbol } from '../utils/formatMoney';

/** Branding location from URL or env — not the GHL location on a submission. */
export function resolveBrandingLocationId(searchParams) {
  return (
    searchParams?.get?.('location_id') ||
    searchParams?.get?.('locaton_id') ||
    import.meta.env.VITE_LOCATION_ID ||
    null
  );
}

export function resolveLocationId(searchParams, quote) {
  const locationFromQuote =
    quote?.location_id ||
    quote?.location_details?.location_id ||
    (typeof quote?.location === 'string' ? quote.location : null) ||
    quote?.location?.id;

  return (
    resolveBrandingLocationId(searchParams) ||
    locationFromQuote ||
    null
  );
}

export function useAccountBranding({ locationId: locationIdProp, quote } = {}) {
  const [searchParams] = useSearchParams();
  const locationId =
    locationIdProp ?? resolveLocationId(searchParams, quote);

  const {
    data: accountInfo,
    isLoading,
    isFetching,
    isSuccess,
  } = useGetAccountInfoQuery(
    { location_id: locationId },
    { skip: !locationId }
  );

  const isLoadingBranding = Boolean(locationId) && (isLoading || isFetching);
  const isReady = !locationId || isSuccess;

  const profile = useMemo(() => {
    if (accountInfo) return mapAccountInfoToCompanyProfile(accountInfo);
    if (locationId && isLoadingBranding) return getLoadingCompanyProfile();
    return getDefaultCompanyProfile();
  }, [accountInfo, locationId, isLoadingBranding]);

  const currency = useMemo(
    () =>
      resolveAccountCurrency({
        accountCurrency: accountInfo?.currency ?? profile?.currency,
      }),
    [accountInfo?.currency, profile?.currency],
  );

  const formatPrice = useCallback((amount) => formatMoney(amount, currency), [currency]);
  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency]);

  return {
    profile,
    accountInfo,
    locationId,
    currency,
    formatPrice,
    currencySymbol,
    isLoading: isLoadingBranding,
    isReady,
  };
}

export { DEFAULT_ACCOUNT_CURRENCY };
