/**
 * Predictive Financial Insights Service
 * Uses AI to predict future spending, income, and cash flow
 */

const { getOpenAIClient, isConfigured } = require('./openaiClient');
const { getPredictionPrompt } = require('./promptTemplates');
const { getCachedOrGenerate, sanitizeDataForAI, handleAIError } = require('./utils');
const { requireAIConsent, hasAIConsent } = require('../guardrails/aiConsentChecker');
const Transaction = require('../../models/Transaction');
const Account = require('../../models/Account');
const User = require('../../models/User');

/**
 * Analyze transaction patterns for predictions
 * @param {number} userId - User ID
 * @param {number} lookbackDays - Number of days to look back (default: 90)
 * @returns {Object} Transaction pattern analysis
 */
function analyzeTransactionPatterns(userId, lookbackDays = 90) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackDays);

  const transactions = Transaction.findByUserId(userId, {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    includePending: false
  });

  // Separate income and expenses
  const income = transactions.filter(t => t.amount > 0);
  const expenses = transactions.filter(t => t.amount < 0).map(t => ({
    ...t,
    amount: Math.abs(t.amount)
  }));

  // Calculate totals
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const netFlow = totalIncome - totalExpenses;

  // Group by category
  const expensesByCategory = {};
  expenses.forEach(t => {
    const category = t.personal_finance_category_primary || 'uncategorized';
    if (!expensesByCategory[category]) {
      expensesByCategory[category] = 0;
    }
    expensesByCategory[category] += t.amount;
  });

  // Calculate averages per day
  const avgDailyIncome = totalIncome / lookbackDays;
  const avgDailyExpenses = totalExpenses / lookbackDays;
  const avgDailyNetFlow = netFlow / lookbackDays;

  // Identify top spending categories
  const topCategories = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }));

  // Calculate income frequency (if available)
  const incomeDates = income.map(t => t.date).sort();
  let incomeFrequency = 'irregular';
  if (incomeDates.length >= 2) {
    const gaps = [];
    for (let i = 1; i < incomeDates.length; i++) {
      const gap = Math.abs(new Date(incomeDates[i]) - new Date(incomeDates[i - 1])) / (1000 * 60 * 60 * 24);
      gaps.push(gap);
    }
    const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    if (avgGap >= 25 && avgGap <= 35) {
      incomeFrequency = 'monthly';
    } else if (avgGap >= 12 && avgGap <= 16) {
      incomeFrequency = 'biweekly';
    } else if (avgGap >= 6 && avgGap <= 8) {
      incomeFrequency = 'weekly';
    }
  }

  return {
    lookbackDays,
    totalIncome,
    totalExpenses,
    netFlow,
    avgDailyIncome,
    avgDailyExpenses,
    avgDailyNetFlow,
    topCategories,
    incomeFrequency,
    transactionCount: transactions.length,
    incomeCount: income.length,
    expenseCount: expenses.length
  };
}

/**
 * Generate predictive insights using AI
 * @param {number} userId - User ID
 * @param {number} horizonDays - Prediction horizon in days (7, 30, or 90)
 * @returns {Promise<Object>} Predictive insights
 */
async function generatePredictiveInsights(userId, horizonDays = 30) {
  // Check if OpenAI is configured
  if (!isConfigured()) {
    throw new Error('OpenAI API is not configured');
  }

  // Check AI consent
  try {
    requireAIConsent(userId);
  } catch (error) {
    throw new Error('AI consent is required for predictive insights');
  }

  // Validate horizon
  const validHorizons = [7, 30, 90];
  if (!validHorizons.includes(horizonDays)) {
    throw new Error(`Invalid prediction horizon. Must be one of: ${validHorizons.join(', ')}`);
  }

  // Create cache key (cache for 24 hours)
  const cacheKey = `ai_predictions:${userId}:${horizonDays}`;
  const cacheTTL = 24 * 60 * 60 * 1000; // 24 hours

  try {
    const predictions = await getCachedOrGenerate(
      cacheKey,
      async () => {
        // Get user data
        const user = User.findById(userId);
        if (!user) {
          throw new Error(`User ${userId} not found`);
        }

        // Get accounts
        const accounts = Account.findByUserId(userId);
        const currentBalances = accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);

        // Analyze transaction patterns
        const patterns = analyzeTransactionPatterns(userId, 90);

        // Sanitize data for AI
        const sanitizedData = sanitizeDataForAI({
          user,
          accounts,
          currentBalances,
          patterns
        });

        // Get prediction prompt
        const prompt = getPredictionPrompt({
          userId,
          horizonDays,
          patterns,
          currentBalances,
          userData: sanitizedData
        });

        // Get OpenAI client
        const openai = getOpenAIClient();

        // Call OpenAI API with GPT-4
        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user }
          ],
          temperature: 0.7,
          max_tokens: 500,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        });

        // Extract predictions from response
        const generatedText = response.choices[0]?.message?.content?.trim();

        if (!generatedText) {
          throw new Error('Failed to generate predictions');
        }

        // Parse predictions (expect JSON format)
        let parsedPredictions;
        try {
          // Try to extract JSON from markdown code blocks if present
          const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            parsedPredictions = JSON.parse(jsonMatch[1]);
          } else {
            // Try direct JSON parse
            parsedPredictions = JSON.parse(generatedText);
          }
        } catch (parseError) {
          // If JSON parsing fails, create structured response from text
          parsedPredictions = {
            summary: generatedText,
            predicted_income: patterns.avgDailyIncome * horizonDays,
            predicted_expenses: patterns.avgDailyExpenses * horizonDays,
            predicted_net_flow: patterns.avgDailyNetFlow * horizonDays
          };
        }

        // Calculate predicted values based on patterns
        const predictedIncome = patterns.avgDailyIncome * horizonDays;
        const predictedExpenses = patterns.avgDailyExpenses * horizonDays;
        const predictedNetFlow = patterns.avgDailyNetFlow * horizonDays;
        const predictedEndBalance = currentBalances + predictedNetFlow;

        // Identify potential stress points
        const stressPoints = [];
        if (predictedNetFlow < 0) {
          stressPoints.push({
            type: 'negative_cash_flow',
            severity: predictedNetFlow < -500 ? 'high' : 'medium',
            message: `Projected negative cash flow of $${Math.abs(predictedNetFlow).toFixed(2)} over ${horizonDays} days`,
            daysUntilShortfall: predictedEndBalance < 0 ? Math.ceil(Math.abs(predictedEndBalance) / Math.abs(patterns.avgDailyNetFlow)) : null
          });
        }

        if (predictedEndBalance < 0) {
          stressPoints.push({
            type: 'negative_balance',
            severity: 'high',
            message: `Balance may go negative based on current spending patterns`,
            projectedBalance: predictedEndBalance
          });
        }

        // Build predictions object
        return {
          horizon_days: horizonDays,
          generated_at: new Date().toISOString(),
          current_state: {
            current_balance: currentBalances,
            avg_daily_income: patterns.avgDailyIncome,
            avg_daily_expenses: patterns.avgDailyExpenses,
            avg_daily_net_flow: patterns.avgDailyNetFlow
          },
          predictions: {
            predicted_income: predictedIncome,
            predicted_expenses: predictedExpenses,
            predicted_net_flow: predictedNetFlow,
            predicted_end_balance: predictedEndBalance,
            confidence_level: patterns.transactionCount >= 30 ? 'high' : patterns.transactionCount >= 10 ? 'medium' : 'low'
          },
          ai_summary: parsedPredictions.summary || generatedText,
          stress_points: stressPoints,
          recommendations: parsedPredictions.recommendations || [],
          pattern_analysis: {
            top_categories: patterns.topCategories,
            income_frequency: patterns.incomeFrequency,
            transaction_count: patterns.transactionCount
          }
        };
      },
      cacheTTL
    );

    return predictions;
  } catch (error) {
    const handledError = handleAIError(error);
    throw new Error(`Failed to generate predictive insights: ${handledError.message}`);
  }
}

/**
 * Generate predictions for multiple horizons
 * @param {number} userId - User ID
 * @param {Array<number>} horizons - Array of horizon days (default: [7, 30, 90])
 * @returns {Promise<Object>} Predictions for all horizons
 */
async function generateMultiHorizonPredictions(userId, horizons = [7, 30, 90]) {
  const predictions = {};

  // Generate predictions for each horizon in parallel
  const promises = horizons.map(async (horizon) => {
    try {
      const prediction = await generatePredictiveInsights(userId, horizon);
      return { horizon, prediction };
    } catch (error) {
      // If one horizon fails, continue with others
      return { horizon, prediction: null, error: error.message };
    }
  });

  const results = await Promise.all(promises);

  results.forEach(({ horizon, prediction, error }) => {
    if (prediction) {
      predictions[`${horizon}_days`] = prediction;
    } else {
      predictions[`${horizon}_days`] = {
        error: error || 'Failed to generate predictions',
        horizon_days: horizon
      };
    }
  });

  return {
    user_id: userId,
    generated_at: new Date().toISOString(),
    horizons: horizons,
    predictions
  };
}

module.exports = {
  generatePredictiveInsights,
  generateMultiHorizonPredictions,
  analyzeTransactionPatterns
};

