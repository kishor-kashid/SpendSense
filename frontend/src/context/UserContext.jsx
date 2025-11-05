import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUser, getProfile } from '../services/api';

export const UserContext = createContext(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const { userId } = useAuth();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      loadUserData();
    } else {
      setUser(null);
      setProfile(null);
    }
  }, [userId]);

  const loadUserData = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // Load user data (doesn't require consent)
      const userData = await getUser(userId);
      const user = userData.user || userData.data?.user || userData.data || userData;
      setUser(user);

      // Try to load profile (requires consent - 403 is expected if no consent)
      // Don't treat 403 as an error since it's expected when consent isn't granted
      try {
        const profileData = await getProfile(userId);
        const profile = profileData?.profile || profileData?.data?.profile || profileData?.data || profileData;
        setProfile(profile);
      } catch (profileErr) {
        // 403 Forbidden is expected when consent is not granted
        // Set profile to null if consent not granted (this is expected, not an error)
        setProfile(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!userId) return;

    try {
      const profileData = await getProfile(userId);
      // API interceptor returns response.data, so response is already the data object
      const profile = profileData?.profile || profileData?.data?.profile || profileData?.data || profileData;
      setProfile(profile);
    } catch (err) {
      // 403 Forbidden is expected when consent is not granted
      // Set profile to null if consent not granted
      setProfile(null);
    }
  };

  const value = {
    user,
    profile,
    loading,
    error,
    refreshProfile,
    loadUserData,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

