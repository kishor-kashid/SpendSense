import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(() => {
    return localStorage.getItem('spendsense_role') || null;
  });
  
  const [userId, setUserId] = useState(() => {
    const stored = localStorage.getItem('spendsense_user_id');
    return stored ? parseInt(stored, 10) : null;
  });

  useEffect(() => {
    if (role) {
      localStorage.setItem('spendsense_role', role);
    } else {
      localStorage.removeItem('spendsense_role');
    }
  }, [role]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem('spendsense_user_id', userId.toString());
    } else {
      localStorage.removeItem('spendsense_user_id');
    }
  }, [userId]);

  const login = (selectedRole, selectedUserId = null, userData = null) => {
    setRole(selectedRole);
    if (selectedUserId) {
      setUserId(selectedUserId);
    }
    // Store additional user data if provided
    if (userData) {
      localStorage.setItem('spendsense_user_data', JSON.stringify(userData));
    }
  };

  const logout = () => {
    setRole(null);
    setUserId(null);
    localStorage.removeItem('spendsense_role');
    localStorage.removeItem('spendsense_user_id');
    localStorage.removeItem('spendsense_user_data');
  };

  const isAuthenticated = () => {
    return role !== null;
  };

  const isCustomer = () => {
    return role === 'customer';
  };

  const isOperator = () => {
    return role === 'operator';
  };

  const value = {
    role,
    userId,
    login,
    logout,
    isAuthenticated,
    isCustomer,
    isOperator,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

