import { useState, useCallback } from 'react';
import { getConsent, grantConsent, revokeConsent } from '../services/api';

export const useConsent = (userId) => {
  const [consentStatus, setConsentStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadConsent = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getConsent(userId);
      console.log('useConsent - getConsent response:', response);
      
      // Backend returns { success: true, consent: { has_consent: true/false, status: 'granted'/'revoked' } }
      // API interceptor returns response.data, so response is already the data object
      const consent = response.consent || response.data?.consent || response;
      const hasConsent = consent.has_consent === true || consent.status === 'granted' || consent.opted_in === 1;
      
      const status = hasConsent ? 'granted' : 'revoked';
      console.log('useConsent - extracted consent status:', status);
      setConsentStatus(status);
      return status;
    } catch (err) {
      console.error('useConsent - Error loading consent:', err);
      setError(err.message);
      // If consent record doesn't exist, treat as not granted
      setConsentStatus('revoked');
      return 'revoked';
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const grant = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await grantConsent(userId);
      console.log('Consent granted successfully:', response);
      setConsentStatus('granted');
      return true;
    } catch (err) {
      console.error('Error granting consent:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const revoke = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      await revokeConsent(userId);
      setConsentStatus('revoked');
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    consentStatus,
    loading,
    error,
    loadConsent,
    grant,
    revoke,
    hasConsent: consentStatus === 'granted',
  };
};

export default useConsent;

