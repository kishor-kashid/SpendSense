import React, { useEffect, useState, useCallback } from 'react';
import TransactionList from './TransactionList';
import SpendingBreakdown from './SpendingBreakdown';
import SpendingInsights from './SpendingInsights';
import AIFeaturesTab from './AIFeaturesTab';
import RecommendationsSection from './RecommendationsSection';
import CurrentBalance from './CurrentBalance';
import CreditCards from './CreditCards';
import Loading from '../common/Loading';
import Card from '../common/Card';
import { useAuth } from '../../context/AuthContext';
import { useConsent } from '../../hooks/useConsent';
import { useAIConsent } from '../../hooks/useAIConsent';
import { useRecommendations } from '../../hooks/useRecommendations';
import { useUser } from '../../context/UserContext';
import { getTransactions, getSpendingInsights, getAccounts } from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { userId } = useAuth();
  const { profile, refreshProfile } = useUser();
  const { consentStatus, hasConsent, grant, revoke, loadConsent } = useConsent(userId);
  const { hasAIConsent, loadAIConsent } = useAIConsent(userId);
  const { loadRecommendations, clearRecommendations } = useRecommendations(userId);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  
  // Transactions and insights state
  const [transactions, setTransactions] = useState([]);
  const [insights, setInsights] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [activeTab, setActiveTab] = useState('insights'); // transactions, insights, recommendations, ai-features
  const [insightsFilter, setInsightsFilter] = useState('30'); // '30', '180', 'all'

  useEffect(() => {
    if (userId) {
      loadConsent();
      loadAIConsent();
    }
  }, [userId, loadConsent, loadAIConsent]);

  // Listen for consent changes from Navigation component
  useEffect(() => {
    const handleConsentChange = async () => {
      // Reload consent status when it changes
      const newStatus = await loadConsent();
      // Also refresh profile and recommendations if consent was granted
      if (newStatus === 'granted') {
        await refreshProfile();
        await loadRecommendations();
      }
    };

    const handleAIConsentChange = async () => {
      // Reload AI consent status when it changes
      await loadAIConsent();
      // When AI consent changes, refresh the AI Features tab if it's active
      if (activeTab === 'ai-features') {
        window.dispatchEvent(new CustomEvent('dashboard-refresh'));
      }
    };

    window.addEventListener('consent-changed', handleConsentChange);
    window.addEventListener('ai-consent-changed', handleAIConsentChange);
    return () => {
      window.removeEventListener('consent-changed', handleConsentChange);
      window.removeEventListener('ai-consent-changed', handleAIConsentChange);
    };
  }, [userId, loadConsent, loadAIConsent, refreshProfile, loadRecommendations, activeTab]);


  const loadTransactionsAndInsights = useCallback(async () => {
    if (!userId) return;

    setLoadingTransactions(true);
    setLoadingInsights(true);

    try {
      // Calculate date range based on filter
      const endDate = new Date().toISOString().split('T')[0];
      let startDate = null;
      
      if (insightsFilter === '30') {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        startDate = date.toISOString().split('T')[0];
      } else if (insightsFilter === '180') {
        const date = new Date();
        date.setDate(date.getDate() - 180);
        startDate = date.toISOString().split('T')[0];
      }
      // For 'all', don't set startDate - API will use all available data

      const insightsParams = startDate ? { startDate, endDate } : { endDate };

      const [transactionsData, insightsData] = await Promise.all([
        getTransactions(userId, { includePending: false }),
        getSpendingInsights(userId, insightsParams)
      ]);

      // Handle API response structure
      const transactionsArray = transactionsData.transactions || transactionsData.data?.transactions || transactionsData.data || [];
      const insightsObj = insightsData.insights || insightsData.data?.insights || insightsData.data || insightsData;

      setTransactions(transactionsArray);
      setInsights(insightsObj);
    } catch (error) {
      // Silently handle errors - don't set error state
    } finally {
      setLoadingTransactions(false);
      setLoadingInsights(false);
    }
  }, [userId, insightsFilter]);

  // Load accounts
  const loadAccounts = useCallback(async () => {
    if (!userId) return;

    setLoadingAccounts(true);
    try {
      const accountsData = await getAccounts(userId);
      // API returns: { success: true, accounts: {...}, total_balance: {...}, credit_cards: {...} }
      // We need to pass the entire response structure (minus success) to components
      const accountsObj = accountsData.success 
        ? {
            accounts: accountsData.accounts,
            total_balance: accountsData.total_balance,
            credit_cards: accountsData.credit_cards
          }
        : accountsData.accounts || accountsData.data || accountsData;
      setAccounts(accountsObj);
    } catch (error) {
      console.error('Error loading accounts:', error);
      // Silently handle errors
    } finally {
      setLoadingAccounts(false);
    }
  }, [userId]);

  // Load transactions and insights regardless of consent (users can always see their own data)
  useEffect(() => {
    if (userId) {
      loadTransactionsAndInsights();
      loadAccounts();
    }
  }, [userId, loadTransactionsAndInsights, loadAccounts]);


  // Listen for refresh events from navbar
  useEffect(() => {
    const handleRefreshEvent = async () => {
      if (userId) {
        setLoadingRecommendations(true);
        try {
          if (hasConsent) {
            await refreshProfile();
            await loadRecommendations();
          }
          await loadTransactionsAndInsights();
          await loadAccounts();
        } catch (error) {
          // Silently handle errors
        } finally {
          setLoadingRecommendations(false);
        }
      }
    };

    window.addEventListener('dashboard-refresh', handleRefreshEvent);
    return () => {
      window.removeEventListener('dashboard-refresh', handleRefreshEvent);
    };
  }, [userId, hasConsent, refreshProfile, loadRecommendations, loadTransactionsAndInsights, loadAccounts]);

  if (!userId) {
    return (
      <div className="dashboard-container">
        <Card>
          <p>Please select a user to view your dashboard.</p>
        </Card>
      </div>
    );
  }

  if (consentStatus === null) {
    return (
      <div className="dashboard-container">
        <Loading message="Loading consent status..." />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Tabs for different views */}
      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          Insights
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('recommendations');
            // Trigger refresh when switching to recommendations tab
            if (hasConsent) {
              window.dispatchEvent(new CustomEvent('recommendations-tab-active'));
            }
          }}
        >
          Recommendations
        </button>
        {/* AI Features tab - always show, but may show consent message */}
        <button
          className={`dashboard-tab ${activeTab === 'ai-features' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai-features')}
        >
          AI Features
        </button>
      </div>

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <>
          <CurrentBalance accounts={accounts} loading={loadingAccounts} />
          <CreditCards accounts={accounts} loading={loadingAccounts} />
          <TransactionList transactions={transactions} loading={loadingTransactions} />
        </>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <>
          <div className="insights-filters">
            <div className="insights-filter-label">Time Period:</div>
            <div className="insights-filter-buttons">
              <button
                className={`insights-filter-btn ${insightsFilter === '30' ? 'active' : ''}`}
                onClick={() => setInsightsFilter('30')}
              >
                30 Days
              </button>
              <button
                className={`insights-filter-btn ${insightsFilter === '180' ? 'active' : ''}`}
                onClick={() => setInsightsFilter('180')}
              >
                180 Days
              </button>
              <button
                className={`insights-filter-btn ${insightsFilter === 'all' ? 'active' : ''}`}
                onClick={() => setInsightsFilter('all')}
              >
                All Time
              </button>
            </div>
          </div>
          <SpendingInsights insights={insights} loading={loadingInsights} insightsFilter={insightsFilter} />
          <SpendingBreakdown insights={insights} loading={loadingInsights} />
        </>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <RecommendationsSection key={userId} />
      )}

      {/* AI Features Tab - Only requires AI consent */}
      {activeTab === 'ai-features' && (
        <AIFeaturesTab />
      )}
    </div>
  );
};

export default Dashboard;

