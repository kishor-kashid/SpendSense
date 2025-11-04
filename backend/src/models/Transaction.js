const { getDatabase } = require('../config/database');

/**
 * Transaction Model
 * Represents a financial transaction
 */
class Transaction {
  /**
   * Create a new transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Object} Created transaction
   */
  static create(transactionData) {
    const db = getDatabase();
    const {
      transaction_id,
      account_id,
      date,
      amount,
      merchant_name,
      merchant_entity_id,
      payment_channel,
      personal_finance_category_primary,
      personal_finance_category_detailed,
      pending
    } = transactionData;

    const stmt = db.prepare(`
      INSERT INTO transactions (
        transaction_id, account_id, date, amount,
        merchant_name, merchant_entity_id, payment_channel,
        personal_finance_category_primary, personal_finance_category_detailed,
        pending, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    const result = stmt.run(
      transaction_id,
      account_id,
      date,
      amount,
      merchant_name || null,
      merchant_entity_id || null,
      payment_channel || null,
      personal_finance_category_primary || null,
      personal_finance_category_detailed || null,
      pending ? 1 : 0
    );

    return this.findById(transaction_id);
  }

  /**
   * Find transaction by ID
   * @param {string} transactionId - Transaction ID
   * @returns {Object|null} Transaction object or null
   */
  static findById(transactionId) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM transactions WHERE transaction_id = ?').get(transactionId);
  }

  /**
   * Find transactions for an account
   * @param {string} accountId - Account ID
   * @param {Object} options - Query options
   * @param {string} options.startDate - Start date (YYYY-MM-DD)
   * @param {string} options.endDate - End date (YYYY-MM-DD)
   * @param {boolean} options.includePending - Include pending transactions
   * @returns {Array} Array of transaction objects
   */
  static findByAccountId(accountId, options = {}) {
    const db = getDatabase();
    let sql = 'SELECT * FROM transactions WHERE account_id = ?';
    const params = [accountId];

    if (options.startDate) {
      sql += ' AND date >= ?';
      params.push(options.startDate);
    }
    if (options.endDate) {
      sql += ' AND date <= ?';
      params.push(options.endDate);
    }
    if (options.includePending === false) {
      sql += ' AND pending = 0';
    }

    sql += ' ORDER BY date DESC, created_at DESC';
    return db.prepare(sql).all(...params);
  }

  /**
   * Find transactions for a user (across all accounts)
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Array} Array of transaction objects
   */
  static findByUserId(userId, options = {}) {
    const db = getDatabase();
    let sql = `
      SELECT t.* FROM transactions t
      INNER JOIN accounts a ON t.account_id = a.account_id
      WHERE a.user_id = ?
    `;
    const params = [userId];

    if (options.startDate) {
      sql += ' AND t.date >= ?';
      params.push(options.startDate);
    }
    if (options.endDate) {
      sql += ' AND t.date <= ?';
      params.push(options.endDate);
    }
    if (options.includePending === false) {
      sql += ' AND t.pending = 0';
    }

    sql += ' ORDER BY t.date DESC, t.created_at DESC';
    return db.prepare(sql).all(...params);
  }

  /**
   * Find transactions by merchant
   * @param {string} merchantName - Merchant name
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Array} Array of transaction objects
   */
  static findByMerchant(merchantName, userId, options = {}) {
    const db = getDatabase();
    let sql = `
      SELECT t.* FROM transactions t
      INNER JOIN accounts a ON t.account_id = a.account_id
      WHERE a.user_id = ? AND t.merchant_name = ?
    `;
    const params = [userId, merchantName];

    if (options.startDate) {
      sql += ' AND t.date >= ?';
      params.push(options.startDate);
    }
    if (options.endDate) {
      sql += ' AND t.date <= ?';
      params.push(options.endDate);
    }

    sql += ' ORDER BY t.date DESC';
    return db.prepare(sql).all(...params);
  }

  /**
   * Get transaction statistics for a user
   * @param {number} userId - User ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Object} Statistics object
   */
  static getStatistics(userId, startDate, endDate) {
    const db = getDatabase();
    const sql = `
      SELECT
        COUNT(*) as total_transactions,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_spend,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_income,
        AVG(amount) as avg_amount,
        MIN(amount) as min_amount,
        MAX(amount) as max_amount
      FROM transactions t
      INNER JOIN accounts a ON t.account_id = a.account_id
      WHERE a.user_id = ? AND t.date >= ? AND t.date <= ? AND t.pending = 0
    `;
    return db.prepare(sql).get(userId, startDate, endDate);
  }
}

module.exports = Transaction;

