import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearSsoError, ssoAutoLogin } from '../store/slices/authSlice';
import {
  buildSsoAttemptKey,
  sessionMatchesUrl,
} from '../utils/urlSsoLogin';
import {
  getIframeLocationId,
  resolveIframeSsoEmail,
  setIframeLocationId,
  setIframeSsoEmail,
} from '../utils/iframeContext';

/**
 * Watch URL for email / sso_token + location_id and SSO-login or switch users.
 * In an iframe, falls back to the last successful SSO email when the URL omits email.
 *
 * When the URL explicitly includes email (or sso_token) + location_id, always call the
 * backend to verify — do not trust a stale localStorage user/token alone.
 *
 * @param {object} options
 * @param {boolean} [options.enabled=true]
 * @param {(response: object) => void} [options.onSuccess] - e.g. navigate after login page
 */
export function useUrlSsoLogin({ enabled = true, onSuccess } = {}) {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const user = useSelector((state) => state.auth.user);
  const account = useSelector((state) => state.auth.account);
  const access = useSelector((state) => state.auth.access);
  const loading = useSelector((state) => state.auth.loading);
  const ssoError = useSelector((state) => state.auth.ssoError);
  const switching = useSelector((state) => state.auth.ssoSwitching);

  const urlEmail = searchParams.get('email');
  const ssoToken = searchParams.get('sso_token');
  const email = resolveIframeSsoEmail({ urlEmail });
  const locationId = searchParams.get('location_id') || getIframeLocationId();
  const usedRememberedEmail = Boolean(email && !urlEmail && !ssoToken);
  const hasExplicitUrlSso = Boolean((urlEmail && String(urlEmail).trim()) || ssoToken);

  const lastAttemptKey = useRef(null);
  const activeAttemptKey = useRef(null);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (locationId) {
      setIframeLocationId(locationId);
    }
  }, [locationId]);

  useEffect(() => {
    if (urlEmail) {
      setIframeSsoEmail(urlEmail);
    }
  }, [urlEmail]);

  useEffect(() => {
    if (!enabled) return;
    if (!locationId) return;
    if (!email && !ssoToken) return;

    const attemptKey = buildSsoAttemptKey({ email, ssoToken, locationId });

    // Remembered-email only (no email/sso_token in URL): reuse a live matching session.
    // Require access token — stale user without access was skipping SSO and blocking login.
    if (
      !hasExplicitUrlSso &&
      email &&
      user &&
      access &&
      sessionMatchesUrl(user, account, email, locationId)
    ) {
      lastAttemptKey.current = attemptKey;
      if (ssoError) {
        dispatch(clearSsoError());
      }
      return;
    }

    // Already attempted this exact identity+location for this mount (success or failure).
    if (lastAttemptKey.current === attemptKey) {
      return;
    }

    // In-flight for this key.
    if (loading && activeAttemptKey.current === attemptKey) {
      return;
    }

    const hadExistingSession = Boolean(access && (user?.email || user?.username));
    activeAttemptKey.current = attemptKey;

    dispatch(
      ssoAutoLogin({
        email: email || undefined,
        token: ssoToken || undefined,
        location_id: locationId,
        hadExistingSession,
      }),
    )
      .unwrap()
      .then((response) => {
        if (activeAttemptKey.current !== attemptKey) return;
        lastAttemptKey.current = attemptKey;
        onSuccessRef.current?.(response);
      })
      .catch(() => {
        if (activeAttemptKey.current !== attemptKey) return;
        lastAttemptKey.current = attemptKey;
      });
  }, [
    dispatch,
    email,
    ssoToken,
    locationId,
    enabled,
    hasExplicitUrlSso,
    user?.email,
    user?.username,
    account?.location_id,
    access,
    loading,
    ssoError,
  ]);

  return {
    email,
    urlEmail,
    usedRememberedEmail,
    ssoToken,
    locationId,
    switching,
    ssoError,
    loading,
    hasExplicitUrlSso,
  };
}
