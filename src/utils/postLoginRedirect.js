import { appendLocationIdToPath, getIframeLocationId } from './iframeContext';

/**
 * Default route after admin login (when no returnTo is stored).
 */
export function getPostLoginRedirectPath({ userRole, locationId } = {}) {
  const loc = locationId || getIframeLocationId();
  const role = String(userRole || 'worker').toLowerCase();

  if (role === 'admin' || role === 'manager') {
    return appendLocationIdToPath('/admin/dashboard', loc);
  }

  return appendLocationIdToPath('/admin/jobs', loc);
}

export function resolvePostLoginNavigation({ userRole, locationId, returnTo }) {
  if (returnTo) {
    return appendLocationIdToPath(returnTo, locationId || getIframeLocationId());
  }
  return getPostLoginRedirectPath({ userRole, locationId });
}
