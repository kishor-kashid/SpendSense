import React, { useState, useEffect, useCallback } from 'react';
import UserList from './UserList';
import SignalViewer from './SignalViewer';
import RecommendationReview from './RecommendationReview';
import DecisionTrace from './DecisionTrace';
import MetricsPanel from './MetricsPanel';
import Loading from '../common/Loading';
import { getOperatorUsers, getProfile, getReviewQueue, approveRecommendation, overrideRecommendation } from '../../services/api';
import './OperatorDashboard.css';

const OperatorDashboard = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('reviews'); // Default to reviews tab

  // Helper function to extract array from API response
  const extractArray = (data, key) => {
    if (Array.isArray(data)) return data;
    if (data?.[key] && Array.isArray(data[key])) return data[key];
    if (data?.data?.[key] && Array.isArray(data.data[key])) return data.data[key];
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, reviewsData] = await Promise.all([
        getOperatorUsers(),
        getReviewQueue(),
      ]);

      // Backend returns { success: true, users: [...] } and { success: true, reviews: [...] }
      // API interceptor returns response.data, so response is already the data object
      const usersArray = extractArray(usersData, 'users');
      const reviewsArray = extractArray(reviewsData, 'reviews');

      setUsers(usersArray);
      setReviews(reviewsArray);

      if (usersArray.length === 0) {
        setError('No users found. Please ensure the database has been populated.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
      setUsers([]);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserProfile = async (userId) => {
    try {
      setLoadingProfile(true);
      const profileData = await getProfile(userId);
      
      // Handle API response structure
      const rawProfile = profileData.profile || profileData.data?.profile || profileData.data || profileData;
      
      // Transform the profile data to match what SignalViewer expects
      // Keep the full behavioral_signals structure with both short_term and long_term
      const transformedProfile = {
        ...rawProfile,
        // Include persona assignments from user data if available
        persona_assignments: rawProfile.persona_assignments || null,
        // Pass behavioral_signals as-is so SignalViewer can access both time windows
        signals: rawProfile.behavioral_signals || null,
        // Map assigned_persona to persona
        persona: rawProfile.assigned_persona ? {
          name: rawProfile.assigned_persona.name,
          rationale: rawProfile.persona_rationale || rawProfile.rationale
        } : null
      };
      
      setSelectedUserProfile(transformedProfile);
    } catch (err) {
      setSelectedUserProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadUserProfile(selectedUserId);
    } else {
      setSelectedUserProfile(null);
    }
  }, [selectedUserId]);

  // Listen for refresh events from navbar
  useEffect(() => {
    const handleRefreshEvent = () => {
      loadData();
    };

    window.addEventListener('refreshOperatorData', handleRefreshEvent);
    return () => {
      window.removeEventListener('refreshOperatorData', handleRefreshEvent);
    };
  }, [loadData]);

  // Listen for consent changes to refresh user data
  useEffect(() => {
    const handleConsentChange = () => {
      // Reload data when consent changes to update user consent status
      loadData();
    };

    window.addEventListener('consent-changed', handleConsentChange);
    return () => {
      window.removeEventListener('consent-changed', handleConsentChange);
    };
  }, [loadData]);

  // Get persona assignments for selected user from users list
  const selectedUser = users.find(u => u.user_id === selectedUserId);
  const selectedUserPersonaAssignments = selectedUser?.persona_assignments;

  const handleApprove = async (reviewId, notes) => {
    try {
      await approveRecommendation(reviewId, notes);
      await loadData(); // Refresh reviews
    } catch (err) {
      alert('Failed to approve recommendation: ' + err.message);
    }
  };

  const handleOverride = async (reviewId, notes) => {
    try {
      await overrideRecommendation(reviewId, notes);
      await loadData(); // Refresh reviews
    } catch (err) {
      alert('Failed to override recommendation: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="operator-dashboard-container">
        <Loading message="Loading operator dashboard..." fullScreen />
      </div>
    );
  }

  // Calculate stats
  const stats = {
    totalUsers: users.length,
    pendingReviews: reviews.length,
    usersWithConsent: users.filter(u => {
      const consent = u.consent_status || u.consent?.has_consent;
      return consent === 'granted' || consent === true;
    }).length
  };

  return (
    <div className="operator-dashboard-container">
      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* Quick Stats Dashboard */}
      <div className="dashboard-stats-bar">
        <div className="stat-card">
          <span className="stat-label">Total Users</span>
          <span className="stat-value">{stats.totalUsers}</span>
        </div>
        <div className="stat-card warning">
          <span className="stat-label">Pending Reviews</span>
          <span className="stat-value">{stats.pendingReviews}</span>
        </div>
        <div className="stat-card success">
          <span className="stat-label">Users with Consent</span>
          <span className="stat-value">{stats.usersWithConsent}</span>
        </div>
      </div>

      <div className="operator-dashboard-grid">
        <div className="operator-dashboard-sidebar">
          <UserList
            users={users}
            onUserSelect={(userId) => {
              setSelectedUserId(userId);
              setActiveTab('analysis'); // Switch to analysis tab when user is selected
            }}
            selectedUserId={selectedUserId}
          />
        </div>

        <div className="operator-dashboard-main">
          {/* Tab Navigation */}
          <div className="dashboard-tabs">
            <button 
              className={`tab ${activeTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('analysis')}
              disabled={!selectedUserId}
            >
              <span className="tab-icon">📊</span>
              User Analysis
              {selectedUserId && selectedUserProfile && (
                <span className="tab-indicator"></span>
              )}
            </button>
            <button 
              className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              <span className="tab-icon">✅</span>
              Review Queue
              {reviews.length > 0 && (
                <span className="tab-badge">{reviews.length}</span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'analysis' && (
            <div className="analysis-panel">
              {!selectedUserId ? (
                <div className="empty-state">
                  <div className="empty-state-icon">👤</div>
                  <h3>Select a User</h3>
                  <p>Choose a user from the sidebar to view their analysis and signals.</p>
                </div>
              ) : (
                <>
                  <div className="panel-section">
                    <h2>
                      <span className="section-icon">📊</span>
                      User Signals
                    </h2>
                    <SignalViewer
                      signals={selectedUserProfile?.signals}
                      persona={selectedUserProfile?.persona}
                      loading={loadingProfile}
                    />
                  </div>

                  {selectedUserId && selectedUserProfile?.decision_trace && (
                    <div className="panel-section">
                      <h2>
                        <span className="section-icon">🔍</span>
                        Decision Trace
                      </h2>
                      <DecisionTrace decisionTrace={selectedUserProfile.decision_trace} />
                    </div>
                  )}

                  {metrics && (
                    <div className="panel-section">
                      <h2>
                        <span className="section-icon">📈</span>
                        Metrics
                      </h2>
                      <MetricsPanel metrics={metrics} loading={false} />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="reviews-panel">
              <div className="panel-section">
                <h2>
                  <span className="section-icon">✅</span>
                  Review Queue
                  {reviews.length > 0 && (
                    <span className="section-badge">{reviews.length} pending</span>
                  )}
                </h2>
                <RecommendationReview
                  reviews={reviews}
                  onApprove={handleApprove}
                  onOverride={handleOverride}
                  loading={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;

