const { getDatabase } = require('../config/database');

/**
 * Liability Model
 * Represents credit card, mortgage, or loan liabilities
 */
class Liability {
  /**
   * Create a new liability
   * @param {Object} liabilityData - Liability data
   * @returns {Object} Created liability
   */
  static create(liabilityData) {
    const db = getDatabase();
    const {
      liability_id,
      account_id,
      apr_type,
      apr_percentage,
      interest_rate,
      minimum_payment_amount,
      last_payment_amount,
      is_overdue,
      next_payment_due_date,
      last_statement_balance
    } = liabilityData;

    const stmt = db.prepare(`
      INSERT INTO liabilities (
        liability_id, account_id, apr_type, apr_percentage, interest_rate,
        minimum_payment_amount, last_payment_amount, is_overdue,
        next_payment_due_date, last_statement_balance, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    const result = stmt.run(
      liability_id,
      account_id,
      apr_type || null,
      apr_percentage || null,
      interest_rate || null,
      minimum_payment_amount || null,
      last_payment_amount || null,
      is_overdue ? 1 : 0,
      next_payment_due_date || null,
      last_statement_balance || null
    );

    return this.findById(liability_id);
  }

  /**
   * Find liability by ID
   * @param {string} liabilityId - Liability ID
   * @returns {Object|null} Liability object or null
   */
  static findById(liabilityId) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM liabilities WHERE liability_id = ?').get(liabilityId);
  }

  /**
   * Find liability by account ID
   * @param {string} accountId - Account ID
   * @returns {Object|null} Liability object or null
   */
  static findByAccountId(accountId) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM liabilities WHERE account_id = ?').get(accountId);
  }

  /**
   * Find all liabilities for a user
   * @param {number} userId - User ID
   * @returns {Array} Array of liability objects
   */
  static findByUserId(userId) {
    const db = getDatabase();
    return db.prepare(`
      SELECT l.* FROM liabilities l
      INNER JOIN accounts a ON l.account_id = a.account_id
      WHERE a.user_id = ?
      ORDER BY l.created_at
    `).all(userId);
  }

  /**
   * Find credit card liabilities for a user
   * @param {number} userId - User ID
   * @returns {Array} Array of credit card liability objects
   */
  static findCreditCards(userId) {
    const db = getDatabase();
    return db.prepare(`
      SELECT l.* FROM liabilities l
      INNER JOIN accounts a ON l.account_id = a.account_id
      WHERE a.user_id = ? AND a.type = 'credit'
      ORDER BY l.created_at
    `).all(userId);
  }

  /**
   * Find overdue liabilities
   * @param {number} userId - User ID
   * @returns {Array} Array of overdue liability objects
   */
  static findOverdue(userId) {
    const db = getDatabase();
    return db.prepare(`
      SELECT l.* FROM liabilities l
      INNER JOIN accounts a ON l.account_id = a.account_id
      WHERE a.user_id = ? AND l.is_overdue = 1
      ORDER BY l.next_payment_due_date
    `).all(userId);
  }

  /**
   * Update liability
   * @param {string} liabilityId - Liability ID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated liability or null
   */
  static update(liabilityId, updates) {
    const db = getDatabase();
    const fields = [];
    const values = [];

    if (updates.minimum_payment_amount !== undefined) {
      fields.push('minimum_payment_amount = ?');
      values.push(updates.minimum_payment_amount);
    }
    if (updates.last_payment_amount !== undefined) {
      fields.push('last_payment_amount = ?');
      values.push(updates.last_payment_amount);
    }
    if (updates.is_overdue !== undefined) {
      fields.push('is_overdue = ?');
      values.push(updates.is_overdue ? 1 : 0);
    }
    if (updates.last_statement_balance !== undefined) {
      fields.push('last_statement_balance = ?');
      values.push(updates.last_statement_balance);
    }
    if (updates.next_payment_due_date !== undefined) {
      fields.push('next_payment_due_date = ?');
      values.push(updates.next_payment_due_date);
    }

    if (fields.length === 0) return this.findById(liabilityId);

    values.push(liabilityId);
    const sql = `UPDATE liabilities SET ${fields.join(', ')} WHERE liability_id = ?`;
    db.prepare(sql).run(...values);

    return this.findById(liabilityId);
  }
}

module.exports = Liability;

