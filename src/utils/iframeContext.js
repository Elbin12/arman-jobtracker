/**
 * GHL custom-menu / iframe embed context (location + SSO identity).
 *
 * Custom menu links should pass both email and location_id, e.g.:
 *   https://services.theservicepilot.com/admin/calendar?email={{user.email}}&location_id={{location.id}}
 * Same pattern for dashboard, payroll, jobtracker, quote, etc.
 *
 * location_id is required for multi-tenant SSO. When omitted, the app falls back to
 * VITE_LOCATION_ID (TruShine), which breaks auto-login for other subaccounts.
 */

const LOCATION_STORAGE_KEY = 'iframe_location_id';
const SSO_EMAIL_STORAGE_KEY = 'iframe_sso_email';

export function isInIframe() {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin frame access can throw; treat as embedded.
    return true;
  }
}

export function getIframeLocationId() {
  if (typeof window === 'undefined') return null;
  const fromUrl = new URLSearchParams(window.location.search).get('location_id');
  if (fromUrl) {
    sessionStorage.setItem(LOCATION_STORAGE_KEY, fromUrl);
    return fromUrl;
  }
  const fromSession = sessionStorage.getItem(LOCATION_STORAGE_KEY);
  if (fromSession) return fromSession;
  return import.meta.env.VITE_LOCATION_ID || null;
}

export function setIframeLocationId(locationId) {
  if (!locationId || typeof window === 'undefined') return;
  sessionStorage.setItem(LOCATION_STORAGE_KEY, locationId);
}

export function clearIframeLocationId() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(LOCATION_STORAGE_KEY);
}

export function getIframeSsoEmail() {
  if (typeof window === 'undefined') return null;
  const fromUrl = new URLSearchParams(window.location.search).get('email');
  if (fromUrl && fromUrl.trim()) {
    const normalized = fromUrl.trim();
    localStorage.setItem(SSO_EMAIL_STORAGE_KEY, normalized);
    return normalized;
  }
  const remembered = localStorage.getItem(SSO_EMAIL_STORAGE_KEY);
  return remembered && remembered.trim() ? remembered.trim() : null;
}

export function setIframeSsoEmail(email) {
  if (typeof window === 'undefined') return;
  const normalized = (email || '').trim();
  if (!normalized) return;
  localStorage.setItem(SSO_EMAIL_STORAGE_KEY, normalized);
}

export function clearIframeSsoEmail() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SSO_EMAIL_STORAGE_KEY);
}

/**
 * Resolve email for embed SSO: URL param first, then remembered email when in iframe.
 */
export function resolveIframeSsoEmail({ urlEmail, allowRemembered = true } = {}) {
  const fromUrl = (urlEmail || '').trim();
  if (fromUrl) return fromUrl;
  if (!allowRemembered) return null;
  if (!isInIframe()) return null;
  return getIframeSsoEmail();
}

/**
 * Append location_id and email (when known) so in-app navigation keeps embed SSO context.
 * Pass `includeEmail: false` (e.g. after logout) to avoid re-attaching the previous user.
 */
export function appendIframeContextToPath(
  path,
  {
    locationId = getIframeLocationId(),
    email = null,
    includeEmail = true,
  } = {},
) {
  const [pathname, search = ''] = String(path || '').split('?');
  const params = new URLSearchParams(search);

  if (locationId) {
    params.set('location_id', locationId);
  }

  if (includeEmail) {
    const resolvedEmail =
      (email && String(email).trim()) ||
      params.get('email') ||
      (typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('email')
        : null) ||
      (typeof window !== 'undefined' ? localStorage.getItem(SSO_EMAIL_STORAGE_KEY) : null);

    if (resolvedEmail && String(resolvedEmail).trim()) {
      params.set('email', String(resolvedEmail).trim());
    }
  } else {
    params.delete('email');
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/** @deprecated Prefer appendIframeContextToPath — kept for callers that only need location. */
export function appendLocationIdToPath(path, locationId = getIframeLocationId()) {
  return appendIframeContextToPath(path, { locationId, email: null });
}

export function withLocationIdParams(params = {}) {
  const locationId = getIframeLocationId();
  if (!locationId) return params;
  return { ...params, location_id: locationId };
}

export function withLocationIdHeaders(headers = {}) {
  const locationId = getIframeLocationId();
  if (!locationId) return headers;
  return { ...headers, 'X-Location-Id': locationId };
}
