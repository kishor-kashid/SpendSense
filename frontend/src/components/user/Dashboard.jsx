import React, { useEffect, useState } from 'react';
import ConsentPrompt from './ConsentPrompt';
import BehavioralProfile from './BehavioralProfile';
import RecommendationCard from './RecommendationCard';
import Loading from '../common/Loading';
import Card from '../common/Card';
import { useAuth } from '../../context/AuthContext';
import { useConsent } from '../../hooks/useConsent';
import { useRecommendations } from '../../hooks/useRecommendations';
import { useUser } from '../../context/UserContext';
import './Dashboard.css';

const Dashboard = () => {
  const { userId } = useAuth();
  const { profile, refreshProfile } = useUser();
  const { consentStatus, hasConsent, grant, revoke, loadConsent } = useConsent(userId);
  const { recommendations, loadRecommendations, loading: recommendationsLoading } = useRecommendations(userId);
  const [loadingConsent, setLoadingConsent] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

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

  const handleGrantConsent = async () => {
    setLoadingConsent(true);
    try {
      const success = await grant();
      if (success) {
        // Refresh profile first
        await refreshProfile();
        // Then load recommendations
        await loadRecommendations();
      }
    } catch (error) {
      console.error('Error granting consent:', error);
    } finally {
      setLoadingConsent(false);
    }
  };

  // Add refresh function that can be called manually
  const handleRefresh = async () => {
    if (userId) {
      setLoadingRecommendations(true);
      try {
        await refreshProfile();
        await loadRecommendations();
      } catch (error) {
        console.error('Error refreshing recommendations:', error);
      } finally {
        setLoadingRecommendations(false);
      }
    }
  };

  const handleDenyConsent = () => {
    // User declined - could navigate away or show message
    console.log('User declined consent');
  };

  const handleRevokeConsent = async () => {
    setLoadingConsent(true);
    try {
      await revoke();
    } catch (error) {
      console.error('Error revoking consent:', error);
    } finally {
      setLoadingConsent(false);
    }
  };

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

  if (!hasConsent) {
    return (
      <div className="dashboard-container">
        <ConsentPrompt 
          onGrant={handleGrantConsent}
          onDeny={handleDenyConsent}
          loading={loadingConsent}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Your Financial Dashboard</h1>
        <div className="dashboard-header-actions">
          <button 
            onClick={handleRefresh}
            className="refresh-button"
            disabled={recommendationsLoading || loadingConsent}
            title="Refresh recommendations"
          >
            🔄 Refresh
          </button>
          <button 
            onClick={handleRevokeConsent}
            className="revoke-consent-button"
            disabled={loadingConsent}
          >
            Revoke Consent
          </button>
        </div>
      </div>

      <BehavioralProfile profile={profile} />

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
    </div>
  );
};

export default Dashboard;

