import { useState, useCallback } from 'react';
import { getAIConsent, grantAIConsent, revokeAIConsent } from '../services/api';

export const useAIConsent = (userId) => {
  const [consentStatus, setConsentStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAIConsent = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getAIConsent(userId);
      
      // Backend returns { success: true, ai_consent: { has_consent: true/false, status: 'granted'/'revoked' } }
      // API interceptor returns response.data, so response is already the data object
      const aiConsent = response.ai_consent || response.data?.ai_consent || response;
      const hasConsent = aiConsent.has_consent === true || aiConsent.status === 'granted' || aiConsent.opted_in === 1;
      
      const status = hasConsent ? 'granted' : 'revoked';
      setConsentStatus(status);
      return status;
    } catch (err) {
      setError(err.message);
      // If AI consent record doesn't exist, treat as not granted
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
      await grantAIConsent(userId);
      setConsentStatus('granted');
      return true;
    } catch (err) {
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
      await revokeAIConsent(userId);
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
    loadAIConsent,
    grant,
    revoke,
    hasAIConsent: consentStatus === 'granted',
  };
};

export default useAIConsent;

