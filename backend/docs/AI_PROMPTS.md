# AI Prompt Engineering Documentation

## Overview

This document describes the prompt engineering approach used in SpendSense's AI features. All prompts are designed to be safe, consistent, and effective while maintaining user privacy and empowering financial decision-making.

## Prompt Design Principles

### 1. Safety First
- **No Shaming:** Prompts explicitly instruct the AI to avoid judgmental language
- **Empowering Tone:** Language is supportive and educational
- **Data Privacy:** Only sanitized, summarized data is included in prompts

### 2. Consistency
- **Base System Prompt:** All features share a common base prompt
- **Structured Format:** Consistent JSON response format
- **Clear Instructions:** Explicit requirements in prompts

### 3. Effectiveness
- **Specific Data:** Prompts include concrete numbers and data points
- **Context-Rich:** User's financial situation is clearly described
- **Actionable:** Responses focus on actionable recommendations

## Base System Prompt

All AI features use a shared base system prompt:

```
You are a helpful financial assistant helping users understand their finances 
and make better decisions. You provide supportive, educational, and empowering 
guidance. You never use shaming, judgmental, or negative language. You cite 
specific numbers and data points from the user's information. You keep responses 
concise and actionable.
```

## Prompt Templates by Feature

### 1. Rationale Generation

**Purpose:** Generate personalized rationales for recommendations

**System Message:**
```
[Base System Prompt]
Your task: Generate a personalized rationale explaining why this recommendation 
is relevant to the user. The rationale should be empathetic, specific, and cite 
concrete data from their financial profile. DO NOT use shaming, judgmental, or 
negative language. DO cite specific numbers, amounts, and percentages from the 
user's data. Keep the response concise (under 100 words) and actionable.
```

**User Message Structure:**
```
Generate a rationale for recommending "[item.title]" to a user.

USER'S FINANCIAL PROFILE:
- Persona: [persona.name] ([persona.description])
- Credit: [credit information]
- Income: [income information]
- Subscriptions: [subscription information]
- Savings: [savings information]

RECOMMENDATION DETAILS:
- Title: [item.title]
- Category: [item.category]
- Types: [item.recommendation_types]
- Description: [item.description]

REQUIREMENTS:
1. Cite specific numbers from their financial data
2. Use empowering, supportive language - NO shaming or judgment
3. Explain why this recommendation is relevant to their [persona.name] profile
4. Keep response under 100 words
5. Be specific about potential benefits or outcomes
6. Use natural, conversational language
```

**Key Features:**
- Persona-specific context
- Behavioral signal data
- Specific data citations required
- Length constraint (100 words)

---

### 2. Predictive Insights

**Purpose:** Forecast future financial outcomes

**System Message:**
```
[Base System Prompt]
Your task: Analyze transaction patterns and predict future cash flow. Predictions 
should be realistic, data-driven, and actionable. DO NOT use shaming, judgmental, 
or negative language. DO cite specific patterns from transaction history. DO 
provide confidence levels and stress points.
```

**User Message Structure:**
```
Analyze transaction patterns and predict financial outcomes for the next [horizon] days.

TRANSACTION HISTORY:
- Transaction Count: [count]
- Total Income (last 90 days): $[amount]
- Total Expenses (last 90 days): $[amount]
- Average Monthly Income: $[amount]
- Average Monthly Expenses: $[amount]
- Net Monthly Flow: $[amount]

CURRENT BALANCES:
- Total Balance: $[amount]
- Savings Accounts: $[amount]
- Credit Card Balances: $[amount]

SPENDING PATTERNS:
[Category breakdown with spending amounts]

PREDICTION REQUIREMENTS:
1. Predict expected income over next [horizon] days
2. Predict expected expenses over next [horizon] days
3. Calculate net cash flow prediction
4. Identify potential stress points (e.g., large upcoming expenses)
5. Provide confidence level (high, medium, low)
6. Recommend actions if stress points are identified

Please provide your predictions in JSON format:
{
  "summary": "Brief summary of prediction",
  "predicted_income": <number>,
  "predicted_expenses": <number>,
  "predicted_net_flow": <number>,
  "confidence_level": "high|medium|low",
  "stress_points": ["...", "..."],
  "recommendations": ["...", "..."]
}
```

**Key Features:**
- Historical pattern analysis
- Multiple time horizons (7, 30, 90 days)
- Confidence levels
- Stress point identification

---

### 3. Budget Generation

**Purpose:** Create personalized monthly budgets

**System Message:**
```
[Base System Prompt]
Your task: Generate a personalized monthly budget based on the user's spending 
history and financial situation. The budget should be realistic, achievable, and 
help them build better financial habits. DO NOT use shaming, judgmental, or 
negative language. DO provide specific category limits based on their actual 
spending patterns. DO include a rationale explaining why each category limit is set.
```

**User Message Structure:**
```
Generate a personalized monthly budget for this user.

FINANCIAL SITUATION:
- Current Balance: $[amount]
- Average Monthly Income: $[amount]
- Average Monthly Expenses: $[amount]
- Transaction History: [count] transactions over last [days] days

SPENDING BY CATEGORY (Last [days] days):
[Category breakdown with monthly averages]

BUDGET REQUIREMENTS:
1. Create realistic category spending limits based on historical spending
2. Suggest a monthly savings target (aim for 10-20% of income if possible)
3. Set an emergency fund goal (3-6 months of expenses)
4. Provide a rationale for each category limit
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
```

**Key Features:**
- Category-specific limits
- Savings targets
- Emergency fund goals
- Rationale per category

---

### 4. Goal Generation

**Purpose:** Generate SMART savings goals

**System Message:**
```
[Base System Prompt]
Your task: Generate personalized savings goals based on the user's financial 
situation. Goals should be specific, measurable, achievable, relevant, and 
time-bound (SMART). DO NOT use shaming, judgmental, or negative language. DO make 
goals realistic and motivating. DO provide rationale for each goal.
```

**User Message Structure:**
```
Generate personalized savings goals for this user.

FINANCIAL SITUATION:
- Current Balance: $[amount]
- Average Monthly Income: $[amount]
- Average Monthly Expenses: $[amount]
- Net Monthly Flow: $[amount]
- Transaction History: [count] transactions over last [days] days

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
```

**Key Features:**
- SMART goal structure
- Multiple timeframes
- Progress tracking
- Achievement rationale

---

### 5. Subscription Analysis

**Purpose:** Suggest subscription cancellations

**System Message:**
```
[Base System Prompt]
Your task: Analyze user subscriptions and suggest which ones might be good 
candidates for cancellation. Suggestions should be based on usage patterns, cost, 
value, and the user's financial situation. DO NOT use shaming, judgmental, or 
negative language. DO provide specific, actionable recommendations with clear 
rationale. DO consider the user's financial context when making suggestions. DO 
prioritize suggestions by potential savings impact.
```

**User Message Structure:**
```
Analyze subscriptions for this user and suggest which ones might be good 
candidates for cancellation.

FINANCIAL CONTEXT:
- Total Balance: $[amount]
- Average Monthly Income: $[amount]
- Total Monthly Subscription Spend: $[amount]
- Subscription Share of Income: [percentage]%

SUBSCRIPTION ANALYSIS:
Total Subscriptions: [count]
Underutilized Subscriptions: [count]
Average Value Score: [percentage]%

SUBSCRIPTION DETAILS:
[Detailed list of each subscription with:
  - Monthly Cost
  - Usage Frequency
  - Cost per Use
  - Last Used Date
  - Value Score
  - Underutilized Status]

ANALYSIS REQUIREMENTS:
1. Identify subscriptions that are underutilized (high cost, low usage)
2. Consider subscriptions not used recently (days since last transaction)
3. Identify duplicate or overlapping services if applicable
4. Consider the user's financial situation (subscription share of income)
5. Prioritize suggestions by potential savings impact

SUGGESTION REQUIREMENTS:
1. Suggest 1-5 subscriptions to consider canceling (if any are good candidates)
2. Focus on subscriptions with high monthly cost and low usage frequency
3. Provide clear rationale for each suggestion
4. Calculate potential monthly/yearly savings
5. Consider alternatives if applicable
6. Use supportive, empowering language - NO shaming or judgment
7. If all subscriptions are high-value, suggest reviewing periodically instead

Please provide your suggestions in JSON format:
{
  "suggestions": [
    {
      "merchant_name": "Subscription name",
      "monthly_cost": <number>,
      "rationale": "Why this subscription is a good candidate for cancellation",
      "potential_alternatives": "Optional alternative suggestions",
      "priority": "high|medium|low"
    }
  ],
  "rationale": "Overall rationale for the subscription cancellation suggestions"
}
```

**Key Features:**
- Usage pattern analysis
- Value assessment
- Financial context consideration
- Alternative suggestions

---

## Prompt Engineering Best Practices

### 1. Data Sanitization

Before sending data to AI:
- Remove sensitive information (user_id, passwords, account IDs)
- Mask account identifiers (show only last 4 digits)
- Summarize transactions (don't send full lists)
- Remove PII (personally identifiable information)

**Example:**
```javascript
// Before sanitization
{
  user_id: 123,
  accounts: [
    { account_id: "acc_123456789", balance: 5000, ... }
  ],
  transactions: [/* 1000 transactions */]
}

// After sanitization
{
  accounts: [
    { account_id_masked: "****6789", balance: 5000, type: "checking" }
  ],
  transaction_summary: {
    count: 1000,
    total_spending: 50000,
    total_income: 60000,
    net_flow: 10000
  }
}
```

### 2. Structured Output

Always request JSON format with clear structure:
- Consistent field names
- Required fields clearly specified
- Optional fields marked
- Example structure provided

### 3. Error Prevention

Include in prompts:
- Explicit "do not" instructions
- Examples of what NOT to do
- Format requirements
- Length constraints

### 4. Context Balancing

Include enough context without overwhelming:
- Essential financial data: Yes
- Transaction-level details: No (summarize)
- Personal information: No
- Behavioral signals: Yes (summary)

---

## Prompt Testing

### Test Cases

1. **Edge Cases:**
   - Users with no transactions
   - Users with very high spending
   - Users with very low income
   - Users with no subscriptions

2. **Tone Validation:**
   - Check for judgmental language
   - Verify empowering tone
   - Ensure no shaming

3. **Data Accuracy:**
   - Verify numbers match user data
   - Check calculations are correct
   - Ensure recommendations are relevant

### Validation

All AI outputs are validated:
- **Rationale Length:** 50-200 words
- **Tone:** No prohibited phrases
- **Format:** Valid JSON structure
- **Data:** Numbers match user data

---

## Prompt Versioning

Prompts are versioned in code:
- Base prompt changes affect all features
- Feature-specific prompts can be updated independently
- Changes are tracked in code comments

**Version History:**
- v1.0: Initial prompts (PR #32, #33, #34)
- v1.1: Added subscription analysis prompts (PR #36)
- v1.2: Enhanced data sanitization (ongoing)

---

## Customization

### Adjusting Prompts

To modify prompts:
1. Edit `backend/src/services/ai/promptTemplates.js`
2. Update system message for tone/style changes
3. Update user message for format changes
4. Test with sample data
5. Validate output quality

### Adding New Features

When adding new AI features:
1. Create prompt function in `promptTemplates.js`
2. Follow existing prompt structure
3. Include base system prompt
4. Specify JSON response format
5. Add validation logic
6. Update this documentation

---

## Related Documentation

- [`AI_FEATURES.md`](./AI_FEATURES.md) - AI features overview
- [`AI_COST_OPTIMIZATION.md`](./AI_COST_OPTIMIZATION.md) - Cost optimization
- [`API.md`](./API.md) - API documentation

