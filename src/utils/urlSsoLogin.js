/** Helpers for GHL iframe SSO from URL query params (email + location_id). */

export function normalizeLoginEmail(value) {
  return (value || '').trim().toLowerCase();
}

export function getUserLoginEmail(user) {
  if (!user) return '';
  return normalizeLoginEmail(user.email || user.username);
}

export function emailsMatch(user, urlEmail) {
  const target = normalizeLoginEmail(urlEmail);
  if (!target) return false;
  return getUserLoginEmail(user) === target;
}

export function friendlySsoErrorMessage(detail, urlEmail) {
  const d = String(detail || '').toLowerCase();
  const who = urlEmail ? ` (${urlEmail})` : '';

  if (d.includes('no user found') || d.includes('invalid credentials')) {
    return `No application account exists for this user${who}. Ask an admin to add them in Team management for this subaccount.`;
  }
  if (d.includes('cannot access this location') || d.includes('not allowed')) {
    return `This user${who} is not allowed to access this subaccount.`;
  }
  if (d.includes('invalid or expired')) {
    return `Your sign-in link expired${who}. Refresh the page to try again.`;
  }
  if (d.includes('email and location_id are required')) {
    return 'Email and location_id are both required for automatic sign-in.';
  }
  return detail || `Could not sign in${who}.`;
}

/**
 * Human-readable reason the login page is showing instead of auto sign-in.
 * Used for client-device debugging in GHL iframes.
 */
export function getAutoLoginDiagnostic({
  urlEmail,
  resolvedEmail,
  locationId,
  ssoError,
  usedRememberedEmail,
  hasSsoToken,
  inIframe,
  isAutoLoggingIn = false,
}) {
  const rawUrlEmail = urlEmail == null ? null : String(urlEmail);
  const trimmedUrl = (rawUrlEmail || '').trim();
  const looksUnexpanded =
    trimmedUrl.includes('{{') || trimmedUrl.includes('}}') || trimmedUrl.includes('%7B%7B');

  const lines = [];

  if (trimmedUrl) {
    lines.push(`Email in link: ${trimmedUrl}`);
  } else if (rawUrlEmail !== null && rawUrlEmail === '') {
    lines.push('Email in link: (empty — HighLevel did not fill {{user.email}})');
  } else if (usedRememberedEmail && resolvedEmail) {
    lines.push(`Email in link: (none) — using last session email: ${resolvedEmail}`);
  } else {
    lines.push('Email in link: (missing — no email query param)');
  }

  if (locationId) {
    lines.push(`Location: ${locationId}`);
  } else {
    lines.push('Location: (missing — auto sign-in cannot run)');
  }

  if (looksUnexpanded) {
    lines.push(
      'Why: the menu link email was not replaced by HighLevel (still shows a template). Fix the custom menu merge field.',
    );
  } else if (ssoError) {
    lines.push(`Why: ${friendlySsoErrorMessage(ssoError, resolvedEmail || trimmedUrl)}`);
  } else if (!trimmedUrl && !resolvedEmail && !hasSsoToken) {
    lines.push(
      inIframe
        ? 'Why: automatic sign-in needs an email from the custom menu link. Re-open from the menu, or sign in below.'
        : 'Why: no email was provided for automatic sign-in. Sign in below.',
    );
  } else if (!locationId) {
    lines.push('Why: location_id is missing, so automatic sign-in did not run.');
  } else if (isAutoLoggingIn) {
    lines.push('Why: verifying with the server…');
  } else if (resolvedEmail || hasSsoToken) {
    lines.push('Why: automatic sign-in did not complete. Try refresh, or sign in below.');
  }

  return lines;
}

export function buildSsoAttemptKey({ email, ssoToken, locationId }) {
  return `${normalizeLoginEmail(email) || ssoToken || ''}:${locationId || ''}`;
}

export function sessionMatchesUrl(user, account, email, locationId) {
  if (!email || !user) return false;
  if (!emailsMatch(user, email)) return false;
  if (!locationId) return true;
  const sessionLocation = account?.location_id || '';
  return sessionLocation === locationId;
}
