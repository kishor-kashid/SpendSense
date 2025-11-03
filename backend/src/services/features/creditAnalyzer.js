/**
 * Credit Analysis Service
 * Analyzes credit card utilization, payment patterns, and overdue status
 */

const Account = require('../../models/Account');
const Liability = require('../../models/Liability');
const Transaction = require('../../models/Transaction');
const { CREDIT_THRESHOLDS } = require('../../config/constants');

/**
 * Calculate date range for a time window ending today
 * @param {number} days - Number of days in the window
 * @returns {Object} { startDate, endDate } in YYYY-MM-DD format
 */
function getDateRange(days) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

/**
 * Calculate credit utilization for a card
 * @param {Object} account - Account object with credit_limit
 * @param {Object} liability - Liability object with last_statement_balance
 * @returns {Object} Utilization analysis
 */
function calculateUtilization(account, liability) {
  const creditLimit = account.credit_limit || 0;
  const balance = liability?.last_statement_balance || account.current_balance || 0;

  if (creditLimit <= 0) {
    return {
      utilization: 0,
      balance: balance,
      limit: creditLimit,
      utilization_percentage: 0,
      utilization_level: 'none'
    };
  }

  const utilization = balance / creditLimit;
  const utilizationPercentage = utilization * 100;

  // Determine utilization level
  let utilizationLevel;
  if (utilization >= CREDIT_THRESHOLDS.HIGH_UTILIZATION) {
    utilizationLevel = 'high'; // ≥80%
  } else if (utilization >= CREDIT_THRESHOLDS.MEDIUM_UTILIZATION) {
    utilizationLevel = 'medium'; // ≥50%
  } else if (utilization >= CREDIT_THRESHOLDS.LOW_UTILIZATION) {
    utilizationLevel = 'low'; // ≥30%
  } else {
    utilizationLevel = 'excellent'; // <30%
  }

  return {
    utilization,
    balance,
    limit: creditLimit,
    utilization_percentage: Math.round(utilizationPercentage * 10) / 10,
    utilization_level: utilizationLevel,
    is_high_utilization: utilization >= CREDIT_THRESHOLDS.HIGH_UTILIZATION,
    is_medium_utilization: utilization >= CREDIT_THRESHOLDS.MEDIUM_UTILIZATION,
    is_low_utilization: utilization >= CREDIT_THRESHOLDS.LOW_UTILIZATION
  };
}

/**
 * Detect minimum-payment-only behavior
 * @param {Object} liability - Liability object
 * @returns {boolean} True if likely paying minimum only
 */
function detectMinimumPaymentOnly(liability) {
  if (!liability || !liability.minimum_payment_amount || !liability.last_payment_amount) {
    return false;
  }

  // If last payment is within 5% of minimum payment, likely minimum-only
  const tolerance = liability.minimum_payment_amount * 0.05;
  const diff = Math.abs(liability.last_payment_amount - liability.minimum_payment_amount);
  
  return diff <= tolerance && liability.last_payment_amount > 0;
}

/**
 * Detect interest charges from transactions
 * @param {number} userId - User ID
 * @param {string} accountId - Account ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Object} Interest charge analysis
 */
function detectInterestCharges(userId, accountId, startDate, endDate) {
  const transactions = Transaction.findByAccountId(accountId, {
    startDate,
    endDate,
    includePending: false
  });

  // Look for transactions with interest-related categories or merchant names
  const interestKeywords = ['interest', 'finance charge', 'apr', 'annual percentage'];
  const interestTransactions = transactions.filter(t => {
    const merchant = (t.merchant_name || '').toLowerCase();
    const category = (t.personal_finance_category_primary || '').toLowerCase();
    const detailedCategory = (t.personal_finance_category_detailed || '').toLowerCase();
    
    return interestKeywords.some(keyword => 
      merchant.includes(keyword) || 
      category.includes(keyword) || 
      detailedCategory.includes(keyword)
    ) && t.amount < 0; // Interest charges are expenses (negative)
  });

  const totalInterestCharges = interestTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return {
    has_interest_charges: interestTransactions.length > 0,
    interest_transaction_count: interestTransactions.length,
    total_interest_charges: totalInterestCharges
  };
}

/**
 * Check overdue status
 * @param {Object} liability - Liability object
 * @returns {boolean} True if overdue
 */
function checkOverdueStatus(liability) {
  if (!liability) return false;
  
  // Check is_overdue flag
  if (liability.is_overdue === 1 || liability.is_overdue === true) {
    return true;
  }

  // Also check next_payment_due_date if available
  if (liability.next_payment_due_date) {
    const dueDate = new Date(liability.next_payment_due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return dueDate < today;
  }

  return false;
}

/**
 * Analyze credit for a user within a time window
 * @param {number} userId - User ID
 * @param {number} days - Time window in days (30 or 180)
 * @returns {Object} Credit analysis results
 */
function analyzeCredit(userId, days) {
  const { startDate, endDate } = getDateRange(days);

  // Get all credit card accounts
  const creditAccounts = Account.findCreditCards(userId);
  
  if (creditAccounts.length === 0) {
    return {
      window_days: days,
      start_date: startDate,
      end_date: endDate,
      credit_card_count: 0,
      cards: [],
      has_high_utilization: false,
      has_medium_utilization: false,
      has_any_utilization: false,
      has_overdue: false,
      has_interest_charges: false,
      has_minimum_payment_only: false,
      meets_threshold: false
    };
  }

  // Analyze each credit card
  const cardAnalyses = creditAccounts.map(account => {
    const liability = Liability.findByAccountId(account.account_id);
    const utilization = calculateUtilization(account, liability);
    const isMinimumPaymentOnly = detectMinimumPaymentOnly(liability);
    const isOverdue = checkOverdueStatus(liability);
    const interestAnalysis = detectInterestCharges(userId, account.account_id, startDate, endDate);

    return {
      account_id: account.account_id,
      account_name: `${account.subtype || 'card'} ending in ${(account.account_id || '').slice(-4)}`,
      utilization: utilization.utilization,
      utilization_percentage: utilization.utilization_percentage,
      utilization_level: utilization.utilization_level,
      balance: utilization.balance,
      limit: utilization.limit,
      is_high_utilization: utilization.is_high_utilization,
      is_medium_utilization: utilization.is_medium_utilization,
      is_low_utilization: utilization.is_low_utilization,
      is_minimum_payment_only: isMinimumPaymentOnly,
      is_overdue: isOverdue,
      has_interest_charges: interestAnalysis.has_interest_charges,
      total_interest_charges: interestAnalysis.total_interest_charges,
      apr_percentage: liability?.apr_percentage || null,
      minimum_payment: liability?.minimum_payment_amount || null
    };
  });

  // Aggregate flags
  const hasHighUtilization = cardAnalyses.some(card => card.is_high_utilization);
  const hasMediumUtilization = cardAnalyses.some(card => card.is_medium_utilization);
  const hasAnyUtilization = cardAnalyses.some(card => card.utilization > 0);
  const hasOverdue = cardAnalyses.some(card => card.is_overdue);
  const hasInterestCharges = cardAnalyses.some(card => card.has_interest_charges);
  const hasMinimumPaymentOnly = cardAnalyses.some(card => card.is_minimum_payment_only);

  // Check if meets threshold for High Utilization persona
  // (≥50% utilization OR interest charges OR minimum-payment-only OR overdue)
  const meetsThreshold = cardAnalyses.some(card => 
    card.utilization >= CREDIT_THRESHOLDS.MEDIUM_UTILIZATION ||
    card.has_interest_charges ||
    card.is_minimum_payment_only ||
    card.is_overdue
  );

  return {
    window_days: days,
    start_date: startDate,
    end_date: endDate,
    credit_card_count: creditAccounts.length,
    cards: cardAnalyses,
    has_high_utilization: hasHighUtilization,
    has_medium_utilization: hasMediumUtilization,
    has_any_utilization: hasAnyUtilization,
    has_overdue: hasOverdue,
    has_interest_charges: hasInterestCharges,
    has_minimum_payment_only: hasMinimumPaymentOnly,
    meets_threshold: meetsThreshold
  };
}

/**
 * Analyze credit for both 30-day and 180-day windows
 * @param {number} userId - User ID
 * @returns {Object} Analysis results for both windows
 */
function analyzeCreditForUser(userId) {
  const shortTerm = analyzeCredit(userId, 30);
  const longTerm = analyzeCredit(userId, 180);

  return {
    user_id: userId,
    short_term: shortTerm,
    long_term: longTerm,
    // Summary flags
    has_credit_cards: shortTerm.credit_card_count > 0,
    meets_credit_threshold: shortTerm.meets_threshold || longTerm.meets_threshold
  };
}

module.exports = {
  analyzeCredit,
  analyzeCreditForUser,
  calculateUtilization,
  detectMinimumPaymentOnly,
  detectInterestCharges,
  checkOverdueStatus,
  getDateRange
};

