/**
 * Income Analysis Service
 * Detects payroll patterns and calculates income stability metrics
 */

const Transaction = require('../../models/Transaction');
const Account = require('../../models/Account');
const { INCOME_THRESHOLDS } = require('../../config/constants');

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
 * Detect payroll ACH transactions
 * @param {number} userId - User ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Array} Array of payroll transactions
 */
function detectPayrollTransactions(userId, startDate, endDate) {
  const transactions = Transaction.findByUserId(userId, {
    startDate,
    endDate,
    includePending: false
  });

  // Payroll indicators:
  // 1. Positive amounts (income)
  // 2. ACH payment channel or direct deposit
  // 3. Merchant names containing payroll keywords
  // 4. Category indicating income/transfer
  const payrollKeywords = [
    'payroll', 'salary', 'wages', 'paycheck', 'direct deposit',
    'employer', 'pay', 'income', 'pay stub', 'directdeposit'
  ];

  const payrollTransactions = transactions.filter(t => {
    // Must be positive (income)
    if (t.amount <= 0) return false;

    const merchant = (t.merchant_name || '').toLowerCase();
    const category = (t.personal_finance_category_primary || '').toLowerCase();
    const detailedCategory = (t.personal_finance_category_detailed || '').toLowerCase();
    const paymentChannel = (t.payment_channel || '').toLowerCase();

    // Check for payroll keywords
    const hasPayrollKeyword = payrollKeywords.some(keyword => 
      merchant.includes(keyword) || 
      category.includes(keyword) || 
      detailedCategory.includes(keyword)
    );

    // Check for ACH/direct deposit
    const isACH = paymentChannel === 'ach' || 
                  paymentChannel === 'direct_deposit' ||
                  merchant.includes('direct deposit') ||
                  merchant.includes('directdeposit');

    // Also check for income-related categories
    const isIncomeCategory = category.includes('income') || 
                            category.includes('transfer') ||
                            detailedCategory.includes('payroll');

    return hasPayrollKeyword || isACH || isIncomeCategory;
  });

  return payrollTransactions;
}

/**
 * Calculate payment frequency and median pay gap
 * @param {Array} payrollTransactions - Array of payroll transactions
 * @returns {Object} Frequency analysis
 */
function calculatePaymentFrequency(payrollTransactions) {
  if (payrollTransactions.length < 2) {
    return {
      frequency: 'irregular',
      median_pay_gap_days: null,
      avg_pay_gap_days: null,
      payment_count: payrollTransactions.length
    };
  }

  // Sort by date
  const sortedTransactions = [...payrollTransactions].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  // Calculate gaps between consecutive payments
  const gaps = [];
  for (let i = 1; i < sortedTransactions.length; i++) {
    const date1 = new Date(sortedTransactions[i - 1].date);
    const date2 = new Date(sortedTransactions[i].date);
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    gaps.push(diffDays);
  }

  // Calculate median
  const sortedGaps = [...gaps].sort((a, b) => a - b);
  const medianIndex = Math.floor(sortedGaps.length / 2);
  const medianPayGap = sortedGaps.length % 2 === 0
    ? (sortedGaps[medianIndex - 1] + sortedGaps[medianIndex]) / 2
    : sortedGaps[medianIndex];

  // Calculate average
  const avgPayGap = gaps.reduce((sum, days) => sum + days, 0) / gaps.length;

  // Calculate coefficient of variation to detect irregularity
  const variance = gaps.reduce((sum, days) => sum + Math.pow(days - avgPayGap, 2), 0) / gaps.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = avgPayGap > 0 ? stdDev / avgPayGap : 1;

  // Determine frequency
  let frequency;
  // If high variability (CV > 0.4), consider irregular
  if (coefficientOfVariation > 0.4) {
    frequency = 'irregular';
  } else if (medianPayGap >= 25 && medianPayGap <= 35) {
    frequency = 'monthly';
  } else if (medianPayGap >= 12 && medianPayGap <= 16) {
    frequency = 'bi-weekly';
  } else if (medianPayGap >= 5 && medianPayGap <= 9) {
    frequency = 'weekly';
  } else {
    frequency = 'irregular';
  }

  return {
    frequency,
    median_pay_gap_days: Math.round(medianPayGap * 10) / 10,
    avg_pay_gap_days: Math.round(avgPayGap * 10) / 10,
    payment_count: payrollTransactions.length,
    gaps: gaps
  };
}

/**
 * Calculate cash-flow buffer in months
 * @param {number} userId - User ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {number} Cash-flow buffer in months
 */
function calculateCashFlowBuffer(userId, startDate, endDate) {
  // Get all checking/savings account balances
  const depositoryAccounts = Account.findByType(userId, 'depository');
  const totalBalance = depositoryAccounts.reduce((sum, acc) => {
    return sum + (acc.available_balance || acc.current_balance || 0);
  }, 0);

  // Calculate average monthly expenses
  const transactions = Transaction.findByUserId(userId, {
    startDate,
    endDate,
    includePending: false
  });

  const totalExpenses = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Calculate days in period
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const months = daysDiff / 30.44;

  if (months <= 0 || totalExpenses <= 0) {
    return totalBalance > 0 ? Infinity : 0;
  }

  const avgMonthlyExpenses = totalExpenses / months;
  
  if (avgMonthlyExpenses <= 0) return Infinity;
  
  return totalBalance / avgMonthlyExpenses;
}

/**
 * Analyze income for a user within a time window
 * @param {number} userId - User ID
 * @param {number} days - Time window in days (30 or 180)
 * @returns {Object} Income analysis results
 */
function analyzeIncome(userId, days) {
  const { startDate, endDate } = getDateRange(days);

  // Detect payroll transactions
  const payrollTransactions = detectPayrollTransactions(userId, startDate, endDate);

  // Calculate payment frequency
  const frequencyData = calculatePaymentFrequency(payrollTransactions);

  // Calculate total income from payroll
  const totalPayrollIncome = payrollTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Calculate average monthly income
  const months = days / 30.44;
  const avgMonthlyIncome = months > 0 ? totalPayrollIncome / months : 0;

  // Calculate cash-flow buffer
  const cashFlowBuffer = calculateCashFlowBuffer(userId, startDate, endDate);

  // Check if meets Variable Income Budgeter persona criteria
  // (median pay gap > 45 days AND cash-flow buffer < 1 month)
  const meetsThreshold = frequencyData.median_pay_gap_days !== null &&
                         frequencyData.median_pay_gap_days > INCOME_THRESHOLDS.MAX_PAY_GAP_DAYS &&
                         cashFlowBuffer < INCOME_THRESHOLDS.MIN_CASH_FLOW_BUFFER;

  return {
    window_days: days,
    start_date: startDate,
    end_date: endDate,
    payroll_transaction_count: payrollTransactions.length,
    total_payroll_income: totalPayrollIncome,
    avg_monthly_income: Math.round(avgMonthlyIncome * 100) / 100,
    payment_frequency: frequencyData.frequency,
    median_pay_gap_days: frequencyData.median_pay_gap_days,
    avg_pay_gap_days: frequencyData.avg_pay_gap_days,
    cash_flow_buffer_months: Math.round(cashFlowBuffer * 10) / 10,
    has_variable_income: frequencyData.frequency === 'irregular' || 
                         (frequencyData.median_pay_gap_days !== null && 
                          frequencyData.median_pay_gap_days > INCOME_THRESHOLDS.MAX_PAY_GAP_DAYS),
    meets_threshold: meetsThreshold
  };
}

/**
 * Analyze income for both 30-day and 180-day windows
 * @param {number} userId - User ID
 * @returns {Object} Analysis results for both windows
 */
function analyzeIncomeForUser(userId) {
  const shortTerm = analyzeIncome(userId, 30);
  const longTerm = analyzeIncome(userId, 180);

  return {
    user_id: userId,
    short_term: shortTerm,
    long_term: longTerm,
    // Summary flags
    has_payroll_income: shortTerm.payroll_transaction_count > 0 || longTerm.payroll_transaction_count > 0,
    meets_income_threshold: shortTerm.meets_threshold || longTerm.meets_threshold
  };
}

module.exports = {
  analyzeIncome,
  analyzeIncomeForUser,
  detectPayrollTransactions,
  calculatePaymentFrequency,
  calculateCashFlowBuffer,
  getDateRange
};

