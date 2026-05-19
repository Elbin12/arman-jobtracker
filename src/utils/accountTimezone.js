/** Fallback when GHL account/location timezone is missing. */
export const DEFAULT_ACCOUNT_TIMEZONE = 'America/Chicago';

/**
 * Resolve business (GHL location) timezone — never employee payroll timezone.
 *
 * @param {object} [options]
 * @param {{ timezone?: string | null, location_id?: string | null } | null} [options.ghlAccount]
 *   From auth `account` (login) or job API.
 * @param {string | null | undefined} [options.locationTimezone]
 *   From account-info API when `location_id` is in the URL.
 * @returns {string} IANA timezone name
 */
export function resolveBusinessTimezone({ ghlAccount, locationTimezone } = {}) {
  if (typeof locationTimezone === 'string' && locationTimezone.trim()) {
    return locationTimezone.trim();
  }
  const accountTz = ghlAccount?.timezone;
  if (typeof accountTz === 'string' && accountTz.trim()) {
    return accountTz.trim();
  }
  return DEFAULT_ACCOUNT_TIMEZONE;
}

/** @deprecated Use resolveBusinessTimezone — kept for imports that pass userProfile by mistake. */
export function getAccountTimezone(userProfile) {
  return resolveBusinessTimezone({ ghlAccount: userProfile?.account });
}
