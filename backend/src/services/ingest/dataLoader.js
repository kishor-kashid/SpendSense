/**
 * Data Loader for SpendSense
 * Loads synthetic data from JSON files into the database
 */

const fs = require('fs');
const path = require('path');
const { User, Account, Transaction, Liability } = require('../../models');
const { validateAllData } = require('./dataValidator');

/**
 * Load data from JSON file
 */
function loadJSONFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Failed to load JSON file ${filePath}: ${error.message}`);
  }
}

/**
 * Load all data from JSON files
 */
function loadDataFromFiles(dataDir) {
  const syntheticDir = path.join(dataDir, 'synthetic');

  return {
    users: loadJSONFile(path.join(syntheticDir, 'users.json')),
    accounts: loadJSONFile(path.join(syntheticDir, 'accounts.json')),
    transactions: loadJSONFile(path.join(syntheticDir, 'transactions.json')),
    liabilities: loadJSONFile(path.join(syntheticDir, 'liabilities.json'))
  };
}

/**
 * Load users into database
 */
function loadUsers(users) {
  const loaded = [];
  const errors = [];

  users.forEach((user, index) => {
    try {
      // Remove user_id from data since it's auto-incremented
      const { user_id, ...userData } = user;
      
      // Check if user already exists by username
      const { getDatabase } = require('../../config/database');
      const db = getDatabase();
      const existing = db.prepare('SELECT user_id FROM users WHERE username = ?').get(userData.username);
      
      if (existing) {
        // User already exists, skip or update
        loaded.push(existing);
        return;
      }
      
      const created = User.create(userData);
      loaded.push(created);
    } catch (error) {
      const errorMsg = `User ${index} (${user.username || user.name}): ${error.message}`;
      errors.push(errorMsg);
      // Log first few errors for debugging
      if (errors.length <= 5) {
        console.error(`  Error details:`, errorMsg);
      }
    }
  });

  return { loaded, errors };
}

/**
 * Load accounts into database
 */
function loadAccounts(accounts, userMapping) {
  const loaded = [];
  const errors = [];
  const accountMapping = {}; // Map original account_id to loaded account_id

  accounts.forEach((account, index) => {
    try {
      // Map old user_id to new database user_id
      const oldUserId = account.user_id;
      const newUserId = userMapping[oldUserId];

      if (!newUserId) {
        errors.push(`Account ${index}: User ${oldUserId} not found in mapping`);
        return;
      }

      const originalAccountId = account.account_id;
      
      // Check if account already exists
      const { getDatabase } = require('../../config/database');
      const db = getDatabase();
      const existing = db.prepare('SELECT account_id FROM accounts WHERE account_id = ?').get(originalAccountId);
      
      if (existing) {
        // Account already exists, use it
        accountMapping[originalAccountId] = originalAccountId;
        loaded.push(existing);
        return;
      }

      const accountData = {
        ...account,
        user_id: newUserId
      };

      const created = Account.create(accountData);
      if (created && created.account_id) {
        loaded.push(created);
        // Store mapping: account_id should be the same (TEXT PRIMARY KEY)
        accountMapping[originalAccountId] = created.account_id;
      } else {
        errors.push(`Account ${index}: Failed to create account ${originalAccountId}`);
      }
    } catch (error) {
      errors.push(`Account ${index} (${account.account_id}): ${error.message}`);
      // Log first few errors for debugging
      if (errors.length <= 5) {
        console.error(`Account error details:`, error);
      }
    }
  });

  return { loaded, errors, accountMapping };
}

/**
 * Load transactions into database
 */
function loadTransactions(transactions, accountMapping) {
  const loaded = [];
  const errors = [];
  let skipped = 0;
  let duplicates = 0;

  // Get ALL account IDs from database (this is the source of truth)
  const { getDatabase } = require('../../config/database');
  const db = getDatabase();
  const allAccounts = db.prepare('SELECT account_id FROM accounts').all();
  const dbAccountIds = new Set(allAccounts.map(acc => acc.account_id));
  
  // Also include account IDs from mapping (for newly created accounts)
  const validAccountIds = new Set(Object.keys(accountMapping));
  
  // Combine both sets - database is source of truth
  const allValidAccountIds = new Set([...dbAccountIds, ...validAccountIds]);
  
  console.log(`  Database has ${dbAccountIds.size} accounts`);
  console.log(`  Mapping has ${validAccountIds.size} accounts`);
  console.log(`  Total valid account IDs: ${allValidAccountIds.size}`);

  // Prepare statements for better performance
  const checkExistingStmt = db.prepare('SELECT transaction_id FROM transactions WHERE transaction_id = ?');

  transactions.forEach((transaction, index) => {
    try {
      const accountId = transaction.account_id;
      
      // Fast check: skip if account doesn't exist
      if (!allValidAccountIds.has(accountId)) {
        skipped++;
        // Only log first few for debugging
        if (skipped <= 5) {
          errors.push(`Transaction ${index}: Account ${accountId} not found`);
        }
        return;
      }

      // Check if transaction already exists (prevent duplicates on re-run)
      const existing = checkExistingStmt.get(transaction.transaction_id);
      if (existing) {
        duplicates++;
        // Skip duplicate transactions silently
        return;
      }

      const created = Transaction.create(transaction);
      if (created) {
        loaded.push(created);
      }
    } catch (error) {
      // Log actual database errors
      errors.push(`Transaction ${index}: ${error.message}`);
      // Only keep first 20 errors to avoid memory issues
      if (errors.length >= 20) {
        return;
      }
    }
  });

  if (skipped > 0 && errors.length < 20) {
    errors.push(`... and ${skipped - Math.min(skipped, 5)} more transactions skipped due to missing accounts`);
  }

  if (duplicates > 0) {
    console.log(`  Skipped ${duplicates} duplicate transactions (already exist in database)`);
  }

  return { loaded, errors, skipped, duplicates };
}

/**
 * Load liabilities into database
 */
function loadLiabilities(liabilities) {
  const loaded = [];
  const errors = [];

  liabilities.forEach((liability, index) => {
    try {
      const created = Liability.create(liability);
      loaded.push(created);
    } catch (error) {
      errors.push(`Liability ${index}: ${error.message}`);
    }
  });

  return { loaded, errors };
}

/**
 * Load all data into database
 */
function loadAllData(data, options = {}) {
  const { validate = true, clearExisting = false } = options;

  // Validate data if requested
  if (validate) {
    console.log('Validating data...');
    const validation = validateAllData(data);
    if (!validation.valid) {
      console.error('Data validation failed:');
      Object.keys(validation.results).forEach(key => {
        if (!validation.results[key].valid) {
          console.error(`${key}: ${validation.results[key].errors.length} errors`);
          if (validation.results[key].errors.length <= 10) {
            validation.results[key].errors.forEach(err => console.error(`  - ${err}`));
          }
        }
      });
      throw new Error('Data validation failed. Please fix errors before loading.');
    }
    console.log('Data validation passed ✓');
  }

  // Clear existing data if requested
  if (clearExisting) {
    console.log('Clearing existing data...');
    // Note: This would require implementing clear methods in models
    // For now, we'll skip this or handle it manually
  }

  console.log('Loading users...');
  const userResults = loadUsers(data.users);
  console.log(`Loaded ${userResults.loaded.length} users`);
  if (userResults.errors.length > 0) {
    console.warn(`User errors: ${userResults.errors.length}`);
  }

  // Create user ID mapping (old user_id -> new database user_id)
  // Optimized: Use Map for O(1) lookups instead of O(n) find()
  const { getDatabase } = require('../../config/database');
  const db = getDatabase();
  
  // Build username to user_id map from loaded results for O(1) lookup
  const usernameToUserId = new Map();
  userResults.loaded.forEach(u => {
    if (u.username) {
      usernameToUserId.set(u.username, u.user_id);
    }
  });
  
  const userMapping = {};
  const getUserStmt = db.prepare('SELECT user_id FROM users WHERE username = ?');
  
  data.users.forEach((user) => {
    // First check loaded results (O(1) lookup)
    const userId = usernameToUserId.get(user.username);
    if (userId) {
      userMapping[user.user_id] = userId;
    } else {
      // If not found in loaded, check database directly (might be existing user)
      const existingUser = getUserStmt.get(user.username);
      if (existingUser) {
        userMapping[user.user_id] = existingUser.user_id;
      }
    }
  });

  console.log(`User mapping created: ${Object.keys(userMapping).length} mappings`);
  
  // Debug: Check for unmapped users
  const unmappedUsers = data.users.filter(u => !userMapping[u.user_id]);
  if (unmappedUsers.length > 0) {
    console.warn(`⚠️  ${unmappedUsers.length} users could not be mapped (will cause account loading issues)`);
  }

  console.log('Loading accounts...');
  const accountResults = loadAccounts(data.accounts, userMapping);
  let accountMapping = accountResults.accountMapping || {};
  
  // FIX: Include ALL existing accounts from database in the mapping
  // This ensures transactions can reference accounts from previous data loads
  const allAccounts = db.prepare('SELECT account_id FROM accounts').all();
  allAccounts.forEach(acc => {
    if (!accountMapping[acc.account_id]) {
      accountMapping[acc.account_id] = acc.account_id; // Account ID is its own key
    }
  });
  
  console.log(`Loaded ${accountResults.loaded.length} accounts`);
  console.log(`Account mapping size: ${Object.keys(accountMapping).length} (includes ${allAccounts.length} total accounts from database)`);
  if (accountResults.errors.length > 0) {
    console.warn(`Account errors: ${accountResults.errors.length}`);
    if (accountResults.errors.length <= 5) {
      accountResults.errors.forEach(err => console.warn(`  - ${err}`));
    }
  }

  // Debug: Check what account IDs transactions are referencing
  const transactionAccountIds = [...new Set(data.transactions.map(t => t.account_id))];
  const validAccountIds = Object.keys(accountMapping);
  const missingAccountIds = transactionAccountIds.filter(id => !accountMapping[id]);
  
  if (missingAccountIds.length > 0) {
    console.warn(`\n⚠️  Found ${missingAccountIds.length} account IDs in transactions that don't exist in loaded accounts`);
    console.warn(`First 10 missing account IDs: ${missingAccountIds.slice(0, 10).join(', ')}`);
    console.warn(`Total transaction account IDs: ${transactionAccountIds.length}`);
    console.warn(`Valid account IDs in mapping: ${validAccountIds.length}`);
  }

  console.log(`\nLoading transactions (${data.transactions.length} total)...`);
  const transactionResults = loadTransactions(data.transactions, accountMapping);
  console.log(`Loaded ${transactionResults.loaded.length} transactions`);
  if (transactionResults.duplicates > 0) {
    console.warn(`⚠️  Skipped ${transactionResults.duplicates} duplicate transactions (already exist in database)`);
    console.warn(`   Tip: Clear database first if you want to regenerate all data.`);
  }
  if (transactionResults.skipped > 0) {
    console.warn(`Skipped ${transactionResults.skipped} transactions (missing accounts)`);
  }
  if (transactionResults.errors.length > 0) {
    console.warn(`Transaction errors: ${Math.min(transactionResults.errors.length, 20)} (showing first 20)`);
    if (transactionResults.errors.length <= 20) {
      transactionResults.errors.forEach(err => console.warn(`  - ${err}`));
    }
  }

  console.log('Loading liabilities...');
  const liabilityResults = loadLiabilities(data.liabilities);
  console.log(`Loaded ${liabilityResults.loaded.length} liabilities`);
  if (liabilityResults.errors.length > 0) {
    console.warn(`Liability errors: ${liabilityResults.errors.length}`);
  }

  return {
    users: userResults,
    accounts: accountResults,
    transactions: transactionResults,
    liabilities: liabilityResults
  };
}

/**
 * Generate and load data in one step
 */
function generateAndLoad(userCount = 75, daysOfHistory = 120, dataDir = null) {
  const { generateAllData, exportToJSON } = require('./dataGenerator');
  const path = require('path');

  // Determine data directory
  if (!dataDir) {
    dataDir = path.join(__dirname, '../../../data');
  }

  console.log(`Generating synthetic data for ${userCount} users...`);
  const data = generateAllData(userCount, daysOfHistory);

  console.log(`Exporting data to JSON files...`);
  exportToJSON(data, dataDir);

  console.log(`Loading data into database...`);
  const results = loadAllData(data, { validate: true });

  return results;
}

module.exports = {
  loadDataFromFiles,
  loadAllData,
  loadUsers,
  loadAccounts,
  loadTransactions,
  loadLiabilities,
  generateAndLoad
};

