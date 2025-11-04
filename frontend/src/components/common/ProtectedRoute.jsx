import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ 
  children, 
  requireRole = null, // 'customer' or 'operator' or null for any authenticated user
}) => {
  const { isAuthenticated, isCustomer, isOperator } = useAuth();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole === 'customer' && !isCustomer()) {
    return <Navigate to="/operator" replace />;
  }

  if (requireRole === 'operator' && !isOperator()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;

