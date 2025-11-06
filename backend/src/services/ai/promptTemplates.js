/**
 * AI Prompt Templates
 * Reusable prompt templates for AI features
 * Templates are designed to be safe, consistent, and effective
 */

/**
 * Base system prompt for financial AI assistant
 */
const BASE_SYSTEM_PROMPT = `You are a helpful financial assistant helping users understand their finances and make better decisions. 
You provide supportive, educational, and empowering guidance. 
You never use shaming, judgmental, or negative language.
You cite specific numbers and data points from the user's information.
You keep responses concise and actionable.`;

/**
 * Get rationale generation prompt
 * @param {Object} params - Prompt parameters
 * @param {Object} params.item - Recommendation item (education or offer)
 * @param {Object} params.persona - User's assigned persona
 * @param {Object} params.behavioralSignals - Behavioral analysis results
 * @param {Object} params.userData - Sanitized user data
 * @returns {Object} Prompt object with system and user messages
 */
function getRationalePrompt(params) {
  const { item, persona, behavioralSignals, userData } = params;
  
  const systemMessage = BASE_SYSTEM_PROMPT + `
Your task: Generate a personalized rationale explaining why this recommendation is relevant to the user.
The rationale should be empathetic, specific, and cite concrete data from their financial profile.
DO NOT use shaming, judgmental, or negative language.
DO cite specific numbers, amounts, and percentages from the user's data.
Keep the response concise (under 100 words) and actionable.`;

  // Extract specific data points for the prompt
  const creditData = behavioralSignals.credit?.short_term || {};
  const incomeData = behavioralSignals.income?.short_term || {};
  const subscriptionData = behavioralSignals.subscriptions?.short_term || {};
  const savingsData = behavioralSignals.savings?.short_term || {};

  // Build credit information
  let creditInfo = 'No credit cards';
  if (creditData.cards && creditData.cards.length > 0) {
    const highUtilCard = creditData.cards.find(c => 
      c.utilization_level === 'high' || c.utilization_level === 'very_high'
    );
    if (highUtilCard) {
      creditInfo = `High utilization: ${Math.round(highUtilCard.utilization_percentage)}% ($${Math.round(highUtilCard.balance).toLocaleString()} of $${Math.round(highUtilCard.limit).toLocaleString()})`;
    } else {
      creditInfo = `${creditData.cards.length} credit card(s), utilization level: ${creditData.utilization_level || 'low'}`;
    }
  }

  // Build subscription information
  let subscriptionInfo = 'No recurring subscriptions';
  if (subscriptionData.recurring_merchants && subscriptionData.recurring_merchants.length > 0) {
    subscriptionInfo = `${subscriptionData.recurring_merchants.length} subscription(s), $${Math.round(subscriptionData.total_monthly_recurring_spend || 0).toLocaleString()}/month`;
  }

  // Build savings information
  let savingsInfo = 'No savings';
  if (savingsData.total_savings_balance > 0) {
    savingsInfo = `$${Math.round(savingsData.total_savings_balance).toLocaleString()} in savings`;
    if (savingsData.emergency_fund_coverage_months) {
      savingsInfo += `, ${savingsData.emergency_fund_coverage_months} months emergency fund coverage`;
    }
  }

  // Build income information
  let incomeInfo = 'Income not available';
  if (incomeData.monthly_income) {
    incomeInfo = `$${Math.round(incomeData.monthly_income).toLocaleString()}/month`;
    if (incomeData.payment_frequency) {
      incomeInfo += ` (${incomeData.payment_frequency} payments)`;
    }
  }

  const userMessage = `Generate a rationale for recommending "${item.title}" to a user.

USER'S FINANCIAL PROFILE:
- Persona: ${persona.name} (${persona.description || 'N/A'})
- Credit: ${creditInfo}
- Income: ${incomeInfo}
- Subscriptions: ${subscriptionInfo}
- Savings: ${savingsInfo}

RECOMMENDATION DETAILS:
- Title: ${item.title}
- Category: ${item.category || item.offer_category || 'N/A'}
- Types: ${item.recommendation_types?.join(', ') || item.offer_type || 'N/A'}
- Description: ${(item.description || '').substring(0, 200)}

REQUIREMENTS:
1. Cite specific numbers from their financial data (amounts, percentages, counts)
2. Use empowering, supportive language - NO shaming or judgment
3. Explain why this recommendation is relevant to their ${persona.name} profile
4. Keep response under 100 words (approximately 2-3 sentences)
5. Be specific about potential benefits or outcomes
6. Use natural, conversational language

Generate the rationale:`;

  return {
    system: systemMessage,
    user: userMessage
  };
}

/**
 * Get prediction prompt template
 * @param {Object} params - Prompt parameters
 * @param {number} params.userId - User ID
 * @param {number} params.horizonDays - Prediction horizon in days
 * @param {Object} params.patterns - Transaction pattern analysis
 * @param {number} params.currentBalances - Current account balances
 * @param {Object} params.userData - Sanitized user data
 * @returns {Object} Prompt object with system and user messages
 */
function getPredictionPrompt(params) {
  const { userId, horizonDays, patterns, currentBalances, userData } = params;
  
  const systemMessage = BASE_SYSTEM_PROMPT + `
Your task: Analyze financial transaction patterns and predict future cash flow, income, and expenses.
Provide actionable insights and identify potential financial stress points.
Be specific, cite data, and use supportive, empowering language.`;

  // Build spending category breakdown
  const categoryBreakdown = patterns.topCategories
    .map(cat => `  - ${cat.category}: $${cat.amount.toFixed(2)}`)
    .join('\n');

  const userMessage = `Analyze this user's financial patterns and predict their cash flow for the next ${horizonDays} days.

CURRENT FINANCIAL STATE:
- Current Balance: $${currentBalances.toFixed(2)}
- Average Daily Income: $${patterns.avgDailyIncome.toFixed(2)}
- Average Daily Expenses: $${patterns.avgDailyExpenses.toFixed(2)}
- Average Daily Net Flow: $${patterns.avgDailyNetFlow.toFixed(2)}
- Income Frequency: ${patterns.incomeFrequency}
- Transaction History: ${patterns.transactionCount} transactions over last ${patterns.lookbackDays} days

SPENDING PATTERNS (Last ${patterns.lookbackDays} days):
- Total Income: $${patterns.totalIncome.toFixed(2)}
- Total Expenses: $${patterns.totalExpenses.toFixed(2)}
- Net Flow: $${patterns.netFlow.toFixed(2)}

Top Spending Categories:
${categoryBreakdown || '  - No category data available'}

PREDICTION REQUIREMENTS:
1. Predict income, expenses, and net cash flow for the next ${horizonDays} days
2. Consider income frequency patterns (${patterns.incomeFrequency})
3. Identify potential stress points (negative cash flow, low balance)
4. Provide confidence level based on data quality
5. Suggest proactive actions if stress points are identified
6. Use supportive, empowering language

Please provide your analysis in JSON format:
{
  "summary": "Brief narrative summary (2-3 sentences)",
  "predicted_income": <number>,
  "predicted_expenses": <number>,
  "predicted_net_flow": <number>,
  "confidence_level": "high|medium|low",
  "stress_points": [
    {
      "type": "negative_cash_flow|low_balance|irregular_income",
      "severity": "high|medium|low",
      "description": "Description of the issue"
    }
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2"
  ]
}

Generate the prediction:`;

  return {
    system: systemMessage,
    user: userMessage
  };
}

/**
 * Get budget generation prompt template
 * @param {Object} params - Prompt parameters
 * @param {number} params.userId - User ID
 * @param {Object} params.spendingAnalysis - Spending analysis by category
 * @param {number} params.currentBalances - Current account balances
 * @param {Object} params.userData - Sanitized user data
 * @returns {Object} Prompt object with system and user messages
 */
function getBudgetPrompt(params) {
  const { userId, spendingAnalysis, currentBalances, userData } = params;
  
  const systemMessage = BASE_SYSTEM_PROMPT + `
Your task: Create a personalized monthly budget based on the user's spending history and financial situation.
The budget should be realistic, achievable, and help them build better financial habits.
DO NOT use shaming, judgmental, or negative language.
DO provide specific category limits based on their actual spending patterns.
DO include a rationale explaining why each category limit is set.`;

  // Build category breakdown
  const categoryBreakdown = spendingAnalysis.categoryBreakdown
    .slice(0, 10) // Top 10 categories
    .map(cat => `  - ${cat.category}: $${cat.monthlyAvg.toFixed(2)}/month (${cat.count} transactions)`)
    .join('\n');

  const userMessage = `Generate a personalized monthly budget for this user.

FINANCIAL SITUATION:
- Current Balance: $${currentBalances.toFixed(2)}
- Average Monthly Income: $${spendingAnalysis.avgMonthlyIncome.toFixed(2)}
- Average Monthly Expenses: $${spendingAnalysis.avgMonthlyExpenses.toFixed(2)}
- Transaction History: ${spendingAnalysis.transactionCount} transactions over last ${spendingAnalysis.lookbackDays} days

SPENDING BY CATEGORY (Last ${spendingAnalysis.lookbackDays} days):
${categoryBreakdown || '  - No category data available'}

BUDGET REQUIREMENTS:
1. Create realistic category spending limits based on their historical spending
2. Suggest a monthly savings target (aim for 10-20% of income if possible)
3. Set an emergency fund goal (3-6 months of expenses)
4. Provide a rationale for each category limit (explain why it's set)
5. Use supportive, empowering language
6. Make recommendations that are achievable (not too restrictive)
7. Consider their current spending patterns when setting limits

Please provide your budget in JSON format:
{
  "categories": [
    {
      "category": "category_name",
      "monthly_limit": <number>,
      "current_avg": <number>,
      "rationale": "Why this limit is set"
    }
  ],
  "monthly_savings_target": <number>,
  "emergency_fund_goal": <number>,
  "rationale": "Overall budget rationale explaining the approach"
}

Generate the budget:`;

  return {
    system: systemMessage,
    user: userMessage
  };
}

/**
 * Get goal generation prompt template
 * @param {Object} params - Prompt parameters
 * @param {number} params.userId - User ID
 * @param {Object} params.spendingAnalysis - Spending analysis by category
 * @param {number} params.currentBalances - Current account balances
 * @param {Object} params.userData - Sanitized user data
 * @returns {Object} Prompt object with system and user messages
 */
function getGoalPrompt(params) {
  const { userId, spendingAnalysis, currentBalances, userData } = params;
  
  const systemMessage = BASE_SYSTEM_PROMPT + `
Your task: Generate personalized savings goals based on the user's financial situation.
Goals should be specific, measurable, achievable, relevant, and time-bound (SMART).
DO NOT use shaming, judgmental, or negative language.
DO make goals realistic and motivating.
DO provide rationale for each goal.`;

  const userMessage = `Generate personalized savings goals for this user.

FINANCIAL SITUATION:
- Current Balance: $${currentBalances.toFixed(2)}
- Average Monthly Income: $${spendingAnalysis.avgMonthlyIncome.toFixed(2)}
- Average Monthly Expenses: $${spendingAnalysis.avgMonthlyExpenses.toFixed(2)}
- Net Monthly Flow: $${(spendingAnalysis.avgMonthlyIncome - spendingAnalysis.avgMonthlyExpenses).toFixed(2)}
- Transaction History: ${spendingAnalysis.transactionCount} transactions over last ${spendingAnalysis.lookbackDays} days

GOAL REQUIREMENTS:
1. Create 3-5 specific, achievable savings goals
2. Goals should be SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
3. Include a mix of short-term (1-3 months) and medium-term (3-12 months) goals
4. Consider their current financial situation when setting goal amounts
5. Provide rationale for each goal (why it's important, how to achieve it)
6. Use supportive, empowering language
7. Make goals motivating and relevant to their financial health

Please provide your goals in JSON format:
{
  "goals": [
    {
      "name": "Goal name",
      "target_amount": <number>,
      "current_progress": <number>,
      "target_date": "YYYY-MM-DD",
      "timeframe": "short_term|medium_term|long_term",
      "rationale": "Why this goal is important and how to achieve it"
    }
  ],
  "rationale": "Overall rationale for the goal recommendations"
}

Generate the goals:`;

  return {
    system: systemMessage,
    user: userMessage
  };
}

/**
 * Get report generation prompt template
 * @param {Object} params - Prompt parameters
 * @returns {Object} Prompt object
 */
function getReportPrompt(params) {
  // Placeholder - will be implemented in PR #35
  return {
    system: BASE_SYSTEM_PROMPT,
    user: 'Report prompt template'
  };
}

/**
 * Get subscription analysis prompt template
 * @param {Object} params - Prompt parameters
 * @returns {Object} Prompt object
 */
function getSubscriptionAnalysisPrompt(params) {
  // Placeholder - will be implemented in PR #36
  return {
    system: BASE_SYSTEM_PROMPT,
    user: 'Subscription analysis prompt template'
  };
}

module.exports = {
  BASE_SYSTEM_PROMPT,
  getRationalePrompt,
  getPredictionPrompt,
  getBudgetPrompt,
  getGoalPrompt,
  getReportPrompt,
  getSubscriptionAnalysisPrompt
};

