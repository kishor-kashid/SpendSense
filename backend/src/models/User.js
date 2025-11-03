const { getDatabase } = require('../config/database');

/**
 * User Model
 * Represents a user in the SpendSense system
 */
class User {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.name - User's name
   * @param {string} userData.consent_status - Consent status ('pending', 'granted', 'revoked')
   * @returns {Object} Created user
   */
  static create(userData) {
    const db = getDatabase();
    const { name, consent_status = 'pending' } = userData;
    
    const stmt = db.prepare(`
      INSERT INTO users (name, consent_status, created_at)
      VALUES (?, ?, datetime('now'))
    `);
    
    const result = stmt.run(name, consent_status);
    return this.findById(result.lastInsertRowid);
  }

  /**
   * Find user by ID
   * @param {number} userId - User ID
   * @returns {Object|null} User object or null
   */
  static findById(userId) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);
  }

  /**
   * Find all users
   * @returns {Array} Array of user objects
   */
  static findAll() {
    const db = getDatabase();
    return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  }

  /**
   * Update user
   * @param {number} userId - User ID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated user or null
   */
  static update(userId, updates) {
    const db = getDatabase();
    const fields = [];
    const values = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.consent_status !== undefined) {
      fields.push('consent_status = ?');
      values.push(updates.consent_status);
    }

    if (fields.length === 0) return this.findById(userId);

    values.push(userId);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;
    db.prepare(sql).run(...values);
    
    return this.findById(userId);
  }

  /**
   * Delete user
   * @param {number} userId - User ID
   * @returns {boolean} Success status
   */
  static delete(userId) {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM users WHERE user_id = ?').run(userId);
    return result.changes > 0;
  }
}

module.exports = User;

