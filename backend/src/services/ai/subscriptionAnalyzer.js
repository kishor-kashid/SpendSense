/**
 * AI-Powered Subscription Analysis Service
 * Uses AI to analyze user subscriptions and suggest which ones might be good candidates for cancellation
 */

const { getOpenAIClient, isConfigured } = require('./openaiClient');
const { getSubscriptionAnalysisPrompt } = require('./promptTemplates');
const { getCachedOrGenerate, sanitizeDataForAI, handleAIError } = require('./utils');
const { requireAIConsent, hasAIConsent } = require('../guardrails/aiConsentChecker');
const { analyzeSubscriptionsForUser } = require('../features/subscriptionDetector');
const Transaction = require('../../models/Transaction');
const Account = require('../../models/Account');
const User = require('../../models/User');

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
 * Calculate subscription value metrics
 * @param {Object} subscription - Subscription data from subscription detector
 * @param {number} daysAnalyzed - Number of days in the analysis period
 * @returns {Object} Value metrics
 */
function calculateSubscriptionValue(subscription, daysAnalyzed) {
  const monthlySpend = subscription.monthly_recurring_spend || 0;
  const transactionCount = subscription.actualTransactionCount || subscription.count || 0;
  const avgTransactionAmount = subscription.avgTransactionAmount || 0;
  const daysSinceFirst = daysAnalyzed;
  const daysSinceLast = subscription.lastTransactionDate 
    ? Math.floor((new Date() - new Date(subscription.lastTransactionDate)) / (1000 * 60 * 60 * 24))
    : null;
  
  // Calculate cost per use - use actual average transaction amount
  // If we have the average, use it; otherwise fall back to monthly spend / frequency
  const usageFrequency = (transactionCount / daysAnalyzed) * 30;
  const costPerUse = avgTransactionAmount > 0 
    ? avgTransactionAmount 
    : (usageFrequency > 0 ? monthlySpend / usageFrequency : monthlySpend);
  
  // Calculate value score (lower is better for cancellation)
  // Higher monthly spend + lower usage = lower value score
  let valueScore = 1.0; // Default neutral
  if (monthlySpend > 0 && transactionCount > 0) {
    // Normalize: lower usage frequency relative to cost = lower value
    valueScore = Math.max(0.1, Math.min(1.0, usageFrequency / (monthlySpend / 10)));
  }
  
  return {
    monthlySpend,
    transactionCount,
    costPerUse,
    usageFrequency,
    daysSinceLastTransaction: daysSinceLast,
    valueScore,
    // Flag for underutilized (high cost, low usage)
    isUnderutilized: monthlySpend > 10 && (transactionCount < 3 || usageFrequency < 1)
  };
}

/**
 * Analyze subscriptions for a user
 * @param {number} userId - User ID
 * @returns {Object} Subscription analysis with value metrics
 */
function analyzeSubscriptions(userId) {
  // Get subscription data
  const subscriptionData = analyzeSubscriptionsForUser(userId);
  
  // Get user data for context
  const user = User.findById(userId);
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }
  
  // Get accounts for balance context
  const accounts = Account.findByUserId(userId);
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
  
  // Get all transactions for usage analysis
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 180); // 6 months lookback
  
  const allTransactions = Transaction.findByUserId(userId, {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    includePending: false
  });
  
  // Enhance subscription data with value metrics
  const enhancedSubscriptions = subscriptionData.short_term.recurring_merchants.map(sub => {
    // Find all transactions for this merchant in the 30-day window
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const merchantTransactions = allTransactions.filter(t => 
      t.merchant_name && t.merchant_name.trim() === sub.merchant_name &&
      t.amount < 0 &&
      new Date(t.date) >= thirtyDaysAgo
    );
    
    // Calculate actual transaction amounts (use absolute values)
    const transactionAmounts = merchantTransactions.map(t => Math.abs(t.amount));
    const totalActualSpend = transactionAmounts.reduce((sum, amt) => sum + amt, 0);
    const avgTransactionAmount = transactionAmounts.length > 0 
      ? totalActualSpend / transactionAmounts.length 
      : 0;
    
    // Calculate monthly recurring spend more conservatively
    // Use actual transaction frequency in the 30-day window
    const actualTransactionCount = merchantTransactions.length;
    const actualDaysBetween = merchantTransactions.length > 1
      ? Math.max(1, daysBetween(
          merchantTransactions[merchantTransactions.length - 1].date,
          merchantTransactions[0].date
        ))
      : 30;
    
    // Calculate monthly spend based on actual frequency
    let calculatedMonthlySpend = 0;
    if (actualTransactionCount > 0) {
      if (sub.cadence === 'monthly') {
        // Monthly: use average transaction amount
        calculatedMonthlySpend = avgTransactionAmount;
      } else if (sub.cadence === 'weekly') {
        // Weekly: multiply by ~4.33
        calculatedMonthlySpend = avgTransactionAmount * 4.33;
      } else {
        // Irregular: use actual frequency in 30-day window
        // For irregular subscriptions, use the actual count of transactions in 30 days
        // This gives us a more accurate monthly projection
        const transactionsPerMonth = actualTransactionCount; // If 2 transactions in 30 days, that's 2/month
        calculatedMonthlySpend = avgTransactionAmount * transactionsPerMonth;
        
        // Cap the monthly spend at a reasonable maximum to prevent inflation
        // For irregular subscriptions, cap at 4x the average transaction amount
        // (to account for potentially monthly bills that happen irregularly)
        const maxReasonableMonthly = avgTransactionAmount * 4;
        calculatedMonthlySpend = Math.min(calculatedMonthlySpend, maxReasonableMonthly);
      }
    }
    
    // Use the more conservative estimate (actual vs detected)
    const monthlySpend = Math.min(calculatedMonthlySpend, sub.monthly_recurring_spend || calculatedMonthlySpend);
    
    const lastTransaction = merchantTransactions.length > 0
      ? merchantTransactions.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
      : null;
    
    const valueMetrics = calculateSubscriptionValue(
      {
        ...sub,
        monthly_recurring_spend: monthlySpend,
        actualTransactionCount: actualTransactionCount,
        avgTransactionAmount: avgTransactionAmount,
        lastTransactionDate: lastTransaction ? lastTransaction.date : null
      },
      30 // Short-term analysis period
    );
    
    return {
      merchant_name: sub.merchant_name,
      monthly_recurring_spend: monthlySpend,
      cadence: sub.cadence,
      transaction_count: actualTransactionCount,
      total_spend: totalActualSpend,
      ...valueMetrics
    };
  });
  
  // Calculate totals
  const totalMonthlyRecurringSpend = enhancedSubscriptions.reduce(
    (sum, sub) => sum + sub.monthlySpend, 0
  );
  
  // Get income data for context
  const incomeTransactions = allTransactions.filter(t => t.amount > 0);
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const avgMonthlyIncome = (totalIncome / 180) * 30;
  
  return {
    user_id: userId,
    subscriptions: enhancedSubscriptions,
    summary: {
      total_subscriptions: enhancedSubscriptions.length,
      total_monthly_recurring_spend: totalMonthlyRecurringSpend,
      subscription_share_of_income: avgMonthlyIncome > 0 
        ? (totalMonthlyRecurringSpend / avgMonthlyIncome) * 100 
        : 0,
      underutilized_count: enhancedSubscriptions.filter(s => s.isUnderutilized).length,
      avg_value_score: enhancedSubscriptions.length > 0
        ? enhancedSubscriptions.reduce((sum, s) => sum + s.valueScore, 0) / enhancedSubscriptions.length
        : 1.0
    },
    financial_context: {
      total_balance: totalBalance,
      avg_monthly_income: avgMonthlyIncome,
      total_monthly_recurring_spend: totalMonthlyRecurringSpend
    }
  };
}

/**
 * Generate AI-powered subscription cancellation suggestions
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Cancellation suggestions with rationale
 */
async function generateCancellationSuggestions(userId) {
  // Check AI consent
  requireAIConsent(userId);
  
  // Check OpenAI configuration
  if (!isConfigured()) {
    throw new Error('OpenAI API is not configured');
  }
  
  // Analyze subscriptions
  const analysis = analyzeSubscriptions(userId);
  
  // Handle edge cases
  if (analysis.subscriptions.length === 0) {
    return {
      user_id: userId,
      suggestions: [],
      summary: {
        total_suggestions: 0,
        potential_monthly_savings: 0,
        potential_yearly_savings: 0,
        message: 'No subscriptions found to analyze'
      },
      analysis: analysis
    };
  }
  
  // If all subscriptions are high-value, still provide analysis but suggest reviewing
  const highValueSubscriptions = analysis.subscriptions.filter(s => s.valueScore > 0.7);
  if (highValueSubscriptions.length === analysis.subscriptions.length && analysis.subscriptions.length > 0) {
    return {
      user_id: userId,
      suggestions: [],
      summary: {
        total_suggestions: 0,
        potential_monthly_savings: 0,
        potential_yearly_savings: 0,
        message: 'All subscriptions appear to be actively used. Consider reviewing usage periodically.'
      },
      analysis: analysis
    };
  }
  
  // Get user data for AI context
  const user = User.findById(userId);
  const accounts = Account.findByUserId(userId);
  const userData = sanitizeDataForAI({
    user: {
      name: user.name,
      accounts: accounts
    }
  });
  
  // Generate AI suggestions
  const cacheKey = `subscription_suggestions:${userId}`;
  
  try {
    const suggestions = await getCachedOrGenerate(cacheKey, async () => {
      const prompt = getSubscriptionAnalysisPrompt({
        userId,
        analysis,
        userData
      });
      
      const client = getOpenAIClient();
      const response = await client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });
      
      const content = response.choices[0].message.content;
      
      // Parse JSON response
      try {
        return JSON.parse(content);
      } catch (parseError) {
        // If JSON parsing fails, try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                         content.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1]);
        }
        throw new Error('Failed to parse AI response as JSON');
      }
    }, 300000); // Cache for 5 minutes
    
    // Calculate potential savings
    const suggestedSubscriptions = suggestions.suggestions || [];
    const potentialMonthlySavings = suggestedSubscriptions.reduce(
      (sum, sug) => sum + (sug.monthly_cost || 0), 0
    );
    const potentialYearlySavings = potentialMonthlySavings * 12;
    
    // Merge AI suggestions with analysis data
    const enhancedSuggestions = suggestedSubscriptions.map(suggestion => {
      const subscriptionAnalysis = analysis.subscriptions.find(
        s => s.merchant_name === suggestion.merchant_name
      );
      
      return {
        ...suggestion,
        analysis: subscriptionAnalysis || null,
        potential_savings: {
          monthly: suggestion.monthly_cost || 0,
          yearly: (suggestion.monthly_cost || 0) * 12
        }
      };
    });
    
    // Sort by potential savings (highest first)
    enhancedSuggestions.sort((a, b) => 
      (b.potential_savings.monthly || 0) - (a.potential_savings.monthly || 0)
    );
    
    return {
      user_id: userId,
      suggestions: enhancedSuggestions,
      summary: {
        total_suggestions: enhancedSuggestions.length,
        potential_monthly_savings: potentialMonthlySavings,
        potential_yearly_savings: potentialYearlySavings,
        message: suggestions.rationale || 'Subscription cancellation suggestions based on usage patterns'
      },
      analysis: analysis,
      ai_rationale: suggestions.rationale
    };
    
  } catch (error) {
    const aiError = handleAIError(error);
    throw new Error(`Failed to generate subscription suggestions: ${aiError.message}`);
  }
}

module.exports = {
  analyzeSubscriptions,
  generateCancellationSuggestions,
  calculateSubscriptionValue
};

