const { getDatabase } = require('../config/database');

/**
 * Consent Model
 * Tracks user consent for data processing
 */
class Consent {
  /**
   * Create or update consent record
   * @param {Object} consentData - Consent data
   * @param {number} consentData.user_id - User ID
   * @param {boolean} consentData.opted_in - Whether user opted in
   * @returns {Object} Consent record
   */
  static createOrUpdate(consentData) {
    const db = getDatabase();
    const { user_id, opted_in } = consentData;

    // Check if consent record exists
    const existing = this.findByUserId(user_id);
    
    if (existing) {
      // Update existing record
      const stmt = db.prepare(`
        UPDATE consent
        SET opted_in = ?, timestamp = datetime('now')
        WHERE user_id = ?
      `);
      stmt.run(opted_in ? 1 : 0, user_id);
      return this.findByUserId(user_id);
    } else {
      // Create new record
      const stmt = db.prepare(`
        INSERT INTO consent (user_id, opted_in, timestamp)
        VALUES (?, ?, datetime('now'))
      `);
      const result = stmt.run(user_id, opted_in ? 1 : 0);
      return this.findById(result.lastInsertRowid);
    }
  }

  /**
   * Find consent by ID
   * @param {number} consentId - Consent ID
   * @returns {Object|null} Consent object or null
   */
  static findById(consentId) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM consent WHERE consent_id = ?').get(consentId);
  }

  /**
   * Find consent by user ID
   * @param {number} userId - User ID
   * @returns {Object|null} Consent object or null
   */
  static findByUserId(userId) {
    const db = getDatabase();
    const result = db.prepare('SELECT * FROM consent WHERE user_id = ?').get(userId);
    return result || null;
  }

  /**
   * Check if user has consented
   * @param {number} userId - User ID
   * @returns {boolean} True if user has opted in
   */
  static hasConsent(userId) {
    const consent = this.findByUserId(userId);
    return consent ? consent.opted_in === 1 : false;
  }

  /**
   * Revoke consent (opt-out)
   * @param {number} userId - User ID
   * @returns {Object|null} Updated consent record or null
   */
  static revoke(userId) {
    return this.createOrUpdate({ user_id: userId, opted_in: false });
  }

  /**
   * Grant consent (opt-in)
   * @param {number} userId - User ID
   * @returns {Object|null} Updated consent record or null
   */
  static grant(userId) {
    return this.createOrUpdate({ user_id: userId, opted_in: true });
  }

  /**
   * Get consent history for a user
   * @param {number} userId - User ID
   * @returns {Object|null} Latest consent record
   */
  static getHistory(userId) {
    // For now, return latest consent
    // In production, you might want a consent_history table
    return this.findByUserId(userId);
  }
}

module.exports = Consent;

