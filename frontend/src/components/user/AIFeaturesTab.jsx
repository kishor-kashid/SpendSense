import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Loading from '../common/Loading';
import { getAllPredictions } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useAIConsent } from '../../hooks/useAIConsent';
import PredictiveInsights from './PredictiveInsights';
import BudgetGenerator from './BudgetGenerator';
import SubscriptionAnalyzer from './SubscriptionAnalyzer';
import './AIFeaturesTab.css';

const AIFeaturesTab = () => {
  const { userId } = useAuth();
  const { hasAIConsent: hasAIFeaturesConsent, loadAIConsent, loading: loadingConsent } = useAIConsent(userId);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load AI consent when component mounts
  useEffect(() => {
    if (userId) {
      loadAIConsent();
    }
  }, [userId, loadAIConsent]);

  // Listen for AI consent changes
  useEffect(() => {
    const handleAIConsentChange = async () => {
      await loadAIConsent();
    };

    window.addEventListener('ai-consent-changed', handleAIConsentChange);
    window.addEventListener('dashboard-refresh', handleAIConsentChange);
    return () => {
      window.removeEventListener('ai-consent-changed', handleAIConsentChange);
      window.removeEventListener('dashboard-refresh', handleAIConsentChange);
    };
  }, [loadAIConsent]);

  const loadPredictions = React.useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getAllPredictions(userId);
      // Handle both response structures: { success: true, predictions: {...} } or direct predictions
      const predictionsData = response.predictions || response;
      setPredictions(predictionsData);
    } catch (err) {
      console.error('Error loading predictions:', err);
      setError(err.message || 'Failed to load predictions');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load predictions when AI consent is granted
  useEffect(() => {
    if (hasAIFeaturesConsent && userId) {
      loadPredictions();
    }
  }, [hasAIFeaturesConsent, userId, loadPredictions]);

  // Show loading state while checking consent
  if (loadingConsent) {
    return <Loading message="Checking AI consent status..." />;
  }

  if (!hasAIFeaturesConsent) {
    return (
      <Card className="ai-features-consent-required">
        <div className="ai-features-consent-message">
          <h3>AI Features Require Consent</h3>
          <p>
            To use AI-powered features, please grant AI Features Consent.
          </p>
          <p>
            You can manage your consent settings in the navigation menu.
          </p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return <Loading message="Loading AI predictions..." />;
  }

  if (error) {
    return (
      <Card className="ai-features-error">
        <div className="ai-features-error-message">
          <h3>Unable to Load Predictions</h3>
          <p>{error}</p>
          <button onClick={loadPredictions} className="retry-button">
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="ai-features-tab">
      <div className="ai-features-header">
        <h2>AI-Powered Financial Insights</h2>
        <p className="ai-features-subtitle">
          Get personalized predictions and insights powered by AI
        </p>
      </div>

      <div className="ai-features-sections">
        <section className="ai-features-section">
          <PredictiveInsights predictions={predictions} onRefresh={loadPredictions} />
        </section>

        <section className="ai-features-section">
          <BudgetGenerator />
        </section>

        <section className="ai-features-section">
          <SubscriptionAnalyzer />
        </section>
      </div>
    </div>
  );
};

export default AIFeaturesTab;

