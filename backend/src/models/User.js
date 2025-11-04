const { getDatabase } = require('../config/database');

/**
 * User Model
 * Represents a user in the SpendSense system
 */
class User {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.first_name - User's first name
   * @param {string} userData.last_name - User's last name
   * @param {string} userData.name - User's full name (optional, will be generated if not provided)
   * @param {string} userData.username - User's username
   * @param {string} userData.password - User's password
   * @param {string} userData.consent_status - Consent status ('granted', 'revoked')
   * @returns {Object} Created user
   */
  static create(userData) {
    const db = getDatabase();
    const { 
      first_name, 
      last_name, 
      name, 
      username, 
      password, 
      consent_status = 'revoked' 
    } = userData;
    
    // Generate full name if not provided
    const fullName = name || `${first_name} ${last_name}`;
    
    const stmt = db.prepare(`
      INSERT INTO users (first_name, last_name, name, username, password, consent_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    
    const result = stmt.run(first_name, last_name, fullName, username, password, consent_status);
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
   * Find user by username
   * @param {string} username - Username
   * @returns {Object|null} User object or null
   */
  static findByUsername(username) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  }

  /**
   * Verify user credentials
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Object|null} User object if credentials match, null otherwise
   */
  static verifyCredentials(username, password) {
    const user = this.findByUsername(username);
    if (!user) {
      return null;
    }
    
    // Simple password comparison (no encryption as requested)
    if (user.password === password) {
      return user;
    }
    
    return null;
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

    if (updates.first_name !== undefined) {
      fields.push('first_name = ?');
      values.push(updates.first_name);
    }
    if (updates.last_name !== undefined) {
      fields.push('last_name = ?');
      values.push(updates.last_name);
    }
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.username !== undefined) {
      fields.push('username = ?');
      values.push(updates.username);
    }
    if (updates.password !== undefined) {
      fields.push('password = ?');
      values.push(updates.password);
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

