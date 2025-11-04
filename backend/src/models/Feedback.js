const { getDatabase } = require('../config/database');

/**
 * Feedback Model
 * Tracks user feedback on recommendations
 */
class Feedback {
  /**
   * Create a new feedback record
   * @param {Object} feedbackData - Feedback data
   * @param {number} feedbackData.user_id - User ID
   * @param {string} feedbackData.recommendation_id - Recommendation ID (optional)
   * @param {string} feedbackData.recommendation_type - Type: 'education' or 'offer' (optional)
   * @param {number} feedbackData.rating - Rating 1-5 (optional)
   * @param {string} feedbackData.comment - Feedback comment (optional)
   * @param {boolean} feedbackData.helpful - Whether recommendation was helpful (optional)
   * @returns {Object} Created feedback record
   */
  static create(feedbackData) {
    const db = getDatabase();
    const {
      user_id,
      recommendation_id = null,
      recommendation_type = null,
      rating = null,
      comment = null,
      helpful = null
    } = feedbackData;
    
    const stmt = db.prepare(`
      INSERT INTO feedback (user_id, recommendation_id, recommendation_type, rating, comment, helpful, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    
    const result = stmt.run(
      user_id,
      recommendation_id,
      recommendation_type,
      rating,
      comment,
      helpful ? 1 : 0
    );
    
    return this.findById(result.lastInsertRowid);
  }

  /**
   * Find feedback by ID
   * @param {number} feedbackId - Feedback ID
   * @returns {Object|null} Feedback object or null
   */
  static findById(feedbackId) {
    const db = getDatabase();
    const result = db.prepare('SELECT * FROM feedback WHERE feedback_id = ?').get(feedbackId);
    if (!result) return null;
    
    return {
      ...result,
      helpful: result.helpful === 1
    };
  }

  /**
   * Find all feedback for a user
   * @param {number} userId - User ID
   * @returns {Array} Array of feedback records
   */
  static findByUserId(userId) {
    const db = getDatabase();
    const results = db.prepare('SELECT * FROM feedback WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    
    return results.map(result => ({
      ...result,
      helpful: result.helpful === 1
    }));
  }

  /**
   * Find all feedback
   * @returns {Array} Array of all feedback records
   */
  static findAll() {
    const db = getDatabase();
    const results = db.prepare('SELECT * FROM feedback ORDER BY created_at DESC').all();
    
    return results.map(result => ({
      ...result,
      helpful: result.helpful === 1
    }));
  }
}

module.exports = Feedback;

