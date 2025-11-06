const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/database.sqlite');
const DATA_DIR = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db = null;

/**
 * Initialize database connection and run migrations
 * @returns {Promise<Database>}
 */
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    try {
      db = new Database(DB_PATH);
      db.pragma('foreign_keys = ON'); // Enable foreign key constraints
      console.log(`Connected to SQLite database at ${DB_PATH}`);
      
      // Run migrations to create tables
      const { createTables } = require('../migrations/createTables');
      createTables();
      
      // Run additional migrations (for existing databases)
      const { addAIConsentTable } = require('../migrations/addAIConsentTable');
      addAIConsentTable();
      
      // Analyze database to update statistics for query optimizer
      try {
        db.exec('ANALYZE');
        console.log('Database statistics updated for query optimization');
      } catch (error) {
        console.warn('Could not analyze database:', error.message);
      }
      
      resolve(db);
    } catch (error) {
      console.error('Database connection error:', error);
      reject(error);
    }
  });
}

/**
 * Get database instance
 * @returns {Database}
 */
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Close database connection
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase,
  DB_PATH
};

