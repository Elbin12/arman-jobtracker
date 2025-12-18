// src/components/routes/RoleProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const user = useSelector((state) => state.auth.user);
  const role = user?.role || 'worker';

  if (!allowedRoles.includes(role)) {
    // Redirect workers trying to access admin-only pages to their jobs page
    if (role === 'worker') {
      return <Navigate to="/admin/jobs" replace />;
    }
    return <Navigate to="/admin/unauthorized" replace />;
  }

  return children;
};

export default RoleProtectedRoute;
