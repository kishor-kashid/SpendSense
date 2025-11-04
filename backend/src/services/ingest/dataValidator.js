/**
 * Data Validator for SpendSense
 * Validates synthetic data against schema requirements
 */

/**
 * Validate user data
 */
function validateUser(user) {
  const errors = [];

  if (!user.name || typeof user.name !== 'string' || user.name.trim().length === 0) {
    errors.push('User name is required and must be a non-empty string');
  }

  if (user.consent_status && !['granted', 'revoked'].includes(user.consent_status)) {
    errors.push('consent_status must be one of: granted, revoked');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate account data
 */
function validateAccount(account) {
  const errors = [];

  if (!account.account_id || typeof account.account_id !== 'string') {
    errors.push('account_id is required and must be a string');
  }

  if (!account.user_id || typeof account.user_id !== 'number') {
    errors.push('user_id is required and must be a number');
  }

  if (!account.type || !['depository', 'credit', 'loan', 'investment', 'other'].includes(account.type)) {
    errors.push('type must be one of: depository, credit, loan, investment, other');
  }

  if (account.available_balance !== null && account.available_balance !== undefined) {
    if (typeof account.available_balance !== 'number') {
      errors.push('available_balance must be a number');
    }
  }

  if (account.current_balance !== null && account.current_balance !== undefined) {
    if (typeof account.current_balance !== 'number') {
      errors.push('current_balance must be a number');
    }
  }

  if (account.credit_limit !== null && account.credit_limit !== undefined) {
    if (typeof account.credit_limit !== 'number' || account.credit_limit < 0) {
      errors.push('credit_limit must be a non-negative number');
    }
  }

  if (!account.iso_currency_code || typeof account.iso_currency_code !== 'string') {
    errors.push('iso_currency_code is required and must be a string');
  }

  if (account.holder_category && !['consumer', 'business'].includes(account.holder_category)) {
    errors.push('holder_category must be one of: consumer, business');
  }

  // Business accounts should be excluded
  if (account.holder_category === 'business') {
    errors.push('Business accounts are not allowed');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate transaction data
 */
function validateTransaction(transaction) {
  const errors = [];

  if (!transaction.transaction_id || typeof transaction.transaction_id !== 'string') {
    errors.push('transaction_id is required and must be a string');
  }

  if (!transaction.account_id || typeof transaction.account_id !== 'string') {
    errors.push('account_id is required and must be a string');
  }

  if (!transaction.date || typeof transaction.date !== 'string') {
    errors.push('date is required and must be a string');
  } else {
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(transaction.date)) {
      errors.push('date must be in YYYY-MM-DD format');
    }
  }

  if (transaction.amount === null || transaction.amount === undefined || typeof transaction.amount !== 'number') {
    errors.push('amount is required and must be a number');
  }

  if (transaction.pending !== null && transaction.pending !== undefined) {
    if (typeof transaction.pending !== 'number' || ![0, 1].includes(transaction.pending)) {
      errors.push('pending must be 0 or 1');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate liability data
 */
function validateLiability(liability) {
  const errors = [];

  if (!liability.liability_id || typeof liability.liability_id !== 'string') {
    errors.push('liability_id is required and must be a string');
  }

  if (!liability.account_id || typeof liability.account_id !== 'string') {
    errors.push('account_id is required and must be a string');
  }

  if (liability.apr_percentage !== null && liability.apr_percentage !== undefined) {
    if (typeof liability.apr_percentage !== 'number' || liability.apr_percentage < 0 || liability.apr_percentage > 100) {
      errors.push('apr_percentage must be a number between 0 and 100');
    }
  }

  if (liability.interest_rate !== null && liability.interest_rate !== undefined) {
    if (typeof liability.interest_rate !== 'number' || liability.interest_rate < 0 || liability.interest_rate > 100) {
      errors.push('interest_rate must be a number between 0 and 100');
    }
  }

  if (liability.is_overdue !== null && liability.is_overdue !== undefined) {
    if (typeof liability.is_overdue !== 'number' || ![0, 1].includes(liability.is_overdue)) {
      errors.push('is_overdue must be 0 or 1');
    }
  }

  if (liability.next_payment_due_date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(liability.next_payment_due_date)) {
      errors.push('next_payment_due_date must be in YYYY-MM-DD format');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate all data
 */
function validateAllData(data) {
  const results = {
    users: { valid: true, errors: [], invalidCount: 0 },
    accounts: { valid: true, errors: [], invalidCount: 0 },
    transactions: { valid: true, errors: [], invalidCount: 0 },
    liabilities: { valid: true, errors: [], invalidCount: 0 }
  };

  // Validate users
  if (data.users && Array.isArray(data.users)) {
    data.users.forEach((user, index) => {
      const validation = validateUser(user);
      if (!validation.valid) {
        results.users.valid = false;
        results.users.errors.push(`User ${index}: ${validation.errors.join(', ')}`);
        results.users.invalidCount++;
      }
    });
  } else {
    results.users.valid = false;
    results.users.errors.push('Users array is missing or invalid');
  }

  // Validate accounts
  if (data.accounts && Array.isArray(data.accounts)) {
    data.accounts.forEach((account, index) => {
      const validation = validateAccount(account);
      if (!validation.valid) {
        results.accounts.valid = false;
        results.accounts.errors.push(`Account ${index}: ${validation.errors.join(', ')}`);
        results.accounts.invalidCount++;
      }
    });
  } else {
    results.accounts.valid = false;
    results.accounts.errors.push('Accounts array is missing or invalid');
  }

  // Validate transactions
  if (data.transactions && Array.isArray(data.transactions)) {
    data.transactions.forEach((transaction, index) => {
      const validation = validateTransaction(transaction);
      if (!validation.valid) {
        results.transactions.valid = false;
        results.transactions.errors.push(`Transaction ${index}: ${validation.errors.join(', ')}`);
        results.transactions.invalidCount++;
      }
    });
  } else {
    results.transactions.valid = false;
    results.transactions.errors.push('Transactions array is missing or invalid');
  }

  // Validate liabilities
  if (data.liabilities && Array.isArray(data.liabilities)) {
    data.liabilities.forEach((liability, index) => {
      const validation = validateLiability(liability);
      if (!validation.valid) {
        results.liabilities.valid = false;
        results.liabilities.errors.push(`Liability ${index}: ${validation.errors.join(', ')}`);
        results.liabilities.invalidCount++;
      }
    });
  } else {
    results.liabilities.valid = false;
    results.liabilities.errors.push('Liabilities array is missing or invalid');
  }

  const allValid = 
    results.users.valid &&
    results.accounts.valid &&
    results.transactions.valid &&
    results.liabilities.valid;

  return {
    valid: allValid,
    results
  };
}

module.exports = {
  validateUser,
  validateAccount,
  validateTransaction,
  validateLiability,
  validateAllData
};

