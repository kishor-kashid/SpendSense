/**
 * Migration: Add AI Consent Table
 * Adds the ai_consent table to existing databases
 * This migration can be run safely on existing databases
 */

const { getDatabase } = require('../config/database');

/**
 * Add AI consent table if it doesn't exist
 */
function addAIConsentTable() {
  const db = getDatabase();
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Check if ai_consent table already exists
  const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ai_consent'").get();
  
  if (tableInfo) {
    console.log('AI consent table already exists, skipping migration');
    return;
  }
  
  // Create AI consent table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_consent (
      ai_consent_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      opted_in INTEGER NOT NULL DEFAULT 0 CHECK(opted_in IN (0, 1)),
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )
  `);
  
  // Create index for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_ai_consent_user_id ON ai_consent(user_id);
  `);
  
  console.log('AI consent table created successfully');
}

module.exports = {
  addAIConsentTable
};

