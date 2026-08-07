import { appendIframeContextToPath, getIframeLocationId } from './iframeContext';

/**
 * Default route after admin login (when no returnTo is stored).
 */
export function getPostLoginRedirectPath({ userRole, locationId } = {}) {
  const loc = locationId || getIframeLocationId();
  const role = String(userRole || 'worker').toLowerCase();

  if (role === 'admin' || role === 'manager') {
    return appendIframeContextToPath('/admin/dashboard', { locationId: loc });
  }

  return appendIframeContextToPath('/admin/jobs', { locationId: loc });
}

export function resolvePostLoginNavigation({ userRole, locationId, returnTo }) {
  if (returnTo) {
    return appendIframeContextToPath(returnTo, {
      locationId: locationId || getIframeLocationId(),
    });
  }
  return getPostLoginRedirectPath({ userRole, locationId });
}
