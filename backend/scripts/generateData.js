#!/usr/bin/env node

/**
 * CLI script to generate and load synthetic data
 * Usage: node scripts/generateData.js [userCount] [daysOfHistory]
 */

require('dotenv').config();
const { initializeDatabase } = require('../src/config/database');
const { generateAndLoad } = require('../src/services/ingest/dataLoader');
const { DATA_GENERATION } = require('../src/config/constants');

async function main() {
  // Parse command line arguments
  const userCount = parseInt(process.argv[2]) || DATA_GENERATION.DEFAULT_USER_COUNT;
  const daysOfHistory = parseInt(process.argv[3]) || DATA_GENERATION.DEFAULT_DAYS_HISTORY;

  // Validate inputs
  if (userCount < DATA_GENERATION.MIN_USER_COUNT || userCount > DATA_GENERATION.MAX_USER_COUNT) {
    console.error(`User count must be between ${DATA_GENERATION.MIN_USER_COUNT} and ${DATA_GENERATION.MAX_USER_COUNT}`);
    process.exit(1);
  }

  if (daysOfHistory < DATA_GENERATION.MIN_DAYS_HISTORY || daysOfHistory > DATA_GENERATION.MAX_DAYS_HISTORY) {
    console.error(`Days of history must be between ${DATA_GENERATION.MIN_DAYS_HISTORY} and ${DATA_GENERATION.MAX_DAYS_HISTORY}`);
    process.exit(1);
  }

  try {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialized ✓\n');

    console.log(`Generating data for ${userCount} users with ${daysOfHistory} days of history...\n`);
    const results = generateAndLoad(userCount, daysOfHistory);

    console.log('\n✅ Data generation and loading completed!');
    console.log(`\nSummary:`);
    console.log(`- Users loaded: ${results.users.loaded.length}`);
    console.log(`- Accounts loaded: ${results.accounts.loaded.length}`);
    console.log(`- Transactions loaded: ${results.transactions.loaded.length}`);
    console.log(`- Liabilities loaded: ${results.liabilities.loaded.length}`);

    if (results.users.errors.length > 0) {
      console.warn(`\n⚠️  User errors: ${results.users.errors.length}`);
    }
    if (results.accounts.errors.length > 0) {
      console.warn(`⚠️  Account errors: ${results.accounts.errors.length}`);
    }
    if (results.transactions.errors.length > 0) {
      console.warn(`⚠️  Transaction errors: ${results.transactions.errors.length}`);
    }
    if (results.liabilities.errors.length > 0) {
      console.warn(`⚠️  Liability errors: ${results.liabilities.errors.length}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

