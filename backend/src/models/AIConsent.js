const { getDatabase } = require('../config/database');

/**
 * AI Consent Model
 * Tracks user consent for AI-powered features
 * Separate from data processing consent - users can opt into data processing
 * but not AI features, or vice versa
 */
class AIConsent {
  /**
   * Create or update AI consent record
   * @param {Object} consentData - Consent data
   * @param {number} consentData.user_id - User ID
   * @param {boolean} consentData.opted_in - Whether user opted in to AI features
   * @returns {Object} AI consent record
   */
  static createOrUpdate(consentData) {
    const db = getDatabase();
    const { user_id, opted_in } = consentData;

    // Check if consent record exists
    const existing = this.findByUserId(user_id);
    
    if (existing) {
      // Update existing record
      const stmt = db.prepare(`
        UPDATE ai_consent
        SET opted_in = ?, timestamp = datetime('now')
        WHERE user_id = ?
      `);
      stmt.run(opted_in ? 1 : 0, user_id);
      return this.findByUserId(user_id);
    } else {
      // Create new record
      const stmt = db.prepare(`
        INSERT INTO ai_consent (user_id, opted_in, timestamp)
        VALUES (?, ?, datetime('now'))
      `);
      const result = stmt.run(user_id, opted_in ? 1 : 0);
      return this.findById(result.lastInsertRowid);
    }
  }

  /**
   * Find AI consent by ID
   * @param {number} consentId - AI consent ID
   * @returns {Object|null} AI consent object or null
   */
  static findById(consentId) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM ai_consent WHERE ai_consent_id = ?').get(consentId);
  }

  /**
   * Find AI consent by user ID
   * @param {number} userId - User ID
   * @returns {Object|null} AI consent object or null
   */
  static findByUserId(userId) {
    const db = getDatabase();
    const result = db.prepare('SELECT * FROM ai_consent WHERE user_id = ?').get(userId);
    return result || null;
  }

  /**
   * Check if user has granted AI consent
   * @param {number} userId - User ID
   * @returns {boolean} True if user has opted in to AI features
   */
  static hasConsent(userId) {
    const consent = this.findByUserId(userId);
    return consent ? consent.opted_in === 1 : false;
  }

  /**
   * Revoke AI consent (opt-out)
   * @param {number} userId - User ID
   * @returns {Object|null} Updated AI consent record or null
   */
  static revoke(userId) {
    return this.createOrUpdate({ user_id: userId, opted_in: false });
  }

  /**
   * Grant AI consent (opt-in)
   * @param {number} userId - User ID
   * @returns {Object|null} Updated AI consent record or null
   */
  static grant(userId) {
    return this.createOrUpdate({ user_id: userId, opted_in: true });
  }

  /**
   * Get AI consent history for a user
   * @param {number} userId - User ID
   * @returns {Object|null} Latest AI consent record
   */
  static getHistory(userId) {
    // For now, return latest consent
    // In production, you might want a consent_history table
    return this.findByUserId(userId);
  }
}

module.exports = AIConsent;

