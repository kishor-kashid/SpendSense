const { getDatabase } = require('../config/database');

/**
 * Account Model
 * Represents a financial account (checking, savings, credit card, etc.)
 */
class Account {
  /**
   * Create a new account
   * @param {Object} accountData - Account data
   * @returns {Object} Created account
   */
  static create(accountData) {
    const db = getDatabase();
    const {
      account_id,
      user_id,
      type,
      subtype,
      available_balance,
      current_balance,
      credit_limit,
      iso_currency_code,
      holder_category
    } = accountData;

    const stmt = db.prepare(`
      INSERT INTO accounts (
        account_id, user_id, type, subtype,
        available_balance, current_balance, credit_limit,
        iso_currency_code, holder_category, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    const result = stmt.run(
      account_id,
      user_id,
      type,
      subtype,
      available_balance || null,
      current_balance || null,
      credit_limit || null,
      iso_currency_code || 'USD',
      holder_category || 'consumer'
    );

    return this.findById(account_id);
  }

  /**
   * Find account by ID
   * @param {string} accountId - Account ID
   * @returns {Object|null} Account object or null
   */
  static findById(accountId) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM accounts WHERE account_id = ?').get(accountId);
  }

  /**
   * Find all accounts for a user
   * @param {number} userId - User ID
   * @returns {Array} Array of account objects
   */
  static findByUserId(userId) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM accounts WHERE user_id = ? ORDER BY created_at').all(userId);
  }

  /**
   * Find accounts by type
   * @param {number} userId - User ID
   * @param {string} type - Account type (e.g., 'depository', 'credit')
   * @returns {Array} Array of account objects
   */
  static findByType(userId, type) {
    const db = getDatabase();
    return db.prepare(
      'SELECT * FROM accounts WHERE user_id = ? AND type = ? ORDER BY created_at'
    ).all(userId, type);
  }

  /**
   * Find savings-like accounts (savings, money market, HSA)
   * @param {number} userId - User ID
   * @returns {Array} Array of savings account objects
   */
  static findSavingsAccounts(userId) {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM accounts
      WHERE user_id = ?
      AND subtype IN ('savings', 'money market', 'hsa', 'cash management')
      ORDER BY created_at
    `).all(userId);
  }

  /**
   * Find credit card accounts
   * @param {number} userId - User ID
   * @returns {Array} Array of credit card account objects
   */
  static findCreditCards(userId) {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM accounts
      WHERE user_id = ? AND type = 'credit'
      ORDER BY created_at
    `).all(userId);
  }

  /**
   * Update account balances
   * @param {string} accountId - Account ID
   * @param {Object} updates - Balance updates
   * @returns {Object|null} Updated account or null
   */
  static update(accountId, updates) {
    const db = getDatabase();
    const fields = [];
    const values = [];

    if (updates.available_balance !== undefined) {
      fields.push('available_balance = ?');
      values.push(updates.available_balance);
    }
    if (updates.current_balance !== undefined) {
      fields.push('current_balance = ?');
      values.push(updates.current_balance);
    }
    if (updates.credit_limit !== undefined) {
      fields.push('credit_limit = ?');
      values.push(updates.credit_limit);
    }

    if (fields.length === 0) return this.findById(accountId);

    values.push(accountId);
    const sql = `UPDATE accounts SET ${fields.join(', ')} WHERE account_id = ?`;
    db.prepare(sql).run(...values);

    return this.findById(accountId);
  }
}

module.exports = Account;

