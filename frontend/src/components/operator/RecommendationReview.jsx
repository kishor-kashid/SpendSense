import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Loading from '../common/Loading';
import EducationItem from '../user/EducationItem';
import PartnerOffer from '../user/PartnerOffer';
import './RecommendationReview.css';

const RecommendationReview = ({ 
  reviews, 
  onApprove, 
  onOverride, 
  loading = false 
}) => {
  const [selectedReview, setSelectedReview] = useState(null);
  const [notes, setNotes] = useState('');
  const [actionType, setActionType] = useState(null); // 'approve' or 'override'

  // Ensure reviews is an array
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return (
      <Card>
        <p>No recommendations pending review.</p>
      </Card>
    );
  }

  const handleAction = (review, type) => {
    setSelectedReview(review);
    setActionType(type);
    setNotes('');
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
      <Card title="Review Queue" className="recommendation-review">
        {loading && (
          <Loading message="Loading reviews..." />
        )}

        {!loading && (
          <div className="review-list">
            {reviews.map((review) => (
              <Card key={review.review_id} className="review-item-card">
                <div className="review-item-header">
                  <div>
                    <strong>User ID: {review.user_id}</strong>
                    <span className="review-item-date">
                      Created: {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="review-item-status pending">
                    {review.status}
                  </span>
                </div>

                <div className="review-item-content">
                  <h3 className="review-content-title">Recommendations to Review</h3>
                  
                  {/* Backend stores recommendations in recommendations.education array */}
                  {/* Each item has structure: { type: 'education', item: {...}, rationale: '...' } */}
                  {(() => {
                    const recData = review.recommendation_data || {};
                    console.log('RecommendationReview - review.recommendation_data:', recData);
                    
                    // Handle both formats:
                    // 1. New format: { recommendations: { education: [...], partner_offers: [...] } }
                    // 2. Transformed format: { education_items: [...], partner_offers: [...] }
                    const educationRecs = recData.recommendations?.education || recData.education_items || [];
                    const partnerOfferRecs = recData.recommendations?.partner_offers || recData.partner_offers || [];
                    
                    console.log('RecommendationReview - educationRecs:', educationRecs);
                    console.log('RecommendationReview - partnerOfferRecs:', partnerOfferRecs);
                    
                    return (
                      <>
                        {educationRecs.length > 0 && (
                          <div className="review-section">
                            <h4 className="review-section-title">
                              📚 Educational Resources ({educationRecs.length})
                            </h4>
                            <div className="review-items-list">
                              {educationRecs.map((rec, idx) => {
                                // Handle both formats: { item, rationale } or just item
                                const item = rec.item || rec;
                                const rationale = rec.rationale;
                                return (
                                  <div key={idx} className="review-item-detail">
                                    <EducationItem item={{ ...item, rationale }} />
                                  </div>
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
                                // Handle both formats: { item, rationale, eligibility_check/eligibility } or just item
                                const item = rec.item || rec;
                                const rationale = rec.rationale;
                                // Backend uses eligibility_check, but component expects eligibility
                                const eligibility = rec.eligibility_check || rec.eligibility;
                                // Map offer_category to category and provider_url to url for component compatibility
                                const mappedItem = {
                                  ...item,
                                  category: item.category || item.offer_category,
                                  url: item.url || item.provider_url,
                                  rationale,
                                  eligibility
                                };
                                return (
                                  <div key={idx} className="review-item-detail">
                                    <PartnerOffer offer={mappedItem} />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {educationRecs.length === 0 && partnerOfferRecs.length === 0 && (
                          <div className="review-section">
                            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                              No recommendations found in this review. Data structure may be different.
                            </p>
                            <details style={{ marginTop: 'var(--spacing-md)' }}>
                              <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                Debug: View raw data
                              </summary>
                              <pre style={{ 
                                background: 'var(--background)', 
                                padding: 'var(--spacing-md)', 
                                borderRadius: 'var(--radius-md)',
                                overflow: 'auto',
                                fontSize: '0.75rem',
                                marginTop: 'var(--spacing-sm)'
                              }}>
                                {JSON.stringify(recData, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {review.decision_trace && (
                    <div className="review-section">
                      <h4 className="review-section-title">Decision Trace</h4>
                      <div className="review-decision-trace">
                        <p><strong>Persona:</strong> {review.decision_trace.persona_assignment?.persona_name || 'N/A'}</p>
                        {review.decision_trace.persona_assignment?.rationale && (
                          <p><strong>Rationale:</strong> {review.decision_trace.persona_assignment.rationale}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="review-item-actions">
                  <Button
                    variant="primary"
                    onClick={() => handleAction(review, 'approve')}
                    fullWidth
                  >
                    ✓ Approve Recommendations
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleAction(review, 'override')}
                    fullWidth
                  >
                    ✗ Override/Reject Recommendations
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

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
    </>
  );
};

export default RecommendationReview;
