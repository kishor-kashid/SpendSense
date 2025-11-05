import React, { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import RecommendationCard from './RecommendationCard';
import TransactionList from './TransactionList';
import SpendingBreakdown from './SpendingBreakdown';
import SpendingInsights from './SpendingInsights';
import CreditCards from './CreditCards';
import BehavioralSignals from './BehavioralSignals';
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
  const { recommendations, loadRecommendations, clearRecommendations, loading: recommendationsLoading } = useRecommendations(userId);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  
  // Transactions and insights state
  const [transactions, setTransactions] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, transactions, insights

  // Refs for scrollable recommendation lists
  const educationListRef = useRef(null);
  const offersListRef = useRef(null);

  // State for scroll button visibility
  const [educationScrollState, setEducationScrollState] = useState({ canScrollLeft: false, canScrollRight: false });
  const [offersScrollState, setOffersScrollState] = useState({ canScrollLeft: false, canScrollRight: false });

  useEffect(() => {
    if (userId) {
      loadConsent();
    }
  }, [userId, loadConsent]);

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

    window.addEventListener('consent-changed', handleConsentChange);
    return () => {
      window.removeEventListener('consent-changed', handleConsentChange);
    };
  }, [userId, loadConsent, refreshProfile, loadRecommendations]);

  // Load recommendations when consent is granted and user is available
  useEffect(() => {
    if (hasConsent && userId) {
      // Small delay to ensure profile is loaded first
      const timer = setTimeout(() => {
        loadRecommendations().catch(err => {
          console.error('Error loading recommendations after consent:', err);
        });
      }, 100);
      return () => clearTimeout(timer);
    } else if (!hasConsent && userId) {
      // Clear recommendations when consent is revoked
      clearRecommendations();
      setLoadingRecommendations(false);
    }
  }, [hasConsent, userId, loadRecommendations, clearRecommendations]);

  const loadTransactionsAndInsights = useCallback(async () => {
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
  }, [userId]);

  // Load transactions and insights regardless of consent (users can always see their own data)
  useEffect(() => {
    if (userId) {
      loadTransactionsAndInsights();
    }
  }, [userId, loadTransactionsAndInsights]);

  // Memoize recommendations data to prevent unnecessary re-renders
  const memoizedEducationItems = useMemo(() => {
    if (!recommendations?.education_items) return [];
    return recommendations.education_items;
  }, [recommendations?.education_items]);

  const memoizedPartnerOffers = useMemo(() => {
    if (!recommendations?.partner_offers) return [];
    // Filter out ineligible offers
    return recommendations.partner_offers.filter(offer => {
      const eligibility = offer.eligibility || offer.eligibility_check;
      return !eligibility || eligibility.eligible === true || eligibility.isEligible === true;
    });
  }, [recommendations?.partner_offers]);

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
  }, [userId, hasConsent, refreshProfile, loadRecommendations, loadTransactionsAndInsights]);

  // Check scroll position for button states
  const checkScrollPosition = useCallback((ref, setScrollState) => {
    if (ref.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      setScrollState({
        canScrollLeft: scrollLeft > 0,
        canScrollRight: scrollLeft + clientWidth < scrollWidth - 1 // -1 for floating point precision
      });
    }
  }, []);

  // Scroll function for navigation buttons
  const scrollList = useCallback((ref, direction) => {
    if (ref.current) {
      const cardWidth = 350; // Fixed card width
      const gap = 16; // var(--spacing-lg) is typically 16px
      const scrollAmount = cardWidth + gap; // Scroll exactly one card + gap
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }, []);

  // Update scroll button states
  useEffect(() => {
    const updateScrollStates = () => {
      checkScrollPosition(educationListRef, setEducationScrollState);
      checkScrollPosition(offersListRef, setOffersScrollState);
    };

    // Initial check
    updateScrollStates();

    // Set up scroll listeners
    const educationElement = educationListRef.current;
    const offersElement = offersListRef.current;

    if (educationElement) {
      educationElement.addEventListener('scroll', updateScrollStates);
    }
    if (offersElement) {
      offersElement.addEventListener('scroll', updateScrollStates);
    }

    // Also check when recommendations change
    if (recommendations) {
      // Small delay to allow DOM to update
      setTimeout(updateScrollStates, 100);
    }

    // Check on window resize
    window.addEventListener('resize', updateScrollStates);

    return () => {
      if (educationElement) {
        educationElement.removeEventListener('scroll', updateScrollStates);
      }
      if (offersElement) {
        offersElement.removeEventListener('scroll', updateScrollStates);
      }
      window.removeEventListener('resize', updateScrollStates);
    };
  }, [recommendations, checkScrollPosition]);

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
          {hasConsent && (
            <>
              <BehavioralSignals 
                behavioralSignals={profile?.behavioral_signals} 
                loading={profile === null} 
              />
              <CreditCards 
                creditData={profile?.behavioral_signals?.credit} 
                loading={profile === null} 
              />
            </>
          )}
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
                    <div className="recommendations-group-header">
                      <div className="recommendations-group-title-wrapper">
                        <h3 className="recommendations-group-title">📚 Educational Resources</h3>
                        {profile?.assigned_persona?.name && (
                          <p className="recommendations-group-subtitle">
                            <strong>Why this matters:</strong> Based on your <strong>{profile.assigned_persona.name}</strong> profile, these educational resources are tailored to help you achieve your financial goals and improve your financial well-being.
                          </p>
                        )}
                      </div>
                      {recommendations.education_items.length > 1 && (
                        <div className="scroll-nav-buttons">
                          <button
                            className="scroll-nav-btn scroll-nav-btn-left"
                            onClick={() => scrollList(educationListRef, 'left')}
                            disabled={!educationScrollState.canScrollLeft}
                            aria-label="Scroll left"
                          >
                            ←
                          </button>
                          <button
                            className="scroll-nav-btn scroll-nav-btn-right"
                            onClick={() => scrollList(educationListRef, 'right')}
                            disabled={!educationScrollState.canScrollRight}
                            aria-label="Scroll right"
                          >
                            →
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="recommendations-list" ref={educationListRef}>
                      {memoizedEducationItems.map((item, index) => (
                        <RecommendationCard 
                          key={item.item?.id || index} 
                          recommendation={item} 
                          type="education"
                        />
                      ))}
                    </div>
                    <div className="recommendations-disclaimer">
                      <small>
                        <strong>Disclaimer:</strong> This is educational content, not financial advice. Consult a licensed advisor for personalized guidance.
                      </small>
                    </div>
                  </div>
                )}

                {memoizedPartnerOffers.length > 0 && (
                  <div className="recommendations-group">
                    <div className="recommendations-group-header">
                      <div className="recommendations-group-title-wrapper">
                        <h3 className="recommendations-group-title">💳 Partner Offers</h3>
                        {profile?.assigned_persona?.name && (
                          <p className="recommendations-group-subtitle">
                            <strong>Why this matters:</strong> Based on your <strong>{profile.assigned_persona.name}</strong> profile, these partner offers are curated to match your financial situation and help you save money or improve your financial health.
                          </p>
                        )}
                      </div>
                      {memoizedPartnerOffers.length > 1 && (
                        <div className="scroll-nav-buttons">
                          <button
                            className="scroll-nav-btn scroll-nav-btn-left"
                            onClick={() => scrollList(offersListRef, 'left')}
                            disabled={!offersScrollState.canScrollLeft}
                            aria-label="Scroll left"
                          >
                            ←
                          </button>
                          <button
                            className="scroll-nav-btn scroll-nav-btn-right"
                            onClick={() => scrollList(offersListRef, 'right')}
                            disabled={!offersScrollState.canScrollRight}
                            aria-label="Scroll right"
                          >
                            →
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="recommendations-list" ref={offersListRef}>
                      {memoizedPartnerOffers.map((offer, index) => (
                        <RecommendationCard 
                          key={offer.item?.id || index} 
                          recommendation={offer} 
                          type="offer"
                        />
                      ))}
                    </div>
                    <div className="recommendations-disclaimer">
                      <small>
                        <strong>Disclaimer:</strong> This is educational content, not financial advice. Consult a licensed advisor for personalized guidance.
                      </small>
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

