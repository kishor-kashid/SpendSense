import React, { useState, useEffect } from 'react';
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

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, reviewsData] = await Promise.all([
        getOperatorUsers(),
        getReviewQueue(),
      ]);

      console.log('OperatorDashboard - getOperatorUsers response:', usersData);
      console.log('OperatorDashboard - getReviewQueue response:', reviewsData);

      // Backend returns { success: true, users: [...] } and { success: true, reviews: [...] }
      // API interceptor returns response.data, so response is already the data object
      let usersArray = [];
      if (Array.isArray(usersData)) {
        usersArray = usersData;
      } else if (usersData?.users && Array.isArray(usersData.users)) {
        usersArray = usersData.users;
      } else if (usersData?.data?.users && Array.isArray(usersData.data.users)) {
        usersArray = usersData.data.users;
      } else if (usersData?.data && Array.isArray(usersData.data)) {
        usersArray = usersData.data;
      }

      let reviewsArray = [];
      if (Array.isArray(reviewsData)) {
        reviewsArray = reviewsData;
      } else if (reviewsData?.reviews && Array.isArray(reviewsData.reviews)) {
        reviewsArray = reviewsData.reviews;
      } else if (reviewsData?.data?.reviews && Array.isArray(reviewsData.data.reviews)) {
        reviewsArray = reviewsData.data.reviews;
      } else if (reviewsData?.data && Array.isArray(reviewsData.data)) {
        reviewsArray = reviewsData.data;
      }

      console.log('OperatorDashboard - extracted users:', usersArray.length);
      console.log('OperatorDashboard - extracted reviews:', reviewsArray.length);

      setUsers(usersArray);
      setReviews(reviewsArray);

      if (usersArray.length === 0) {
        setError('No users found. Please ensure the database has been populated.');
      }
    } catch (err) {
      console.error('OperatorDashboard - Error loading data:', err);
      setError(err.message || 'Failed to load data');
      setUsers([]);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId) => {
    try {
      setLoadingProfile(true);
      const profileData = await getProfile(userId);
      setSelectedUserProfile(profileData.data || profileData);
    } catch (err) {
      console.error('Error loading profile:', err);
      setSelectedUserProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleApprove = async (reviewId, notes) => {
    try {
      await approveRecommendation(reviewId, notes);
      await loadData(); // Refresh reviews
    } catch (err) {
      console.error('Error approving recommendation:', err);
      alert('Failed to approve recommendation: ' + err.message);
    }
  };

  const handleOverride = async (reviewId, notes) => {
    try {
      await overrideRecommendation(reviewId, notes);
      await loadData(); // Refresh reviews
    } catch (err) {
      console.error('Error overriding recommendation:', err);
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

  return (
    <div className="operator-dashboard-container">
      <div className="operator-dashboard-header">
        <h1>Operator Dashboard</h1>
        <button onClick={loadData} className="refresh-button">
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <div className="operator-dashboard-grid">
        <div className="operator-dashboard-sidebar">
          <UserList
            users={users}
            onUserSelect={setSelectedUserId}
            selectedUserId={selectedUserId}
          />
        </div>

        <div className="operator-dashboard-main">
          {selectedUserId && (
            <div className="operator-dashboard-section">
              <h2>User Signals</h2>
              <SignalViewer
                signals={selectedUserProfile?.signals}
                persona={selectedUserProfile?.persona}
                loading={loadingProfile}
              />
            </div>
          )}

          {selectedUserId && selectedUserProfile?.decision_trace && (
            <div className="operator-dashboard-section">
              <DecisionTrace decisionTrace={selectedUserProfile.decision_trace} />
            </div>
          )}

          <div className="operator-dashboard-section">
            <h2>Review Queue</h2>
            <RecommendationReview
              reviews={reviews}
              onApprove={handleApprove}
              onOverride={handleOverride}
              loading={false}
            />
          </div>

          {metrics && (
            <div className="operator-dashboard-section">
              <MetricsPanel metrics={metrics} loading={false} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;

