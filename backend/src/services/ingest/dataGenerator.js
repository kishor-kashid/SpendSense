/**
 * Synthetic Data Generator for SpendSense
 * Generates Plaid-style financial data for 50-100 users
 */

const fs = require('fs');
const path = require('path');

// Seed for deterministic generation
let seed = 12345;

// Simple seeded random number generator
function seededRandom() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

// Reset seed for consistent generation
function resetSeed(newSeed = 12345) {
  seed = newSeed;
}

// Fake names for users (no real PII)
const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
  'Sam', 'Cameron', 'Dakota', 'Skylar', 'Blake', 'Sage', 'River', 'Phoenix',
  'Jamie', 'Drew', 'Reese', 'Hayden', 'Parker', 'Finley', 'Rowan', 'Emery',
  'Quinn', 'Avery', 'Kai', 'Sage', 'Blake', 'Dakota', 'River', 'Phoenix',
  'Morgan', 'Riley', 'Casey', 'Jordan', 'Alex', 'Taylor', 'Cameron', 'Sam'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris',
  'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'King',
  'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams'
];

// Merchant names for transactions
const MERCHANTS = {
  subscriptions: [
    'Netflix', 'Spotify', 'Amazon Prime', 'Disney+', 'Hulu', 'Apple Music',
    'Adobe Creative Cloud', 'Microsoft 365', 'Gym Membership', 'Newsletter Subscription',
    'Dropbox', 'Canva Pro', 'YouTube Premium', 'Audible', 'LinkedIn Premium'
  ],
  grocery: [
    'Whole Foods', 'Trader Joe\'s', 'Kroger', 'Safeway', 'Walmart', 'Target',
    'Costco', 'Aldi', 'Publix', 'Stop & Shop', 'Giant', 'Food Lion'
  ],
  restaurants: [
    'Starbucks', 'McDonald\'s', 'Subway', 'Chipotle', 'Pizza Hut', 'Domino\'s',
    'Taco Bell', 'Burger King', 'Wendy\'s', 'Dunkin\' Donuts', 'Panera Bread',
    'Olive Garden', 'Applebees', 'Red Lobster', 'Local Restaurant'
  ],
  utilities: [
    'Electric Company', 'Water Department', 'Gas Company', 'Internet Provider',
    'Phone Company', 'Cable Company', 'Trash Service'
  ],
  retail: [
    'Amazon', 'Best Buy', 'Home Depot', 'Lowe\'s', 'Macy\'s', 'Nordstrom',
    'Gap', 'Old Navy', 'Nike', 'Adidas', 'Apple Store', 'Microsoft Store'
  ],
  transportation: [
    'Uber', 'Lyft', 'Gas Station', 'Shell', 'Exxon', 'BP', 'Chevron',
    'Public Transit', 'Parking Meter', 'Toll Road'
  ],
  healthcare: [
    'Pharmacy', 'CVS', 'Walgreens', 'Doctor Office', 'Hospital', 'Dentist',
    'Eye Doctor', 'Health Insurance'
  ],
  income: [
    'Payroll Deposit', 'Employer', 'Salary', 'Freelance Payment', 'Gig Payment'
  ]
};

// Finance categories (Plaid-style)
const FINANCE_CATEGORIES = {
  primary: [
    'GENERAL_MERCHANDISE', 'FOOD_AND_DRINK', 'HOME_IMPROVEMENT', 'GENERAL_SERVICES',
    'TRANSPORTATION', 'TRAVEL', 'RENT_AND_UTILITIES', 'GENERAL_TRANSFER_IN',
    'GENERAL_TRANSFER_OUT', 'FOOD_AND_DRINK', 'RECREATION', 'SERVICE'
  ],
  detailed: {
    'GENERAL_MERCHANDISE': ['ONLINE', 'DEPARTMENT_STORES', 'DISCOUNT_STORES'],
    'FOOD_AND_DRINK': ['GROCERIES', 'RESTAURANTS', 'FAST_FOOD'],
    'TRANSPORTATION': ['GAS_STATIONS', 'PUBLIC_TRANSPORTATION', 'RIDE_SHARING'],
    'RENT_AND_UTILITIES': ['RENT', 'UTILITIES', 'INTERNET_AND_CABLE']
  }
};

// Payment channels
const PAYMENT_CHANNELS = ['online', 'in store', 'other', 'atm'];

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}

/**
 * Generate a random float between min and max
 */
function randomFloat(min, max) {
  return seededRandom() * (max - min) + min;
}

/**
 * Select a random element from an array
 */
function randomChoice(array) {
  return array[randomInt(0, array.length - 1)];
}

/**
 * Generate a masked account number
 */
function generateAccountNumber(prefix) {
  const last4 = randomInt(1000, 9999);
  return `${prefix}****${last4}`;
}

/**
 * Generate a date string (YYYY-MM-DD)
 */
function generateDate(daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

/**
 * Generate a user ID
 */
function generateUserId(index) {
  return `user_${String(index + 1).padStart(3, '0')}`;
}

/**
 * Generate an account ID
 */
function generateAccountId(userIndex, accountIndex) {
  return `acc_${String(userIndex + 1).padStart(3, '0')}_${accountIndex}`;
}

/**
 * Generate a transaction ID
 */
function generateTransactionId(transactionIndex) {
  return `txn_${String(transactionIndex + 1).padStart(8, '0')}`;
}

/**
 * Generate a liability ID
 */
function generateLiabilityId(accountId) {
  return `liab_${accountId}`;
}

/**
 * Generate synthetic users
 */
function generateUsers(count = 75) {
  const users = [];
  resetSeed(12345); // Reset seed for consistency

  for (let i = 0; i < count; i++) {
    const firstName = randomChoice(FIRST_NAMES);
    const lastName = randomChoice(LAST_NAMES);
    const name = `${firstName} ${lastName}`;

    users.push({
      user_id: i + 1, // Will be auto-incremented by database
      name: name,
      consent_status: randomChoice(['pending', 'granted', 'revoked'])
    });
  }

  return users;
}

/**
 * Generate financial profile for a user (determines account types, balances, etc.)
 */
function generateFinancialProfile(userIndex, totalUsers) {
  // Distribute users across different financial profiles
  const profileType = userIndex % 5; // 5 different profile types

  let income, savingsRate, creditUtilization, subscriptionCount;

  switch (profileType) {
    case 0: // High Utilization User
      income = randomFloat(3000, 6000);
      savingsRate = randomFloat(0, 0.05); // 0-5% savings
      creditUtilization = randomFloat(0.6, 0.95); // 60-95% utilization
      subscriptionCount = randomInt(2, 4);
      break;
    case 1: // Variable Income Budgeter
      income = randomFloat(2000, 8000); // High variability
      savingsRate = randomFloat(0, 0.1); // 0-10% savings
      creditUtilization = randomFloat(0.2, 0.5);
      subscriptionCount = randomInt(1, 3);
      break;
    case 2: // Subscription-Heavy
      income = randomFloat(4000, 7000);
      savingsRate = randomFloat(0.05, 0.15);
      creditUtilization = randomFloat(0.2, 0.4);
      subscriptionCount = randomInt(5, 10); // 5-10 subscriptions
      break;
    case 3: // Savings Builder
      income = randomFloat(5000, 10000);
      savingsRate = randomFloat(0.15, 0.35); // 15-35% savings
      creditUtilization = randomFloat(0.05, 0.25); // Low utilization
      subscriptionCount = randomInt(1, 4);
      break;
    case 4: // New User
      income = randomFloat(2500, 5000);
      savingsRate = randomFloat(0, 0.1);
      creditUtilization = randomFloat(0, 0.3); // Low or no credit
      subscriptionCount = randomInt(0, 2);
      break;
    default:
      income = randomFloat(3000, 6000);
      savingsRate = randomFloat(0.05, 0.15);
      creditUtilization = randomFloat(0.3, 0.6);
      subscriptionCount = randomInt(2, 5);
  }

  return {
    income,
    savingsRate,
    creditUtilization,
    subscriptionCount,
    profileType
  };
}

/**
 * Generate accounts for a user
 */
function generateAccounts(userId, userIndex, profile) {
  const accounts = [];
  let accountIndex = 0;

  // Always create a checking account
  const checkingBalance = randomFloat(500, 5000);
  accounts.push({
    account_id: generateAccountId(userIndex, accountIndex++),
    user_id: userId,
    type: 'depository',
    subtype: 'checking',
    available_balance: checkingBalance,
    current_balance: checkingBalance,
    credit_limit: null,
    iso_currency_code: 'USD',
    holder_category: 'consumer'
  });

  // Create savings account (70% of users have one)
  if (randomFloat(0, 1) < 0.7) {
    const savingsBalance = profile.income * profile.savingsRate * randomFloat(1, 3);
    accounts.push({
      account_id: generateAccountId(userIndex, accountIndex++),
      user_id: userId,
      type: 'depository',
      subtype: 'savings',
      available_balance: savingsBalance,
      current_balance: savingsBalance,
      credit_limit: null,
      iso_currency_code: 'USD',
      holder_category: 'consumer'
    });
  }

  // Create credit card (80% of users have one)
  if (randomFloat(0, 1) < 0.8) {
    const creditLimit = randomFloat(1000, 10000);
    const currentBalance = creditLimit * profile.creditUtilization;
    accounts.push({
      account_id: generateAccountId(userIndex, accountIndex++),
      user_id: userId,
      type: 'credit',
      subtype: 'credit card',
      available_balance: creditLimit - currentBalance,
      current_balance: -currentBalance, // Negative for credit
      credit_limit: creditLimit,
      iso_currency_code: 'USD',
      holder_category: 'consumer'
    });
  }

  // Some users have additional accounts (20% chance)
  if (randomFloat(0, 1) < 0.2) {
    const additionalTypes = [
      { type: 'depository', subtype: 'money market' },
      { type: 'depository', subtype: 'hsa' }
    ];
    const additional = randomChoice(additionalTypes);
    accounts.push({
      account_id: generateAccountId(userIndex, accountIndex++),
      user_id: userId,
      type: additional.type,
      subtype: additional.subtype,
      available_balance: randomFloat(1000, 5000),
      current_balance: randomFloat(1000, 5000),
      credit_limit: null,
      iso_currency_code: 'USD',
      holder_category: 'consumer'
    });
  }

  return accounts;
}

/**
 * Generate transactions for an account
 */
function generateTransactions(account, userIndex, profile, daysOfHistory = 120, startTransactionIndex = 0) {
  const transactions = [];
  const accountId = account.account_id;
  const accountType = account.type;
  const isCredit = accountType === 'credit';
  let transactionIndex = startTransactionIndex;

  // Generate transactions for the past N days
  for (let day = 0; day < daysOfHistory; day++) {
    const date = generateDate(day);

    // Skip some days (not every day has transactions)
    if (randomFloat(0, 1) < 0.3) continue; // 30% chance of no transaction

    // Income transactions (payroll deposits)
    if (!isCredit && day % randomInt(14, 16) === 0) { // Every ~2 weeks
      const incomeAmount = profile.income * randomFloat(0.9, 1.1);
      transactions.push({
        transaction_id: generateTransactionId(transactionIndex++),
        account_id: accountId,
        date: date,
        amount: incomeAmount,
        merchant_name: randomChoice(MERCHANTS.income),
        merchant_entity_id: null,
        payment_channel: 'other',
        personal_finance_category_primary: 'GENERAL_TRANSFER_IN',
        personal_finance_category_detailed: 'PAYROLL',
        pending: 0
      });
    }

    // Expense transactions
    if (randomFloat(0, 1) < 0.4) { // 40% chance of expense on this day
      let category, merchant, amount;

      // Subscription transactions (based on profile)
      if (profile.subscriptionCount > 0 && randomFloat(0, 1) < 0.1) {
        category = 'GENERAL_SERVICES';
        merchant = randomChoice(MERCHANTS.subscriptions);
        amount = randomFloat(5, 30);
      } else {
        // Regular expenses
        const expenseType = randomChoice(['grocery', 'restaurants', 'retail', 'transportation', 'utilities']);
        switch (expenseType) {
          case 'grocery':
            category = 'FOOD_AND_DRINK';
            merchant = randomChoice(MERCHANTS.grocery);
            amount = randomFloat(30, 150);
            break;
          case 'restaurants':
            category = 'FOOD_AND_DRINK';
            merchant = randomChoice(MERCHANTS.restaurants);
            amount = randomFloat(10, 80);
            break;
          case 'retail':
            category = 'GENERAL_MERCHANDISE';
            merchant = randomChoice(MERCHANTS.retail);
            amount = randomFloat(20, 200);
            break;
          case 'transportation':
            category = 'TRANSPORTATION';
            merchant = randomChoice(MERCHANTS.transportation);
            amount = randomFloat(15, 100);
            break;
          case 'utilities':
            category = 'RENT_AND_UTILITIES';
            merchant = randomChoice(MERCHANTS.utilities);
            amount = randomFloat(50, 300);
            break;
          default:
            category = 'GENERAL_MERCHANDISE';
            merchant = 'Other Merchant';
            amount = randomFloat(10, 100);
        }
      }

      // For credit cards, amount is negative (debit)
      const transactionAmount = isCredit ? -Math.abs(amount) : -Math.abs(amount);

      transactions.push({
        transaction_id: generateTransactionId(transactionIndex++),
        account_id: accountId,
        date: date,
        amount: transactionAmount,
        merchant_name: merchant,
        merchant_entity_id: null,
        payment_channel: randomChoice(PAYMENT_CHANNELS),
        personal_finance_category_primary: category,
        personal_finance_category_detailed: randomChoice(FINANCE_CATEGORIES.detailed[category] || ['OTHER']),
        pending: randomFloat(0, 1) < 0.1 ? 1 : 0 // 10% pending
      });
    }
  }

  return transactions;
}

/**
 * Generate liabilities for credit accounts
 */
function generateLiabilities(account, userIndex, profile) {
  if (account.type !== 'credit') return null;

  const creditLimit = account.credit_limit;
  const currentBalance = Math.abs(account.current_balance);
  const utilization = currentBalance / creditLimit;

  const isOverdue = utilization > 0.8 && randomFloat(0, 1) < 0.2; // 20% chance if high utilization
  const minimumPayment = Math.max(25, currentBalance * 0.02); // 2% or $25, whichever is higher

  // Calculate next payment due date (30 days from now)
  const nextPaymentDate = new Date();
  nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);

  return {
    liability_id: generateLiabilityId(account.account_id),
    account_id: account.account_id,
    apr_type: 'purchase',
    apr_percentage: randomFloat(15, 25), // 15-25% APR
    interest_rate: null,
    minimum_payment_amount: minimumPayment,
    last_payment_amount: randomFloat(minimumPayment * 0.8, minimumPayment * 1.2),
    is_overdue: isOverdue ? 1 : 0,
    next_payment_due_date: nextPaymentDate.toISOString().split('T')[0],
    last_statement_balance: currentBalance
  };
}

/**
 * Generate all synthetic data
 */
function generateAllData(userCount = 75, daysOfHistory = 120) {
  resetSeed(12345); // Reset for consistency

  const users = generateUsers(userCount);
  const accounts = [];
  const transactions = [];
  const liabilities = [];
  let globalTransactionIndex = 0; // Global counter to ensure unique transaction IDs

  users.forEach((user, userIndex) => {
    const profile = generateFinancialProfile(userIndex, userCount);
    const userAccounts = generateAccounts(user.user_id, userIndex, profile);

    userAccounts.forEach(account => {
      accounts.push(account);
      const accountTransactions = generateTransactions(account, userIndex, profile, daysOfHistory, globalTransactionIndex);
      // Update global counter
      globalTransactionIndex += accountTransactions.length;
      transactions.push(...accountTransactions);

      // Generate liability for credit accounts
      if (account.type === 'credit') {
        const liability = generateLiabilities(account, userIndex, profile);
        if (liability) liabilities.push(liability);
      }
    });
  });

  return {
    users,
    accounts,
    transactions,
    liabilities
  };
}

/**
 * Export data to JSON files
 */
function exportToJSON(data, outputDir) {
  const outputPath = path.join(outputDir, 'synthetic');
  
  // Ensure directory exists
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  // Write each data type to a JSON file
  fs.writeFileSync(
    path.join(outputPath, 'users.json'),
    JSON.stringify(data.users, null, 2)
  );

  fs.writeFileSync(
    path.join(outputPath, 'accounts.json'),
    JSON.stringify(data.accounts, null, 2)
  );

  fs.writeFileSync(
    path.join(outputPath, 'transactions.json'),
    JSON.stringify(data.transactions, null, 2)
  );

  fs.writeFileSync(
    path.join(outputPath, 'liabilities.json'),
    JSON.stringify(data.liabilities, null, 2)
  );

  console.log(`Data exported to ${outputPath}`);
  console.log(`- Users: ${data.users.length}`);
  console.log(`- Accounts: ${data.accounts.length}`);
  console.log(`- Transactions: ${data.transactions.length}`);
  console.log(`- Liabilities: ${data.liabilities.length}`);
}

module.exports = {
  generateAllData,
  exportToJSON,
  generateUsers,
  generateAccounts,
  generateTransactions,
  generateLiabilities,
  resetSeed
};

