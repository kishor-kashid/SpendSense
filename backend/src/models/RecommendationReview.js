const { getDatabase } = require('../config/database');

/**
 * Recommendation Review Model
 * Tracks recommendations for operator review and approval
 */
class RecommendationReview {
  /**
   * Create a new recommendation review record
   * @param {Object} reviewData - Review data
   * @param {number} reviewData.user_id - User ID
   * @param {Object} reviewData.recommendation_data - Full recommendation data (JSON)
   * @param {string} reviewData.decision_trace - Decision trace information
   * @param {string} reviewData.status - Status: 'pending', 'approved', 'overridden' (default: 'pending')
   * @returns {Object} Created review record
   */
  static create(reviewData) {
    const db = getDatabase();
    const {
      user_id,
      recommendation_data,
      decision_trace = null,
      status = 'pending'
    } = reviewData;
    
    const stmt = db.prepare(`
      INSERT INTO recommendation_reviews (user_id, recommendation_data, decision_trace, status, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);
    
    const result = stmt.run(
      user_id,
      JSON.stringify(recommendation_data),
      decision_trace ? JSON.stringify(decision_trace) : null,
      status
    );
    
    return this.findById(result.lastInsertRowid);
  }

  /**
   * Find review by ID
   * @param {number} reviewId - Review ID
   * @returns {Object|null} Review object or null
   */
  static findById(reviewId) {
    const db = getDatabase();
    const result = db.prepare('SELECT * FROM recommendation_reviews WHERE review_id = ?').get(reviewId);
    if (!result) return null;
    
    return {
      ...result,
      recommendation_data: JSON.parse(result.recommendation_data),
      decision_trace: result.decision_trace ? JSON.parse(result.decision_trace) : null
    };
  }

  /**
   * Find all reviews for a user
   * @param {number} userId - User ID
   * @returns {Array} Array of review records
   */
  static findByUserId(userId) {
    const db = getDatabase();
    const results = db.prepare('SELECT * FROM recommendation_reviews WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    
    return results.map(result => ({
      ...result,
      recommendation_data: JSON.parse(result.recommendation_data),
      decision_trace: result.decision_trace ? JSON.parse(result.decision_trace) : null
    }));
  }

  /**
   * Find all pending reviews
   * @returns {Array} Array of pending review records
   */
  static findPending() {
    const db = getDatabase();
    const results = db.prepare("SELECT * FROM recommendation_reviews WHERE status = 'pending' ORDER BY created_at DESC").all();
    
    return results.map(result => ({
      ...result,
      recommendation_data: JSON.parse(result.recommendation_data),
      decision_trace: result.decision_trace ? JSON.parse(result.decision_trace) : null
    }));
  }

  /**
   * Update review status
   * @param {number} reviewId - Review ID
   * @param {string} status - New status: 'approved' or 'overridden'
   * @param {string} operatorNotes - Optional operator notes
   * @param {string} reviewedBy - Optional operator identifier
   * @returns {Object|null} Updated review record or null
   */
  static updateStatus(reviewId, status, operatorNotes = null, reviewedBy = null) {
    const db = getDatabase();
    
    const stmt = db.prepare(`
      UPDATE recommendation_reviews
      SET status = ?, operator_notes = ?, reviewed_at = datetime('now'), reviewed_by = ?
      WHERE review_id = ?
    `);
    
    stmt.run(status, operatorNotes, reviewedBy, reviewId);
    
    return this.findById(reviewId);
  }

  /**
   * Find all reviews by status
   * @param {string} status - Status: 'pending', 'approved', 'overridden'
   * @returns {Array} Array of review records
   */
  static findByStatus(status) {
    const db = getDatabase();
    const results = db.prepare('SELECT * FROM recommendation_reviews WHERE status = ? ORDER BY created_at DESC').all(status);
    
    return results.map(result => ({
      ...result,
      recommendation_data: JSON.parse(result.recommendation_data),
      decision_trace: result.decision_trace ? JSON.parse(result.decision_trace) : null
    }));
  }

  /**
   * Find all reviews
   * @returns {Array} Array of all review records
   */
  static findAll() {
    const db = getDatabase();
    const results = db.prepare('SELECT * FROM recommendation_reviews ORDER BY created_at DESC').all();
    
    return results.map(result => ({
      ...result,
      recommendation_data: JSON.parse(result.recommendation_data),
      decision_trace: result.decision_trace ? JSON.parse(result.decision_trace) : null
    }));
  }
}

module.exports = RecommendationReview;

