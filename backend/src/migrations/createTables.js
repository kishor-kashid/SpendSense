const { getDatabase } = require('../config/database');

/**
 * Create all database tables
 * This migration should be run once to set up the database schema
 */
function createTables() {
  const db = getDatabase();

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Check if users table exists and has old schema (missing username/password)
  const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
  
  if (tableInfo) {
    const columns = db.prepare("PRAGMA table_info(users)").all();
    const hasUsername = columns.some(col => col.name === 'username');
    const hasPassword = columns.some(col => col.name === 'password');
    
    if (!hasUsername || !hasPassword) {
      console.log('Detected old users table schema. Dropping and recreating all tables with new schema...');
      // Drop all tables in correct order (respecting foreign keys)
      db.exec('PRAGMA foreign_keys = OFF');
      db.exec('DROP TABLE IF EXISTS recommendation_reviews');
      db.exec('DROP TABLE IF EXISTS feedback');
      db.exec('DROP TABLE IF EXISTS consent');
      db.exec('DROP TABLE IF EXISTS liabilities');
      db.exec('DROP TABLE IF EXISTS transactions');
      db.exec('DROP TABLE IF EXISTS accounts');
      db.exec('DROP TABLE IF EXISTS users');
      db.exec('PRAGMA foreign_keys = ON');
    }
  }

  // Create users table with new schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      consent_status TEXT NOT NULL DEFAULT 'revoked' CHECK(consent_status IN ('granted', 'revoked')),
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

  // Create feedback table
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      recommendation_id TEXT,
      recommendation_type TEXT CHECK(recommendation_type IN ('education', 'offer')),
      rating INTEGER CHECK(rating IN (1, 2, 3, 4, 5)),
      comment TEXT,
      helpful INTEGER CHECK(helpful IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )
  `);

  // Create recommendation_reviews table
  db.exec(`
    CREATE TABLE IF NOT EXISTS recommendation_reviews (
      review_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      recommendation_data TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'overridden')),
      operator_notes TEXT,
      decision_trace TEXT,
      flagged INTEGER NOT NULL DEFAULT 0 CHECK(flagged IN (0, 1)),
      flag_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      reviewed_at TEXT,
      reviewed_by TEXT,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )
  `);

  // Check if recommendation_reviews table exists and has flagged column
  const reviewsTableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='recommendation_reviews'").get();
  if (reviewsTableInfo) {
    const reviewsColumns = db.prepare("PRAGMA table_info(recommendation_reviews)").all();
    const hasFlagged = reviewsColumns.some(col => col.name === 'flagged');
    const hasFlagReason = reviewsColumns.some(col => col.name === 'flag_reason');
    
    if (!hasFlagged) {
      console.log('Adding flagged column to recommendation_reviews table...');
      // SQLite doesn't support CHECK constraints in ALTER TABLE, so we add it without the constraint
      // The constraint will be enforced on new tables
      db.exec('ALTER TABLE recommendation_reviews ADD COLUMN flagged INTEGER NOT NULL DEFAULT 0');
    }
    
    if (!hasFlagReason) {
      console.log('Adding flag_reason column to recommendation_reviews table...');
      db.exec('ALTER TABLE recommendation_reviews ADD COLUMN flag_reason TEXT');
    }
  }

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
    CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
    CREATE INDEX IF NOT EXISTS idx_accounts_user_type ON accounts(user_id, type);
    CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant_name);
    CREATE INDEX IF NOT EXISTS idx_transactions_pending ON transactions(pending);
    CREATE INDEX IF NOT EXISTS idx_transactions_account_date ON transactions(account_id, date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(personal_finance_category_primary);
    CREATE INDEX IF NOT EXISTS idx_liabilities_account_id ON liabilities(account_id);
    CREATE INDEX IF NOT EXISTS idx_liabilities_overdue ON liabilities(is_overdue);
    CREATE INDEX IF NOT EXISTS idx_consent_user_id ON consent(user_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
    CREATE INDEX IF NOT EXISTS idx_recommendation_reviews_user_id ON recommendation_reviews(user_id);
    CREATE INDEX IF NOT EXISTS idx_recommendation_reviews_status ON recommendation_reviews(status);
    CREATE INDEX IF NOT EXISTS idx_recommendation_reviews_user_status ON recommendation_reviews(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_users_consent_status ON users(consent_status);
  `);

  console.log('Database tables created successfully');
}

/**
 * Drop all tables (use with caution - deletes all data)
 */
function dropTables() {
  const db = getDatabase();
  
  db.exec(`
    DROP TABLE IF EXISTS recommendation_reviews;
    DROP TABLE IF EXISTS feedback;
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

