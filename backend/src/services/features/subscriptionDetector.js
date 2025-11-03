/**
 * Subscription Detection Service
 * Detects recurring merchants and calculates subscription metrics
 */

const Transaction = require('../../models/Transaction');
const { SUBSCRIPTION_THRESHOLDS } = require('../../config/constants');

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
 * Calculate days between two dates
 * @param {string} date1 - Date string (YYYY-MM-DD)
 * @param {string} date2 - Date string (YYYY-MM-DD)
 * @returns {number} Days between dates
 */
function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Detect recurring merchants (≥3 occurrences in 90 days)
 * @param {number} userId - User ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Array} Array of merchant objects with occurrence counts
 */
function detectRecurringMerchants(userId, startDate, endDate) {
  // Get all transactions for the user in the date range
  const transactions = Transaction.findByUserId(userId, {
    startDate,
    endDate,
    includePending: false
  });

  // Group transactions by merchant name
  const merchantMap = {};
  
  transactions.forEach(transaction => {
    // Only consider expense transactions (negative amounts)
    if (transaction.amount < 0 && transaction.merchant_name) {
      const merchantName = transaction.merchant_name.trim();
      
      if (!merchantMap[merchantName]) {
        merchantMap[merchantName] = {
          merchant_name: merchantName,
          transactions: [],
          total_spend: 0,
          count: 0
        };
      }
      
      merchantMap[merchantName].transactions.push({
        date: transaction.date,
        amount: Math.abs(transaction.amount)
      });
      merchantMap[merchantName].total_spend += Math.abs(transaction.amount);
      merchantMap[merchantName].count += 1;
    }
  });

  // Filter merchants with ≥ MIN_RECURRING_MERCHANTS occurrences
  const recurringMerchants = Object.values(merchantMap)
    .filter(merchant => merchant.count >= SUBSCRIPTION_THRESHOLDS.MIN_RECURRING_MERCHANTS)
    .map(merchant => {
      // Sort transactions by date
      merchant.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
      return merchant;
    });

  return recurringMerchants;
}

/**
 * Calculate cadence (monthly/weekly) for a merchant
 * @param {Array} transactions - Array of transaction objects with dates
 * @returns {Object} { cadence: 'monthly'|'weekly'|'irregular', avgDaysBetween: number }
 */
function calculateCadence(transactions) {
  if (transactions.length < 2) {
    return { cadence: 'irregular', avgDaysBetween: null };
  }

  // Calculate days between consecutive transactions
  const gaps = [];
  for (let i = 1; i < transactions.length; i++) {
    const days = daysBetween(transactions[i - 1].date, transactions[i].date);
    gaps.push(days);
  }

  const avgDays = gaps.reduce((sum, days) => sum + days, 0) / gaps.length;

  // Calculate standard deviation to detect irregular patterns
  const variance = gaps.reduce((sum, days) => sum + Math.pow(days - avgDays, 2), 0) / gaps.length;
  const stdDev = Math.sqrt(variance);
  
  // If standard deviation is too high relative to average, it's irregular
  // (e.g., if avg is 30 but stdDev is 20, it's very inconsistent)
  const coefficientOfVariation = stdDev / avgDays; // CV > 0.5 indicates high variability

  // Determine cadence based on average days and consistency
  let cadence;
  if (coefficientOfVariation > 0.5) {
    // High variability = irregular pattern
    cadence = 'irregular';
  } else if (avgDays >= 25 && avgDays <= 35) {
    cadence = 'monthly';
  } else if (avgDays >= 5 && avgDays <= 10) {
    cadence = 'weekly';
  } else {
    cadence = 'irregular';
  }

  return {
    cadence,
    avgDaysBetween: Math.round(avgDays * 10) / 10
  };
}

/**
 * Calculate monthly recurring spend for a merchant
 * @param {Object} merchant - Merchant object with transactions
 * @param {Object} cadenceInfo - Cadence information
 * @returns {number} Estimated monthly recurring spend
 */
function calculateMonthlyRecurringSpend(merchant, cadenceInfo) {
  if (cadenceInfo.cadence === 'monthly') {
    // If monthly, use average transaction amount
    const avgAmount = merchant.total_spend / merchant.count;
    return avgAmount;
  } else if (cadenceInfo.cadence === 'weekly') {
    // If weekly, multiply by ~4.33 (average weeks per month)
    const avgAmount = merchant.total_spend / merchant.count;
    return avgAmount * 4.33;
  } else {
    // For irregular, estimate based on time period
    // Assume transactions span the full period, calculate monthly rate
    const totalDays = merchant.transactions.length > 1
      ? daysBetween(merchant.transactions[0].date, merchant.transactions[merchant.transactions.length - 1].date)
      : 30;
    const monthlyRate = (merchant.total_spend / totalDays) * 30;
    return monthlyRate;
  }
}

/**
 * Calculate subscription share of total spend
 * @param {number} subscriptionSpend - Total subscription spend
 * @param {number} totalSpend - Total spend in the period
 * @returns {number} Subscription share as decimal (0.0 to 1.0)
 */
function calculateSubscriptionShare(subscriptionSpend, totalSpend) {
  if (totalSpend === 0) return 0;
  return subscriptionSpend / totalSpend;
}

/**
 * Analyze subscriptions for a user within a time window
 * @param {number} userId - User ID
 * @param {number} days - Time window in days (30 or 180)
 * @returns {Object} Subscription analysis results
 */
function analyzeSubscriptions(userId, days) {
  const { startDate, endDate } = getDateRange(days);

  // Get all transactions for the period
  const allTransactions = Transaction.findByUserId(userId, {
    startDate,
    endDate,
    includePending: false
  });

  // Calculate total spend (expenses only, negative amounts)
  const totalSpend = allTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Detect recurring merchants (using 90-day lookback from end date for detection)
  // But calculate metrics for the specified window
  const detectionEndDate = endDate;
  const detectionStartDate = new Date(detectionEndDate);
  detectionStartDate.setDate(detectionStartDate.getDate() - SUBSCRIPTION_THRESHOLDS.RECURRING_PERIOD_DAYS);
  
  const recurringMerchants = detectRecurringMerchants(
    userId,
    detectionStartDate.toISOString().split('T')[0],
    detectionEndDate
  );

  // Analyze each recurring merchant
  const merchantAnalyses = recurringMerchants.map(merchant => {
    // Filter transactions to the analysis window
    const windowTransactions = merchant.transactions.filter(t => 
      t.date >= startDate && t.date <= endDate
    );

    if (windowTransactions.length === 0) {
      return null;
    }

    const cadenceInfo = calculateCadence(windowTransactions);
    const monthlySpend = calculateMonthlyRecurringSpend(
      { ...merchant, transactions: windowTransactions, count: windowTransactions.length },
      cadenceInfo
    );

    // Calculate spend in the window
    const windowSpend = windowTransactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      merchant_name: merchant.merchant_name,
      count: windowTransactions.length,
      total_spend: windowSpend,
      monthly_recurring_spend: monthlySpend,
      cadence: cadenceInfo.cadence,
      avg_days_between: cadenceInfo.avgDaysBetween
    };
  }).filter(analysis => analysis !== null);

  // Calculate total subscription spend in the window
  const subscriptionSpend = merchantAnalyses.reduce((sum, m) => sum + m.total_spend, 0);
  const subscriptionShare = calculateSubscriptionShare(subscriptionSpend, totalSpend);

  // Calculate total monthly recurring spend
  const totalMonthlyRecurringSpend = merchantAnalyses.reduce((sum, m) => sum + m.monthly_recurring_spend, 0);

  return {
    window_days: days,
    start_date: startDate,
    end_date: endDate,
    recurring_merchants: merchantAnalyses,
    recurring_merchant_count: merchantAnalyses.length,
    total_subscription_spend: subscriptionSpend,
    total_monthly_recurring_spend: totalMonthlyRecurringSpend,
    subscription_share: subscriptionShare,
    total_spend: totalSpend,
    meets_threshold: merchantAnalyses.length >= SUBSCRIPTION_THRESHOLDS.MIN_RECURRING_MERCHANTS &&
                    (totalMonthlyRecurringSpend >= SUBSCRIPTION_THRESHOLDS.MIN_MONTHLY_RECURRING_SPEND ||
                     subscriptionShare >= SUBSCRIPTION_THRESHOLDS.MIN_SUBSCRIPTION_SHARE)
  };
}

/**
 * Analyze subscriptions for both 30-day and 180-day windows
 * @param {number} userId - User ID
 * @returns {Object} Analysis results for both windows
 */
function analyzeSubscriptionsForUser(userId) {
  const shortTerm = analyzeSubscriptions(userId, 30);
  const longTerm = analyzeSubscriptions(userId, 180);

  return {
    user_id: userId,
    short_term: shortTerm,
    long_term: longTerm,
    // Summary flags
    has_recurring_subscriptions: shortTerm.recurring_merchant_count >= SUBSCRIPTION_THRESHOLDS.MIN_RECURRING_MERCHANTS,
    meets_subscription_threshold: shortTerm.meets_threshold || longTerm.meets_threshold
  };
}

module.exports = {
  analyzeSubscriptions,
  analyzeSubscriptionsForUser,
  detectRecurringMerchants,
  calculateCadence,
  calculateMonthlyRecurringSpend,
  calculateSubscriptionShare,
  getDateRange
};

