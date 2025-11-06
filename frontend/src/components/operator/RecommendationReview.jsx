import React, { useState, useMemo } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Loading from '../common/Loading';
import DecisionTrace from './DecisionTrace';
import { flagReview, unflagReview } from '../../services/api';
import './RecommendationReview.css';

const RecommendationReview = ({ 
  reviews, 
  onApprove, 
  onOverride, 
  loading = false 
}) => {
  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [notes, setNotes] = useState('');
  const [actionType, setActionType] = useState(null); // 'approve' or 'override'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'user', 'urgency'
  const [filterText, setFilterText] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [reviewToFlag, setReviewToFlag] = useState(null);

  // Calculate urgency for a review
  const getReviewUrgency = (review) => {
    const daysOld = (Date.now() - new Date(review.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld > 7) return { level: 'high', label: '🔴 Urgent', days: Math.floor(daysOld) };
    if (daysOld > 3) return { level: 'medium', label: '🟡 Medium', days: Math.floor(daysOld) };
    return { level: 'low', label: '🟢 Low', days: Math.floor(daysOld) };
  };

  // Filter and sort reviews
  const filteredAndSortedReviews = useMemo(() => {
    if (!reviews || !Array.isArray(reviews)) return [];
    
    let filtered = reviews;
    
    // Filter by search text
    if (filterText) {
      filtered = filtered.filter(review => 
        review.user_id?.toString().includes(filterText) ||
        review.review_id?.toString().includes(filterText)
      );
    }
    
    // Sort reviews
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      if (sortBy === 'user') {
        return (a.user_id || 0) - (b.user_id || 0);
      }
      if (sortBy === 'urgency') {
        const urgencyA = getReviewUrgency(a);
        const urgencyB = getReviewUrgency(b);
        const urgencyOrder = { high: 3, medium: 2, low: 1 };
        return urgencyOrder[urgencyB.level] - urgencyOrder[urgencyA.level];
      }
      return 0;
    });
    
    return sorted;
  }, [reviews, filterText, sortBy]);

  // Check if reviews array is empty (before filtering)
  const hasNoReviews = !reviews || !Array.isArray(reviews) || reviews.length === 0;

  const toggleReview = (reviewId) => {
    setExpandedReviewId(expandedReviewId === reviewId ? null : reviewId);
  };

  const handleFlag = async (review) => {
    setReviewToFlag(review);
    setShowFlagModal(true);
  };

  const handleUnflag = async (reviewId) => {
    try {
      await unflagReview(reviewId);
      // Refresh reviews
      if (onApprove) {
        // Trigger refresh by calling parent's refresh
        window.dispatchEvent(new CustomEvent('refreshOperatorData'));
      }
    } catch (error) {
      alert('Failed to unflag review: ' + (error.message || 'Unknown error'));
    }
  };

  const submitFlag = async () => {
    if (!reviewToFlag) return;
    
    try {
      await flagReview(reviewToFlag.review_id, flagReason);
      setShowFlagModal(false);
      setFlagReason('');
      setReviewToFlag(null);
      // Refresh reviews
      if (onApprove) {
        window.dispatchEvent(new CustomEvent('refreshOperatorData'));
      }
    } catch (error) {
      alert('Failed to flag review: ' + (error.message || 'Unknown error'));
    }
  };

  const handleAction = (review, type) => {
    setSelectedReview(review);
    setActionType(type);
    setNotes('');
  };

  // Simplified recommendation item component - only title and link
  const SimpleRecommendationItem = ({ item, type }) => {
    const url = item.url || item.provider_url;
    const title = item.title || item.name;
    
    return (
      <div className="simple-recommendation-item">
        <div className="simple-recommendation-title">{title}</div>
        {url && (
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="simple-recommendation-link"
          >
            View Resource →
          </a>
        )}
      </div>
    );
  };

  const confirmAction = () => {
    if (!selectedReview) return;

    if (actionType === 'approve') {
      onApprove(selectedReview.review_id, notes);
    } else if (actionType === 'override') {
      onOverride(selectedReview.review_id, notes);
    }

    setSelectedReview(null);
    setActionType(null);
    setNotes('');
  };

  return (
    <>
      {loading && (
        <Loading message="Loading reviews..." />
      )}

      {!loading && (
        <>
          {hasNoReviews ? (
            <div className="empty-reviews">
              <div className="empty-reviews-icon">✅</div>
              <p>No recommendations pending review.</p>
            </div>
          ) : (
            <>
              {/* Filters and Sort */}
              <div className="review-filters">
                <input
                  type="text"
                  placeholder="Search by User ID or Review ID..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="review-search-input"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="review-sort-select"
                >
                  <option value="date">Sort by Date (Newest)</option>
                  <option value="urgency">Sort by Urgency</option>
                  <option value="user">Sort by User ID</option>
                </select>
              </div>

              <div className="review-list">
            {filteredAndSortedReviews.map((review) => {
            const urgency = getReviewUrgency(review);
            const isExpanded = expandedReviewId === review.review_id;
            const recData = review.recommendation_data || {};
            const educationRecs = recData.recommendations?.education || recData.education_items || [];
            const partnerOfferRecs = recData.recommendations?.partner_offers || recData.partner_offers || [];
            const totalRecommendations = educationRecs.length + partnerOfferRecs.length;

            return (
              <Card key={review.review_id} className="review-item-card">
                <div 
                  className="review-item-header clickable"
                  onClick={() => toggleReview(review.review_id)}
                >
                  <div>
                    <strong>User ID: {review.user_id}</strong>
                    <span className="review-item-date">
                      Created: {new Date(review.created_at).toLocaleDateString()}
                      {' '}• {urgency.days} day{urgency.days !== 1 ? 's' : ''} ago
                      {totalRecommendations > 0 && (
                        <span className="review-item-count">
                          {' '}• {totalRecommendations} recommendation{totalRecommendations !== 1 ? 's' : ''}
                        </span>
                      )}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    {review.flagged && (
                      <span className="flag-badge" title={review.flag_reason || 'Flagged for review'}>
                        🚩 Flagged
                      </span>
                    )}
                    <span className={`urgency-badge ${urgency.level}`}>
                      {urgency.label}
                    </span>
                    <span className="review-item-status pending">
                      {review.status}
                    </span>
                    <span className="review-expand-icon">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="review-item-content">
                    {/* Decision Trace */}
                    {(review.decision_trace || recData.decision_trace) && (
                      <div className="review-section">
                        <h4 className="review-section-title">
                          🔍 Decision Trace
                        </h4>
                        <DecisionTrace 
                          decisionTrace={{
                            ...(review.decision_trace || recData.decision_trace || {}),
                            // Enrich with behavioral signals and summary from recommendation data if available
                            behavioral_signals: recData.behavioral_signals || null,
                            summary: recData.summary || null
                          }} 
                        />
                      </div>
                    )}

                    {educationRecs.length > 0 && (
                      <div className="review-section">
                        <h4 className="review-section-title">
                          📚 Educational Resources ({educationRecs.length})
                        </h4>
                        <div className="review-items-list">
                          {educationRecs.map((rec, idx) => {
                            const item = rec.item || rec;
                            return (
                              <SimpleRecommendationItem 
                                key={idx} 
                                item={item} 
                                type="education"
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {partnerOfferRecs.length > 0 && (
                      <div className="review-section">
                        <h4 className="review-section-title">
                          💳 Partner Offers ({partnerOfferRecs.length})
                        </h4>
                        <div className="review-items-list">
                          {partnerOfferRecs.map((rec, idx) => {
                            const item = rec.item || rec;
                            return (
                              <SimpleRecommendationItem 
                                key={idx} 
                                item={item} 
                                type="offer"
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {educationRecs.length === 0 && partnerOfferRecs.length === 0 && (
                      <div className="review-section">
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          No recommendations found in this review.
                        </p>
                      </div>
                    )}

                    <div className="review-item-actions">
                      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                        {!review.flagged ? (
                          <Button
                            variant="outline"
                            onClick={() => handleFlag(review)}
                            style={{ flex: 1, minWidth: '120px' }}
                          >
                            🚩 Flag for Review
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => handleUnflag(review.review_id)}
                            style={{ flex: 1, minWidth: '120px' }}
                          >
                            ✓ Unflag
                          </Button>
                        )}
                        <Button
                          variant="primary"
                          onClick={() => handleAction(review, 'approve')}
                          style={{ flex: 1, minWidth: '150px' }}
                        >
                          ✓ Approve
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleAction(review, 'override')}
                          style={{ flex: 1, minWidth: '150px' }}
                        >
                          ✗ Override
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
          </div>
          
              {filteredAndSortedReviews.length === 0 && filterText && (
                <div className="empty-reviews">
                  <p>No reviews match your search criteria.</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      <Modal
        isOpen={selectedReview !== null}
        onClose={() => {
          setSelectedReview(null);
          setActionType(null);
          setNotes('');
        }}
        title={actionType === 'approve' ? 'Approve Recommendations' : 'Override/Reject Recommendations'}
        size="large"
      >
        {selectedReview && (
          <div className="review-modal-content">
            <div className="review-modal-header">
              <p className="review-modal-user">
                <strong>User ID:</strong> {selectedReview.user_id}
              </p>
              <p>
                {actionType === 'approve' 
                  ? 'Are you sure you want to approve these recommendations for this user?' 
                  : 'Are you sure you want to override/reject these recommendations for this user?'}
              </p>
            </div>

            <div className="review-modal-recommendations">
              <h4>Recommendations Summary</h4>
              {(() => {
                const recData = selectedReview.recommendation_data || {};
                const educationRecs = recData.recommendations?.education || recData.education_items || [];
                const partnerOfferRecs = recData.recommendations?.partner_offers || recData.partner_offers || [];
                return (
                  <>
                    {educationRecs.length > 0 && (
                      <p>
                        <strong>Education Items:</strong> {educationRecs.length}
                      </p>
                    )}
                    {partnerOfferRecs.length > 0 && (
                      <p>
                        <strong>Partner Offers:</strong> {partnerOfferRecs.length}
                      </p>
                    )}
                    {educationRecs.length === 0 && partnerOfferRecs.length === 0 && (
                      <p style={{ color: 'var(--text-secondary)' }}>
                        No recommendations found in this review.
                      </p>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="review-modal-notes">
              <label htmlFor="review-notes">
                <strong>Notes {actionType === 'override' ? '(required for rejections)' : '(optional)'}:</strong>
              </label>
              <textarea
                id="review-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={actionType === 'override' ? 'Please explain why you are overriding these recommendations...' : 'Add any notes about this decision...'}
                rows={4}
                className="review-notes-textarea"
                required={actionType === 'override'}
              />
            </div>

            <div className="review-modal-actions">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedReview(null);
                  setActionType(null);
                  setNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant={actionType === 'approve' ? 'primary' : 'danger'}
                onClick={confirmAction}
                disabled={actionType === 'override' && !notes.trim()}
              >
                Confirm {actionType === 'approve' ? 'Approval' : 'Override'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Flag Modal */}
      <Modal
        isOpen={showFlagModal}
        title="Flag Review for Attention"
        onClose={() => {
          setShowFlagModal(false);
          setFlagReason('');
          setReviewToFlag(null);
        }}
      >
          <div>
            <p>Why are you flagging this review?</p>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Enter reason for flagging (optional)"
              rows={4}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                marginTop: 'var(--spacing-sm)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius)',
                fontFamily: 'inherit'
              }}
            />
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
              <Button
                variant="primary"
                onClick={submitFlag}
                fullWidth
              >
                Flag Review
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowFlagModal(false);
                  setFlagReason('');
                  setReviewToFlag(null);
                }}
                fullWidth
              >
                Cancel
              </Button>
            </div>
          </div>
      </Modal>
    </>
  );
};

export default RecommendationReview;
