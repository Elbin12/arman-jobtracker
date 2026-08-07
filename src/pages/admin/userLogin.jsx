import React, { useCallback, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Link as MuiLink,
  Alert,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { loginUser, clearSuccess } from '../../store/slices/authSlice';
import { useUrlSsoLogin } from '../../hooks/useUrlSsoLogin';
import { getAutoLoginDiagnostic } from '../../utils/urlSsoLogin';
import {
  getIframeLocationId,
  isInIframe,
  resolveIframeSsoEmail,
} from '../../utils/iframeContext';
import { getPostLoginRedirectPath, resolvePostLoginNavigation } from '../../utils/postLoginRedirect';

const UserLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user, access } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const hasEmailParam = searchParams.has('email');
  const urlEmail = hasEmailParam ? (searchParams.get('email') ?? '') : null;
  const email = resolveIframeSsoEmail({ urlEmail });
  const locationId = searchParams.get('location_id') || getIframeLocationId();
  const inIframe = isInIframe();
  const hasSsoToken = Boolean(searchParams.get('sso_token'));
  const canAutoSso = Boolean((email || hasSsoToken) && locationId);

  const finishLoginNavigation = useCallback(
    (response) => {
      const returnTo = localStorage.getItem('returnTo');
      if (returnTo) {
        localStorage.removeItem('returnTo');
      }
      dispatch(clearSuccess());
      navigate(
        resolvePostLoginNavigation({
          userRole: response?.user?.role || user?.role,
          locationId,
          returnTo,
        }),
        { replace: true },
      );
    },
    [dispatch, navigate, locationId, user?.role],
  );

  const { ssoError, loading: ssoLoading, usedRememberedEmail, hasExplicitUrlSso } =
    useUrlSsoLogin({
      enabled: canAutoSso,
      onSuccess: finishLoginNavigation,
    });

  // Already authenticated: leave login (including when returnTo is set).
  // When URL has email/sso_token + location_id, SSO must verify with the backend first —
  // do not trust a stale localStorage user/token and skip verification.
  useEffect(() => {
    if (!access || !user) return;
    if (canAutoSso && hasExplicitUrlSso) return;

    const returnTo = localStorage.getItem('returnTo');
    if (returnTo) {
      localStorage.removeItem('returnTo');
      navigate(
        resolvePostLoginNavigation({
          userRole: user.role,
          locationId,
          returnTo,
        }),
        { replace: true },
      );
      return;
    }

    navigate(
      getPostLoginRedirectPath({ userRole: user.role, locationId }),
      { replace: true },
    );
  }, [access, user, navigate, locationId, canAutoSso, hasExplicitUrlSso]);

  const diagnosticLines = getAutoLoginDiagnostic({
    urlEmail,
    resolvedEmail: email,
    locationId,
    ssoError,
    usedRememberedEmail,
    hasSsoToken,
    inIframe,
    isAutoLoggingIn: Boolean(
      canAutoSso && (ssoLoading || loading) && !ssoError,
    ),
  });

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
    },
    validationSchema: Yup.object({
      username: Yup.string().required('username is required'),
      password: Yup.string().required('Password is required'),
    }),
    onSubmit: async (values) => {
      try {
        const returnTo = localStorage.getItem('returnTo');
        if (returnTo) {
          localStorage.removeItem('returnTo');
        }

        const response = await dispatch(
          loginUser({
            ...values,
            location_id: locationId || getIframeLocationId(),
          }),
        ).unwrap();

        dispatch(clearSuccess());
        navigate(
          resolvePostLoginNavigation({
            userRole: response?.user?.role,
            locationId,
            returnTo,
          }),
          { replace: true },
        );
      } catch {
        // Error is handled by Redux state
      }
    },
  });

  const isAutoLoggingIn =
    (ssoLoading || loading) && (email || searchParams.get('sso_token'));

  if (isAutoLoggingIn && !ssoError) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#f4f5f7',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <CircularProgress size={32} />
        <Typography color="text.secondary">
          Signing in{email ? ` as ${email}` : ''}…
        </Typography>
      </Box>
    );
  }

  const diagnosticSeverity = ssoError ? 'warning' : 'info';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#f5f5f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        px: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: '100%',
          p: 3,
          boxShadow: 4,
          borderRadius: 3,
        }}
      >
        <CardContent>
          <Box mb={3} textAlign="center">
            <Typography variant="h5" fontWeight="bold">
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your account
            </Typography>
          </Box>

          {/* Always show on iframe / when SSO failed or email was attempted — helps client-device debugging */}
          {(inIframe || ssoError || hasEmailParam || usedRememberedEmail) && (
            <Alert severity={diagnosticSeverity} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>
                Automatic sign-in details
              </Typography>
              {diagnosticLines.map((line) => (
                <Typography key={line} variant="body2" component="div" sx={{ mb: 0.25 }}>
                  {line}
                </Typography>
              ))}
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit} noValidate>
            <Box mb={2}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                type="username"
                variant="outlined"
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.username && Boolean(formik.errors.username)}
                helperText={formik.touched.username && formik.errors.username}
              />
            </Box>

            <Box mb={2}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                variant="outlined"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
              />
            </Box>

            {error && !ssoError && (
              <Typography variant="body2" color="error" mb={2}>
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ py: 1.5, fontWeight: 'bold', mb: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
            </Button>

            <Typography variant="body2" align="center" color="text.secondary">
              Don&apos;t have an account?{' '}
              <MuiLink component={Link} to="/signup" color="primary">
                Sign up
              </MuiLink>
            </Typography>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserLogin;
