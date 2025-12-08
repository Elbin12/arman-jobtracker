// src/components/routes/RoleProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const role = 'manager';

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/admin/unauthorized" replace />;
  }

  return children;
};

export default RoleProtectedRoute;
