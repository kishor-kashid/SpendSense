import React, { useEffect, useState } from 'react';
import RecommendationCard from './RecommendationCard';
import TransactionList from './TransactionList';
import SpendingBreakdown from './SpendingBreakdown';
import SpendingInsights from './SpendingInsights';
import Loading from '../common/Loading';
import Card from '../common/Card';
import { useAuth } from '../../context/AuthContext';
import { useConsent } from '../../hooks/useConsent';
import { useRecommendations } from '../../hooks/useRecommendations';
import { useUser } from '../../context/UserContext';
import { getTransactions, getSpendingInsights } from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { userId } = useAuth();
  const { profile, refreshProfile } = useUser();
  const { consentStatus, hasConsent, grant, revoke, loadConsent } = useConsent(userId);
  const { recommendations, loadRecommendations, loading: recommendationsLoading } = useRecommendations(userId);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  
  // Transactions and insights state
  const [transactions, setTransactions] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, transactions, insights

  useEffect(() => {
    if (userId) {
      loadConsent();
    }
  }, [userId, loadConsent]);

  // Load recommendations when consent is granted and user is available
  useEffect(() => {
    if (hasConsent && userId) {
      // Small delay to ensure profile is loaded first
      const timer = setTimeout(() => {
        loadRecommendations().catch(console.error);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hasConsent, userId, loadRecommendations]);

  // Load transactions and insights regardless of consent (users can always see their own data)
  useEffect(() => {
    if (userId) {
      loadTransactionsAndInsights();
    }
  }, [userId]);

  const loadTransactionsAndInsights = async () => {
    if (!userId) return;

    setLoadingTransactions(true);
    setLoadingInsights(true);

    try {
      const [transactionsData, insightsData] = await Promise.all([
        getTransactions(userId, { includePending: false }),
        getSpendingInsights(userId, {})
      ]);

      // Handle API response structure
      const transactionsArray = transactionsData.transactions || transactionsData.data?.transactions || transactionsData.data || [];
      const insightsObj = insightsData.insights || insightsData.data?.insights || insightsData.data || insightsData;

      setTransactions(transactionsArray);
      setInsights(insightsObj);
    } catch (error) {
      console.error('Error loading transactions/insights:', error);
      // Don't set error state - just log it
    } finally {
      setLoadingTransactions(false);
      setLoadingInsights(false);
    }
  };

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
        } catch (error) {
          console.error('Error refreshing data:', error);
        } finally {
          setLoadingRecommendations(false);
        }
      }
    };

    window.addEventListener('dashboard-refresh', handleRefreshEvent);
    return () => {
      window.removeEventListener('dashboard-refresh', handleRefreshEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, hasConsent, refreshProfile, loadRecommendations]);

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
          className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
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
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <SpendingInsights insights={insights} loading={loadingInsights} />
          <SpendingBreakdown insights={insights} loading={loadingInsights} />
        </>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <TransactionList transactions={transactions} loading={loadingTransactions} />
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <>
          <SpendingInsights insights={insights} loading={loadingInsights} />
          <SpendingBreakdown insights={insights} loading={loadingInsights} />
        </>
      )}

      {/* Recommendations Section - Only shown when consent is granted */}
      {hasConsent && (
        <div className="recommendations-section">
          <div className="recommendations-header">
            <h2 className="section-title">Personalized Recommendations</h2>
            {recommendations?.status === 'approved' && (
              <span className="recommendations-status-badge approved">
                ✓ Approved
              </span>
            )}
          </div>
        
        {recommendationsLoading && (
          <Loading message="Loading recommendations..." />
        )}

        {!recommendationsLoading && recommendations && (
          <>
            {/* Show pending message if recommendations are pending approval */}
            {recommendations.status === 'pending' && (
              <Card className="recommendations-pending-card">
                <div className="recommendations-pending-content">
                  <div className="recommendations-pending-icon">⏳</div>
                  <h3>Recommendations Pending Approval</h3>
                  <p>
                    {recommendations.pending_message || 
                     'Your personalized recommendations are currently being reviewed by our team. ' +
                     'You will be able to view them once they are approved. Please check back later.'}
                  </p>
                </div>
              </Card>
            )}

            {/* Only show recommendations if they are approved and have content */}
            {recommendations.status === 'approved' && (
              <>
                {recommendations.education_items && recommendations.education_items.length > 0 && (
                  <div className="recommendations-group">
                    <h3 className="recommendations-group-title">📚 Educational Resources</h3>
                    <div className="recommendations-list">
                      {recommendations.education_items.map((item, index) => (
                        <RecommendationCard 
                          key={index} 
                          recommendation={item} 
                          type="education"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {recommendations.partner_offers && recommendations.partner_offers.length > 0 && (
                  <div className="recommendations-group">
                    <h3 className="recommendations-group-title">💳 Partner Offers</h3>
                    <div className="recommendations-list">
                      {recommendations.partner_offers.map((offer, index) => (
                        <RecommendationCard 
                          key={index} 
                          recommendation={offer} 
                          type="offer"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {(!recommendations.education_items || recommendations.education_items.length === 0) &&
                 (!recommendations.partner_offers || recommendations.partner_offers.length === 0) && (
                  <Card>
                    <p>No recommendations available at this time.</p>
                  </Card>
                )}
              </>
            )}

            {/* Show message if no status and no recommendations */}
            {recommendations.status !== 'pending' && recommendations.status !== 'approved' &&
             (!recommendations.education_items || recommendations.education_items.length === 0) &&
             (!recommendations.partner_offers || recommendations.partner_offers.length === 0) && (
              <Card>
                <p>No recommendations available at this time.</p>
              </Card>
            )}
          </>
        )}

        {!recommendationsLoading && !recommendations && (
          <Card>
            <p>No recommendations available. Please check back later.</p>
          </Card>
        )}
        </div>
      )}

      {/* Show message when consent is revoked */}
      {!hasConsent && (
        <Card className="no-consent-message">
          <p>
            <strong>Consent Required for Personalized Features</strong><br />
            Enable data processing consent above to view your behavioral profile and receive personalized recommendations.
            You can still view your transactions and spending insights without consent.
          </p>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;

