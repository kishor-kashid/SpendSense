import React, { useState, useEffect } from 'react';
import { analyzeSubscriptions, getSubscriptionSuggestions } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SubscriptionSuggestions from './SubscriptionSuggestions';
import Loading from '../common/Loading';
import Card from '../common/Card';
import './SubscriptionAnalyzer.css';

const SubscriptionAnalyzer = () => {
  const { userId } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('analysis');

  useEffect(() => {
    if (userId) {
      loadAnalysis();
      loadSuggestions();
    }
  }, [userId]);

  const loadAnalysis = async () => {
    if (!userId) return;

    setLoadingAnalysis(true);
    setError(null);

    try {
      const response = await analyzeSubscriptions(userId);
      setAnalysis(response.analysis || response);
    } catch (err) {
      console.error('Error loading subscription analysis:', err);
      setError(err.message || 'Failed to load subscription analysis');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const loadSuggestions = async () => {
    if (!userId) return;

    setLoadingSuggestions(true);
    setError(null);

    try {
      const response = await getSubscriptionSuggestions(userId);
      setSuggestions(response.suggestions || response);
    } catch (err) {
      console.error('Error loading subscription suggestions:', err);
      setError(err.message || 'Failed to load subscription suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="subscription-analyzer">
      <div className="subscription-analyzer-header">
        <h2>AI-Powered Subscription Analysis</h2>
        <p className="subscription-analyzer-subtitle">
          Analyze your subscriptions and get personalized suggestions for optimizing your spending
        </p>
      </div>

      <div className="subscription-analyzer-tabs">
        <button
          className={`subscription-tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          Analysis
        </button>
        <button
          className={`subscription-tab-button ${activeTab === 'suggestions' ? 'active' : ''}`}
          onClick={() => setActiveTab('suggestions')}
        >
          Suggestions
        </button>
      </div>

      {error && (
        <Card className="subscription-error">
          <div className="subscription-error-message">
            <p>{error}</p>
            <button onClick={() => {
              loadAnalysis();
              loadSuggestions();
            }} className="retry-button">
              Retry
            </button>
          </div>
        </Card>
      )}

      {activeTab === 'analysis' && (
        <div className="subscription-analysis-content">
          {loadingAnalysis ? (
            <Loading message="Analyzing subscriptions..." />
          ) : analysis ? (
            <div className="subscription-analysis">
              <Card className="subscription-summary">
                <h3>Subscription Summary</h3>
                <div className="summary-stats">
                  <div className="summary-stat">
                    <span className="stat-label">Total Subscriptions</span>
                    <span className="stat-value">{analysis.summary?.total_subscriptions || 0}</span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-label">Monthly Subscription Spend</span>
                    <span className="stat-value">
                      {formatCurrency(analysis.summary?.total_monthly_recurring_spend || 0)}
                    </span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-label">Share of Income</span>
                    <span className="stat-value">
                      {formatPercentage(analysis.summary?.subscription_share_of_income || 0)}
                    </span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-label">Underutilized</span>
                    <span className="stat-value">{analysis.summary?.underutilized_count || 0}</span>
                  </div>
                </div>
              </Card>

              {analysis.subscriptions && analysis.subscriptions.length > 0 ? (
                <Card className="subscription-list">
                  <h3>Your Subscriptions</h3>
                  <div className="subscription-items">
                    {analysis.subscriptions.map((subscription, index) => (
                      <div key={index} className="subscription-item">
                        <div className="subscription-header">
                          <h4>{subscription.merchant_name}</h4>
                          <span className="subscription-cost">
                            {formatCurrency(subscription.monthlySpend || subscription.monthly_recurring_spend)}
                            <span className="cost-period">/month</span>
                          </span>
                        </div>
                        <div className="subscription-metrics">
                          <div className="metric">
                            <span className="metric-label">Usage Frequency</span>
                            <span className="metric-value">
                              {subscription.usageFrequency?.toFixed(1) || 'N/A'} times/month
                            </span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">Cost per Use</span>
                            <span className="metric-value">
                              {formatCurrency(subscription.costPerUse || 0)}
                            </span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">Transactions (30 days)</span>
                            <span className="metric-value">
                              {subscription.transaction_count || 0}
                            </span>
                          </div>
                          {subscription.daysSinceLastTransaction !== null && (
                            <div className="metric">
                              <span className="metric-label">Last Used</span>
                              <span className="metric-value">
                                {subscription.daysSinceLastTransaction} days ago
                              </span>
                            </div>
                          )}
                          <div className="metric">
                            <span className="metric-label">Value Score</span>
                            <span className="metric-value">
                              {formatPercentage((subscription.valueScore || 1) * 100)}
                            </span>
                          </div>
                          {subscription.isUnderutilized && (
                            <div className="metric warning">
                              <span className="metric-label">Status</span>
                              <span className="metric-value warning-text">Underutilized</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : (
                <Card className="no-subscriptions">
                  <p>No subscriptions found to analyze.</p>
                </Card>
              )}
            </div>
          ) : null}
        </div>
      )}

      {activeTab === 'suggestions' && (
        <SubscriptionSuggestions
          suggestions={suggestions}
          loading={loadingSuggestions}
          onRefresh={loadSuggestions}
        />
      )}
    </div>
  );
};

export default SubscriptionAnalyzer;

