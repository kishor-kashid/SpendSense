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
   * Find pending review for a user
   * @param {number} userId - User ID
   * @returns {Object|null} Pending review record or null
   */
  static findPendingByUserId(userId) {
    const db = getDatabase();
    const result = db.prepare("SELECT * FROM recommendation_reviews WHERE user_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1").get(userId);
    
    if (!result) return null;
    
    return {
      ...result,
      recommendation_data: JSON.parse(result.recommendation_data),
      decision_trace: result.decision_trace ? JSON.parse(result.decision_trace) : null
    };
  }

  /**
   * Find approved review for a user (most recent)
   * @param {number} userId - User ID
   * @returns {Object|null} Approved review record or null
   */
  static findApprovedByUserId(userId) {
    const db = getDatabase();
    const result = db.prepare("SELECT * FROM recommendation_reviews WHERE user_id = ? AND status = 'approved' ORDER BY reviewed_at DESC, created_at DESC LIMIT 1").get(userId);
    
    if (!result) return null;
    
    return {
      ...result,
      recommendation_data: JSON.parse(result.recommendation_data),
      decision_trace: result.decision_trace ? JSON.parse(result.decision_trace) : null
    };
  }

  /**
   * Find all pending reviews
   * @returns {Array} Array of pending review records (one per user, latest)
   */
  static findPending() {
    const db = getDatabase();
    // Get the latest pending review for each user
    const results = db.prepare(`
      SELECT r1.* 
      FROM recommendation_reviews r1
      INNER JOIN (
        SELECT user_id, MAX(created_at) as max_created_at
        FROM recommendation_reviews
        WHERE status = 'pending'
        GROUP BY user_id
      ) r2 ON r1.user_id = r2.user_id AND r1.created_at = r2.max_created_at
      WHERE r1.status = 'pending'
      ORDER BY r1.created_at DESC
    `).all();
    
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
   * Flag a review for special attention
   * @param {number} reviewId - Review ID
   * @param {string} flagReason - Reason for flagging
   * @returns {Object|null} Updated review record or null
   */
  static flagReview(reviewId, flagReason = null) {
    const db = getDatabase();
    
    const stmt = db.prepare(`
      UPDATE recommendation_reviews
      SET flagged = 1, flag_reason = ?
      WHERE review_id = ?
    `);
    
    stmt.run(flagReason, reviewId);
    
    return this.findById(reviewId);
  }

  /**
   * Unflag a review
   * @param {number} reviewId - Review ID
   * @returns {Object|null} Updated review record or null
   */
  static unflagReview(reviewId) {
    const db = getDatabase();
    
    const stmt = db.prepare(`
      UPDATE recommendation_reviews
      SET flagged = 0, flag_reason = NULL
      WHERE review_id = ?
    `);
    
    stmt.run(reviewId);
    
    return this.findById(reviewId);
  }

  /**
   * Create or update pending review for a user
   * If a pending review exists, update it; otherwise create a new one
   * @param {Object} reviewData - Review data
   * @param {number} reviewData.user_id - User ID
   * @param {Object} reviewData.recommendation_data - Full recommendation data (JSON)
   * @param {Object} reviewData.decision_trace - Decision trace information
   * @returns {Object} Created or updated review record
   */
  static createOrUpdatePending(reviewData) {
    const { user_id, recommendation_data, decision_trace } = reviewData;
    
    // Check if there's already a pending review for this user
    const existing = this.findPendingByUserId(user_id);
    
    if (existing) {
      // Update existing pending review
      const db = getDatabase();
      const stmt = db.prepare(`
        UPDATE recommendation_reviews
        SET recommendation_data = ?, decision_trace = ?, created_at = datetime('now')
        WHERE review_id = ?
      `);
      
      stmt.run(
        JSON.stringify(recommendation_data),
        decision_trace ? JSON.stringify(decision_trace) : null,
        existing.review_id
      );
      
      return this.findById(existing.review_id);
    } else {
      // Create new review
      return this.create(reviewData);
    }
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

