// src/components/routes/AdminProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { appendIframeContextToPath } from '../utils/iframeContext';

const AdminProtectedRoute = ({ children }) => {
  const accessToken = localStorage.getItem('access');
  const location = useLocation();

  if (!accessToken) {
    // Store current location before redirecting to login (for automatic logout scenarios)
    // Only store if not already on login page and returnTo doesn't already exist
    if (!location.pathname.includes('/admin/login')) {
      const currentPath = appendIframeContextToPath(
        location.pathname + location.search,
      );
      const existingReturnTo = localStorage.getItem('returnTo');

      // Only store if there's no existing returnTo (to preserve the original page before multiple redirects)
      if (!existingReturnTo) {
        localStorage.setItem('returnTo', currentPath);
        console.log('Stored returnTo in AdminProtectedRoute (auto-logout):', currentPath);
      }
    }

    const loginPath = appendIframeContextToPath(
      `/admin/login${location.search || ''}`,
    );

    return <Navigate to={loginPath} replace />;
  }

  return children;
};

export default AdminProtectedRoute;
