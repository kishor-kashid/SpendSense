/**
 * AI-Powered Budget and Goal Generation Service
 * Uses AI to generate personalized budgets and savings goals based on user's financial history
 */

const { getOpenAIClient, isConfigured } = require('./openaiClient');
const { getBudgetPrompt, getGoalPrompt } = require('./promptTemplates');
const { getCachedOrGenerate, sanitizeDataForAI, handleAIError } = require('./utils');
const { requireAIConsent, hasAIConsent } = require('../guardrails/aiConsentChecker');
const Transaction = require('../../models/Transaction');
const Account = require('../../models/Account');
const User = require('../../models/User');

/**
 * Analyze historical spending by category for budget generation
 * @param {number} userId - User ID
 * @param {number} lookbackDays - Number of days to look back (default: 90)
 * @returns {Object} Spending analysis by category
 */
function analyzeSpendingByCategory(userId, lookbackDays = 90) {
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
  const avgMonthlyIncome = (totalIncome / lookbackDays) * 30;
  const avgMonthlyExpenses = (totalExpenses / lookbackDays) * 30;

  // Group by category
  const expensesByCategory = {};
  expenses.forEach(t => {
    const category = t.personal_finance_category_primary || 'uncategorized';
    if (!expensesByCategory[category]) {
      expensesByCategory[category] = {
        total: 0,
        count: 0,
        avgAmount: 0
      };
    }
    expensesByCategory[category].total += t.amount;
    expensesByCategory[category].count += 1;
  });

  // Calculate averages
  Object.keys(expensesByCategory).forEach(category => {
    const data = expensesByCategory[category];
    data.avgAmount = data.total / data.count;
    data.monthlyAvg = (data.total / lookbackDays) * 30;
  });

  // Sort categories by spending
  const categoryBreakdown = Object.entries(expensesByCategory)
    .map(([category, data]) => ({
      category,
      total: data.total,
      monthlyAvg: data.monthlyAvg,
      count: data.count,
      avgAmount: data.avgAmount
    }))
    .sort((a, b) => b.monthlyAvg - a.monthlyAvg);

  return {
    lookbackDays,
    totalIncome,
    totalExpenses,
    avgMonthlyIncome,
    avgMonthlyExpenses,
    categoryBreakdown,
    transactionCount: transactions.length,
    incomeCount: income.length,
    expenseCount: expenses.length,
    hasEnoughData: transactions.length >= 10 // Minimum transactions for meaningful analysis
  };
}

/**
 * Generate AI-powered budget recommendations
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Budget recommendations with category limits and rationale
 */
async function generateBudget(userId) {
  // Check if OpenAI is configured
  if (!isConfigured()) {
    throw new Error('OpenAI API is not configured');
  }

  // Check AI consent
  if (!hasAIConsent(userId)) {
    throw new Error('AI consent is required for budget generation');
  }

  // Cache key for budget generation
  const cacheKey = `budget:${userId}`;
  const cacheTTL = 7 * 24 * 60 * 60 * 1000; // 7 days (budgets don't change frequently)

  try {
    const budget = await getCachedOrGenerate(
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

        // Analyze spending patterns
        const spendingAnalysis = analyzeSpendingByCategory(userId, 90);

        // Check if user has enough data
        if (!spendingAnalysis.hasEnoughData) {
          return {
            success: false,
            error: 'insufficient_data',
            message: 'Not enough transaction history to generate a budget. Please add more transactions.',
            recommendations: [
              'Track your spending for at least 2-3 weeks',
              'Ensure transactions are properly categorized',
              'Try again once you have more financial data'
            ]
          };
        }

        // Sanitize data for AI
        const sanitizedData = sanitizeDataForAI({
          user,
          accounts,
          currentBalances,
          spendingAnalysis
        });

        // Get budget prompt
        const prompt = getBudgetPrompt({
          userId,
          spendingAnalysis,
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
          max_tokens: 1000,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        });

        // Extract budget from response
        const generatedText = response.choices[0]?.message?.content?.trim();

        if (!generatedText) {
          throw new Error('Failed to generate budget');
        }

        // Parse budget (expect JSON format)
        let parsedBudget;
        try {
          // Try to extract JSON from markdown code blocks if present
          const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            parsedBudget = JSON.parse(jsonMatch[1]);
          } else {
            // Try to parse as direct JSON
            parsedBudget = JSON.parse(generatedText);
          }
        } catch (parseError) {
          // If JSON parsing fails, try to extract key information
          console.error('Failed to parse budget JSON:', parseError);
          throw new Error('Invalid budget format received from AI');
        }

        // Validate budget structure
        if (!parsedBudget.categories || !Array.isArray(parsedBudget.categories)) {
          throw new Error('Invalid budget structure: missing categories');
        }

        return {
          success: true,
          monthly_income: spendingAnalysis.avgMonthlyIncome,
          monthly_expenses_avg: spendingAnalysis.avgMonthlyExpenses,
          categories: parsedBudget.categories,
          monthly_savings_target: parsedBudget.monthly_savings_target || 0,
          emergency_fund_goal: parsedBudget.emergency_fund_goal || 0,
          rationale: parsedBudget.rationale || 'Budget generated based on your spending patterns',
          generated_at: new Date().toISOString(),
          lookback_days: spendingAnalysis.lookbackDays
        };
      },
      cacheTTL
    );

    return budget;
  } catch (error) {
    return handleAIError(error, 'budget generation');
  }
}

/**
 * Generate AI-powered savings goals
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Personalized savings goals
 */
async function generateGoals(userId) {
  // Check if OpenAI is configured
  if (!isConfigured()) {
    throw new Error('OpenAI API is not configured');
  }

  // Check AI consent
  if (!hasAIConsent(userId)) {
    throw new Error('AI consent is required for goal generation');
  }

  // Cache key for goal generation
  const cacheKey = `goals:${userId}`;
  const cacheTTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  try {
    const goals = await getCachedOrGenerate(
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

        // Analyze spending patterns
        const spendingAnalysis = analyzeSpendingByCategory(userId, 90);

        // Check if user has enough data
        if (!spendingAnalysis.hasEnoughData) {
          return {
            success: false,
            error: 'insufficient_data',
            message: 'Not enough transaction history to generate goals. Please add more transactions.',
            recommendations: [
              'Track your spending for at least 2-3 weeks',
              'Try again once you have more financial data'
            ]
          };
        }

        // Sanitize data for AI
        const sanitizedData = sanitizeDataForAI({
          user,
          accounts,
          currentBalances,
          spendingAnalysis
        });

        // Get goal prompt
        const prompt = getGoalPrompt({
          userId,
          spendingAnalysis,
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
          max_tokens: 800,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        });

        // Extract goals from response
        const generatedText = response.choices[0]?.message?.content?.trim();

        if (!generatedText) {
          throw new Error('Failed to generate goals');
        }

        // Parse goals (expect JSON format)
        let parsedGoals;
        try {
          // Try to extract JSON from markdown code blocks if present
          const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            parsedGoals = JSON.parse(jsonMatch[1]);
          } else {
            // Try to parse as direct JSON
            parsedGoals = JSON.parse(generatedText);
          }
        } catch (parseError) {
          console.error('Failed to parse goals JSON:', parseError);
          throw new Error('Invalid goals format received from AI');
        }

        // Validate goals structure
        if (!parsedGoals.goals || !Array.isArray(parsedGoals.goals)) {
          throw new Error('Invalid goals structure: missing goals array');
        }

        return {
          success: true,
          goals: parsedGoals.goals,
          rationale: parsedGoals.rationale || 'Goals generated based on your financial situation',
          generated_at: new Date().toISOString()
        };
      },
      cacheTTL
    );

    return goals;
  } catch (error) {
    return handleAIError(error, 'goal generation');
  }
}

module.exports = {
  generateBudget,
  generateGoals,
  analyzeSpendingByCategory
};

