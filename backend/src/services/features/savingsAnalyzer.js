/**
 * Savings Analysis Service
 * Detects net inflow to savings accounts and calculates savings metrics
 */

const Account = require('../../models/Account');
const Transaction = require('../../models/Transaction');
const { SAVINGS_THRESHOLDS } = require('../../config/constants');

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
 * Calculate net inflow to savings accounts
 * @param {number} userId - User ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Object} Net inflow analysis
 */
function calculateNetInflow(userId, startDate, endDate) {
  // Get all savings accounts for the user
  const savingsAccounts = Account.findSavingsAccounts(userId);
  
  if (savingsAccounts.length === 0) {
    return {
      net_inflow: 0,
      total_inflow: 0,
      total_outflow: 0,
      account_count: 0
    };
  }

  let totalInflow = 0;
  let totalOutflow = 0;

  // Get current balances
  const currentBalances = savingsAccounts.reduce((sum, acc) => {
    return sum + (acc.current_balance || 0);
  }, 0);

  // Get starting balances by looking at transactions before the start date
  // We'll estimate starting balance = current balance - net transactions in period
  // For a more accurate calculation, we'd need historical balance data
  // For now, calculate net change from transactions
  savingsAccounts.forEach(account => {
    const transactions = Transaction.findByAccountId(account.account_id, {
      startDate,
      endDate,
      includePending: false
    });

    transactions.forEach(transaction => {
      if (transaction.amount > 0) {
        // Positive amount = inflow (deposit)
        totalInflow += transaction.amount;
      } else {
        // Negative amount = outflow (withdrawal)
        totalOutflow += Math.abs(transaction.amount);
      }
    });
  });

  const netInflow = totalInflow - totalOutflow;

  return {
    net_inflow: netInflow,
    total_inflow: totalInflow,
    total_outflow: totalOutflow,
    account_count: savingsAccounts.length,
    current_savings_balance: currentBalances
  };
}

/**
 * Calculate savings growth rate
 * @param {number} currentBalance - Current savings balance
 * @param {number} netInflow - Net inflow over the period
 * @param {number} days - Number of days in the period
 * @returns {number} Growth rate as decimal (e.g., 0.02 = 2%)
 */
function calculateGrowthRate(currentBalance, netInflow, days) {
  // Estimate starting balance
  const estimatedStartBalance = currentBalance - netInflow;
  
  if (estimatedStartBalance <= 0) {
    // If starting balance was 0 or negative, growth rate is 100% if we have positive balance now
    return currentBalance > 0 ? 1.0 : 0;
  }

  // Growth rate = (current - start) / start
  const growthRate = (currentBalance - estimatedStartBalance) / estimatedStartBalance;
  
  // Annualize if period is less than a year
  if (days < 365) {
    return (growthRate / days) * 365;
  }

  return growthRate;
}

/**
 * Calculate average monthly expenses
 * @param {number} userId - User ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {number} Average monthly expenses
 */
function calculateAverageMonthlyExpenses(userId, startDate, endDate) {
  const transactions = Transaction.findByUserId(userId, {
    startDate,
    endDate,
    includePending: false
  });

  // Calculate total expenses (negative amounts)
  const totalExpenses = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Calculate days in period
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const months = daysDiff / 30.44; // Average days per month

  if (months <= 0) return 0;
  
  return totalExpenses / months;
}

/**
 * Calculate emergency fund coverage
 * @param {number} savingsBalance - Current savings balance
 * @param {number} avgMonthlyExpenses - Average monthly expenses
 * @returns {number} Months of coverage (e.g., 3.5 = 3.5 months)
 */
function calculateEmergencyFundCoverage(savingsBalance, avgMonthlyExpenses) {
  if (avgMonthlyExpenses <= 0) return 0;
  return savingsBalance / avgMonthlyExpenses;
}

/**
 * Analyze savings for a user within a time window
 * @param {number} userId - User ID
 * @param {number} days - Time window in days (30 or 180)
 * @returns {Object} Savings analysis results
 */
function analyzeSavings(userId, days) {
  const { startDate, endDate } = getDateRange(days);

  // Calculate net inflow
  const inflowData = calculateNetInflow(userId, startDate, endDate);
  
  // Calculate growth rate
  const growthRate = calculateGrowthRate(
    inflowData.current_savings_balance,
    inflowData.net_inflow,
    days
  );

  // Calculate average monthly expenses
  const avgMonthlyExpenses = calculateAverageMonthlyExpenses(userId, startDate, endDate);

  // Calculate emergency fund coverage
  const emergencyFundCoverage = calculateEmergencyFundCoverage(
    inflowData.current_savings_balance,
    avgMonthlyExpenses
  );

  // Calculate monthly net inflow (normalize to per-month)
  const months = days / 30.44;
  const monthlyNetInflow = months > 0 ? inflowData.net_inflow / months : 0;

  return {
    window_days: days,
    start_date: startDate,
    end_date: endDate,
    savings_account_count: inflowData.account_count,
    current_savings_balance: inflowData.current_savings_balance,
    net_inflow: inflowData.net_inflow,
    total_inflow: inflowData.total_inflow,
    total_outflow: inflowData.total_outflow,
    monthly_net_inflow: monthlyNetInflow,
    growth_rate: growthRate,
    average_monthly_expenses: avgMonthlyExpenses,
    emergency_fund_coverage_months: emergencyFundCoverage,
    meets_threshold: growthRate >= SAVINGS_THRESHOLDS.MIN_GROWTH_RATE ||
                     monthlyNetInflow >= SAVINGS_THRESHOLDS.MIN_MONTHLY_INFLOW
  };
}

/**
 * Analyze savings for both 30-day and 180-day windows
 * @param {number} userId - User ID
 * @returns {Object} Analysis results for both windows
 */
function analyzeSavingsForUser(userId) {
  const shortTerm = analyzeSavings(userId, 30);
  const longTerm = analyzeSavings(userId, 180);

  return {
    user_id: userId,
    short_term: shortTerm,
    long_term: longTerm,
    // Summary flags
    has_savings_accounts: shortTerm.savings_account_count > 0,
    meets_savings_threshold: shortTerm.meets_threshold || longTerm.meets_threshold
  };
}

module.exports = {
  analyzeSavings,
  analyzeSavingsForUser,
  calculateNetInflow,
  calculateGrowthRate,
  calculateAverageMonthlyExpenses,
  calculateEmergencyFundCoverage,
  getDateRange
};

