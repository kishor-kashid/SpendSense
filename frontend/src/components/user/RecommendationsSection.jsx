import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import RecommendationCard from './RecommendationCard';
import Card from '../common/Card';
import Loading from '../common/Loading';
import { useRecommendations } from '../../hooks/useRecommendations';
import { useUser } from '../../context/UserContext';
import { useConsent } from '../../hooks/useConsent';
import { useAuth } from '../../context/AuthContext';
import './RecommendationsSection.css';

const RecommendationsSection = () => {
  const { userId } = useAuth();
  const { hasConsent, loadConsent } = useConsent(userId);
  const { profile } = useUser();
  const { recommendations, loadRecommendations, loading: recommendationsLoading } = useRecommendations(userId);
  
  // Refs for scrollable recommendation lists
  const educationListRef = useRef(null);
  const offersListRef = useRef(null);

  // State for scroll button visibility
  const [educationScrollState, setEducationScrollState] = useState({ canScrollLeft: false, canScrollRight: false });
  const [offersScrollState, setOffersScrollState] = useState({ canScrollLeft: false, canScrollRight: false });

  // Load consent status when component mounts
  useEffect(() => {
    if (userId) {
      loadConsent().catch(() => {
        // Silently handle errors
      });
    }
  }, [userId, loadConsent]);

  // Load recommendations when consent is granted
  useEffect(() => {
    if (hasConsent && userId) {
      loadRecommendations().catch(() => {
        // Silently handle errors
      });
    }
  }, [hasConsent, userId, loadRecommendations]);

  // Reload recommendations when tab becomes active (listen for custom event)
  useEffect(() => {
    const handleRecommendationsTabActive = () => {
      if (hasConsent && userId) {
        loadRecommendations().catch(() => {
          // Silently handle errors
        });
      }
    };

    window.addEventListener('recommendations-tab-active', handleRecommendationsTabActive);
    return () => {
      window.removeEventListener('recommendations-tab-active', handleRecommendationsTabActive);
    };
  }, [hasConsent, userId, loadRecommendations]);

  // Listen for consent changes and reload consent status, then load recommendations
  useEffect(() => {
    const handleConsentChange = async () => {
      // Reload consent status first
      const newStatus = await loadConsent();
      // Then load recommendations if consent was granted
      if (newStatus === 'granted' && userId) {
        await loadRecommendations().catch(() => {
          // Silently handle errors
        });
      }
    };

    const handleRefresh = async () => {
      if (hasConsent && userId) {
        await loadRecommendations().catch(() => {
          // Silently handle errors
        });
      }
    };

    window.addEventListener('consent-changed', handleConsentChange);
    window.addEventListener('dashboard-refresh', handleRefresh);
    
    return () => {
      window.removeEventListener('consent-changed', handleConsentChange);
      window.removeEventListener('dashboard-refresh', handleRefresh);
    };
  }, [hasConsent, userId, loadConsent, loadRecommendations]);

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

  // Update scroll button states when recommendations change
  useEffect(() => {
    if (recommendations?.education_items) {
      const timer = setTimeout(() => {
        checkScrollPosition(educationListRef, setEducationScrollState);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [recommendations?.education_items, checkScrollPosition]);

  useEffect(() => {
    if (recommendations?.partner_offers) {
      const timer = setTimeout(() => {
        checkScrollPosition(offersListRef, setOffersScrollState);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [recommendations?.partner_offers, checkScrollPosition]);

  // Memoize recommendations to prevent unnecessary re-renders
  const memoizedEducationItems = useMemo(() => {
    return recommendations?.education_items || [];
  }, [recommendations?.education_items]);

  const memoizedPartnerOffers = useMemo(() => {
    return recommendations?.partner_offers || [];
  }, [recommendations?.partner_offers]);

  if (!hasConsent) {
    return (
      <Card className="recommendations-consent-required">
        <div className="recommendations-consent-message">
          <h3>Data Processing Consent Required</h3>
          <p>
            To view personalized recommendations, please grant Data Processing Consent.
          </p>
          <p>
            You can manage your consent settings in the navigation menu.
          </p>
        </div>
      </Card>
    );
  }

  return (
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
          {(recommendations.status === 'pending' || (!recommendations.status && 
            (!recommendations.education_items || recommendations.education_items.length === 0) &&
            (!recommendations.partner_offers || recommendations.partner_offers.length === 0))) && (
            <Card className="recommendations-pending-card">
              <div className="recommendations-pending-content">
                <div className="recommendations-pending-icon">⏳</div>
                <h3>Recommendations Pending Approval</h3>
                <p>
                  {recommendations.pending_message || 
                   'Your personalized recommendations are currently being reviewed by our team. ' +
                   'You will be able to view them once they are approved. Please check back later.'}
                </p>
                <button 
                  onClick={() => loadRecommendations()} 
                  style={{ 
                    marginTop: '1rem', 
                    padding: '0.5rem 1rem', 
                    background: '#3b82f6', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Check Status
                </button>
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
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>No recommendations available yet.</p>
            <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
              Recommendations will be generated after you grant data processing consent.
            </p>
            <button 
              onClick={() => loadRecommendations()} 
              style={{ 
                marginTop: '1rem', 
                padding: '0.5rem 1rem', 
                background: '#3b82f6', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer' 
              }}
            >
              Refresh
            </button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RecommendationsSection;

