const { getDatabase } = require('../config/database');

/**
 * Create all database tables
 * This migration should be run once to set up the database schema
 */
function createTables() {
  const db = getDatabase();

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      consent_status TEXT NOT NULL DEFAULT 'pending' CHECK(consent_status IN ('pending', 'granted', 'revoked')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create accounts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      account_id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('depository', 'credit', 'loan', 'investment', 'other')),
      subtype TEXT,
      available_balance REAL,
      current_balance REAL,
      credit_limit REAL,
      iso_currency_code TEXT NOT NULL DEFAULT 'USD',
      holder_category TEXT NOT NULL DEFAULT 'consumer' CHECK(holder_category IN ('consumer', 'business')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )
  `);

  // Create transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      transaction_id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      merchant_name TEXT,
      merchant_entity_id TEXT,
      payment_channel TEXT,
      personal_finance_category_primary TEXT,
      personal_finance_category_detailed TEXT,
      pending INTEGER NOT NULL DEFAULT 0 CHECK(pending IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
    )
  `);

  // Create liabilities table
  db.exec(`
    CREATE TABLE IF NOT EXISTS liabilities (
      liability_id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL UNIQUE,
      apr_type TEXT,
      apr_percentage REAL,
      interest_rate REAL,
      minimum_payment_amount REAL,
      last_payment_amount REAL,
      is_overdue INTEGER NOT NULL DEFAULT 0 CHECK(is_overdue IN (0, 1)),
      next_payment_due_date TEXT,
      last_statement_balance REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
    )
  `);

  // Create consent table
  db.exec(`
    CREATE TABLE IF NOT EXISTS consent (
      consent_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      opted_in INTEGER NOT NULL DEFAULT 0 CHECK(opted_in IN (0, 1)),
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
    CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant_name);
    CREATE INDEX IF NOT EXISTS idx_transactions_pending ON transactions(pending);
    CREATE INDEX IF NOT EXISTS idx_liabilities_account_id ON liabilities(account_id);
    CREATE INDEX IF NOT EXISTS idx_liabilities_overdue ON liabilities(is_overdue);
    CREATE INDEX IF NOT EXISTS idx_consent_user_id ON consent(user_id);
  `);

  console.log('Database tables created successfully');
}

/**
 * Drop all tables (use with caution - deletes all data)
 */
function dropTables() {
  const db = getDatabase();
  
  db.exec(`
    DROP TABLE IF EXISTS consent;
    DROP TABLE IF EXISTS liabilities;
    DROP TABLE IF EXISTS transactions;
    DROP TABLE IF EXISTS accounts;
    DROP TABLE IF EXISTS users;
  `);

  console.log('All tables dropped successfully');
}

module.exports = {
  createTables,
  dropTables
};

