# SpendSense - AI Features Development Task List

## Overview

This document outlines the implementation plan for integrating OpenAI-powered AI features into SpendSense. All AI features require explicit user consent (separate from data processing consent) and will only be active when consent is granted.

## Implementation Status Summary

### ✅ Completed Features
1. **PR #31: AI Infrastructure Setup & Consent Management** - ✅ **COMPLETED**
2. **PR #32: Dynamic Rationale Generation** - ✅ **COMPLETED**
3. **PR #33: Predictive Financial Insights** - ✅ **COMPLETED** (simplified - removed chart, recommendations, pattern analysis, current state sections)
4. **PR #34: Budget and Goal Generation** - ✅ **COMPLETED**

### ❌ Not Implemented (Removed from Scope)
- **PR #35: Automated Report Generation** - Not implemented

### ✅ Completed Features (Additional)
- **PR #36: Smart Subscription Cancellation Suggestions** - ✅ **COMPLETED**

### 📋 Partially Completed
- **PR #37: AI Features Testing & Integration** - Partially completed (tests exist for implemented features)

### ✅ Completed Features (Documentation)
- **PR #38: AI Features Documentation** - ✅ **COMPLETED**

## AI Features Implemented

1. **Dynamic Rationale Generation** - AI-powered personalized recommendation rationales ✅
2. **Predictive Financial Insights** - Forecast future spending, income, and cash flow ✅
3. **Spending Goal and Budget Generation** - AI-generated personalized budgets and savings goals ✅

---

## Foundation: AI Infrastructure & Consent Management

### **PR #31: AI Infrastructure Setup & Consent Management**
**Branch:** `feature/ai-infrastructure`

#### Tasks:
- [x] Install OpenAI SDK (`npm install openai`)
- [x] Create OpenAI client configuration module
- [x] Set up environment variable for API key (`OPENAI_API_KEY`)
- [x] Create AI consent database table (separate from data processing consent)
- [x] Create AI consent model (`AIConsent.js`)
- [x] Create AI consent checker service (`aiConsentChecker.js`)
- [x] Create AI consent routes (`/ai-consent` endpoints)
- [x] Update database schema documentation
- [x] Create migration script for AI consent table
- [x] Add AI consent toggle to frontend (below data processing consent)
- [x] Create `useAIConsent` hook for frontend
- [x] Update Navigation component to show AI consent toggle
- [x] Add AI consent checking middleware/guardrails
- [x] Implement fallback mechanisms (when AI consent is revoked, use template-based systems)
- [x] Add rate limiting for AI API calls
- [x] Implement response caching for AI features
- [x] Create AI service utilities (prompt templates, response parsing)
- [x] Add error handling for AI API failures
- [x] Write unit tests for AI consent management
- [x] Write integration tests for AI consent endpoints

#### Files Created/Updated:
```
CREATE: /backend/src/services/ai/openaiClient.js
CREATE: /backend/src/services/ai/promptTemplates.js
CREATE: /backend/src/services/ai/utils.js
CREATE: /backend/src/models/AIConsent.js
CREATE: /backend/src/services/guardrails/aiConsentChecker.js
CREATE: /backend/src/routes/ai-consent.js
CREATE: /backend/src/migrations/addAIConsentTable.js
CREATE: /frontend/src/hooks/useAIConsent.js
CREATE: /backend/tests/unit/aiConsent.test.js
CREATE: /backend/tests/integration/aiConsent.test.js
UPDATE: /backend/src/migrations/createTables.js (add AI consent table)
UPDATE: /backend/src/config/database.js (AI consent table creation)
UPDATE: /backend/docs/SCHEMA.md (document AI consent table)
UPDATE: /frontend/src/components/common/Navigation.jsx (add AI consent toggle)
UPDATE: /backend/src/server.js (register AI consent routes)
UPDATE: /backend/.env.example (add OPENAI_API_KEY)
UPDATE: /backend/package.json (add openai dependency)
```

#### Acceptance Criteria:
- OpenAI SDK installed and configured
- AI consent table created in database
- AI consent can be granted/revoked independently of data processing consent
- AI consent toggle appears in frontend Navigation component (below data processing consent)
- AI consent status is checked before any AI feature execution
- Fallback to template-based systems when AI consent is revoked
- All AI consent tests pass
- API key is properly secured in environment variables
- Rate limiting prevents excessive API calls
- Caching reduces redundant API requests

---

## Feature 1: Dynamic Rationale Generation

### **PR #32: AI-Powered Dynamic Rationale Generation**
**Branch:** `feature/ai-rationale-generation`

#### Overview:
Add AI-generated personalized rationales as an **additional** feature alongside existing template-based rationales. The existing template-based rationale generation remains unchanged and continues to work as before. AI rationales are provided as an additional `ai_rationale` field when AI consent is granted.

#### Tasks:
- [x] Create AI rationale generator service (`aiRationaleGenerator.js`)
- [x] Design prompt templates for education item rationales
- [x] Design prompt templates for partner offer rationales
- [x] Implement data extraction helper (extract relevant user data for prompts)
- [x] Add AI rationale generation to recommendation engine (as additional field, not replacement)
- [x] Only generate AI rationales when AI consent is granted (existing template rationales always generated)
- [x] Add fallback handling when AI API fails (gracefully skip AI rationale, keep template rationale)
- [x] Implement prompt injection prevention
- [x] Add rationale caching (cache by user + recommendation + persona)
- [x] Add rationale validation (ensure tone, length, data citation)
- [x] Update recommendation response structure to include `ai_rationale` field
- [x] Ensure existing template rationale generation remains unchanged
- [x] Write unit tests for AI rationale generation
- [x] Write integration tests for AI rationale in recommendations
- [x] Test with various personas and recommendation types
- [x] Verify tone validation works with AI-generated rationales
- [x] Document prompt engineering approach
- [x] Update API documentation

#### Files Created/Updated:
```
CREATE: /backend/src/services/ai/rationaleGenerator.js
CREATE: /backend/src/services/ai/promptTemplates.js (includes rationale prompts)
UPDATE: /backend/src/services/recommend/recommendationEngine.js (add AI rationale generation, keep template rationale)
UPDATE: /backend/src/routes/recommendations.js (handle AI rationale in response)
CREATE: /backend/tests/unit/aiRationale.test.js
UPDATE: /backend/tests/integration/recommendations.test.js (test AI rationales)
UPDATE: /backend/docs/API.md (document AI rationale feature)
```

#### Acceptance Criteria:
- **Existing template-based rationales continue to work unchanged**
- AI generates personalized rationales citing specific user data (when AI consent granted)
- AI rationales are provided as additional `ai_rationale` field alongside existing `rationale` field
- Rationales maintain supportive, empowering tone
- Rationales include concrete numbers (amounts, percentages, account numbers)
- AI rationale generation skipped when AI consent not granted (template rationale still provided)
- Graceful fallback when AI API fails (template rationale still provided)
- Rationales pass existing tone validation
- Caching reduces API calls for repeated recommendations
- All existing tests still pass (no regressions)
- AI rationale tests pass
- Rationales are explainable (can trace why they were generated)

#### AI Prompt Structure:
```
System: You are a financial advisor helping users understand recommendations.
User: Generate a rationale for [recommendation] based on:
- Persona: [persona name]
- Credit utilization: [specific data]
- Monthly income: [specific data]
- Subscription spending: [specific data]
- Recent transactions: [summary]

Requirements:
- Cite specific numbers from user data
- Use empowering, supportive language
- Explain the benefit clearly
- Keep under 100 words
```

---

## Feature 2: Predictive Financial Insights

### **PR #33: AI-Powered Predictive Financial Insights**
**Branch:** `feature/ai-predictive-insights`

#### Overview:
Use AI to analyze transaction patterns and predict future spending, income, and cash flow to help users plan ahead.

#### Tasks:
- [x] Create predictive insights service (`predictiveInsights.js`)
- [x] Design prompt templates for cash flow prediction
- [x] Design prompt templates for spending pattern prediction
- [x] Design prompt templates for income prediction
- [x] Implement transaction pattern analysis helper
- [x] Create API endpoint `/ai/predictions/:user_id`
- [x] Add prediction caching (daily predictions, cached for 24 hours)
- [x] Generate predictions for multiple time horizons (7, 30, 90 days)
- [x] Identify potential financial stress points
- [x] Create frontend component for displaying predictions
- [x] Create AI Features tab component (`AIFeaturesTab.jsx`)
- [x] Add "AI Features" tab to Dashboard (next to Transactions, Insights, Recommendations)
- [x] Display predictions in AI Features tab
- [x] Ensure AI Features tab only shows when AI consent is granted (independent of data processing consent)
- [x] Handle edge cases (insufficient data, irregular patterns)
- [x] Write unit tests for prediction logic
- [x] Write integration tests for prediction endpoint
- [x] Test with various user profiles
- [x] Document prediction methodology
- [x] Update API documentation

**Note:** The following features were removed from the implementation:
- Cash Flow Projection chart/visualization (removed from UI)
- Proactive Recommendations section (removed from UI)
- Spending Pattern Analysis section (removed from UI)
- Current Financial State section (removed from UI)

**Current Implementation Includes:**
- Horizon Selector (7, 30, 90 days)
- AI Analysis Summary
- Financial Forecast (predicted income, expenses, net flow, projected balance, confidence)
- Stress Points (if any)

#### Files Created/Updated:
```
CREATE: /backend/src/services/ai/predictiveInsights.js
CREATE: /backend/src/services/ai/promptTemplates.js (includes prediction prompts)
CREATE: /backend/src/routes/ai.js (new route file for AI endpoints)
UPDATE: /frontend/src/components/user/Dashboard.jsx (add AI Features tab)
CREATE: /frontend/src/components/user/PredictiveInsights.jsx
CREATE: /frontend/src/components/user/AIFeaturesTab.jsx
CREATE: /frontend/src/components/user/AIFeaturesTab.css
CREATE: /frontend/src/components/user/PredictiveInsights.css
CREATE: /backend/tests/unit/predictiveInsights.test.js
CREATE: /backend/tests/integration/predictions.test.js
UPDATE: /backend/docs/API.md (document predictions endpoint)
```

#### Acceptance Criteria:
- ✅ AI generates cash flow predictions for 7, 30, and 90 days
- ✅ Predictions identify potential shortfalls or surpluses
- ✅ Predictions include confidence levels
- ✅ Frontend displays predictions in user-friendly format
- ✅ Predictions are cached to reduce API calls
- ✅ Fallback when insufficient transaction data
- ✅ All tests pass
- ✅ Predictions are explainable (user can understand the reasoning)

#### AI Prompt Structure:
```
System: You are a financial analyst predicting future cash flow.
User: Analyze transaction patterns and predict:
- Expected income over next [days] days
- Expected expenses over next [days] days
- Net cash flow prediction
- Potential stress points
- Recommended actions

Transaction history: [summarized transaction data]
Current balances: [account balances]
Historical patterns: [spending patterns]
```

---

## Feature 3: Spending Goal and Budget Generation

### **PR #34: AI-Powered Budget and Goal Generation**
**Branch:** `feature/ai-budget-generation`

#### Overview:
Generate personalized budgets and savings goals based on user's spending history and financial situation.

#### Tasks:
- [x] Create budget generation service (`budgetGenerator.js`)
- [x] Design prompt templates for budget generation
- [x] Design prompt templates for goal setting
- [x] Analyze historical spending by category
- [x] Generate realistic budget recommendations
- [x] Create personalized savings goals
- [x] Suggest category spending limits
- [x] Create API endpoint `/ai/budgets/:user_id/generate`
- [x] Create API endpoint `/ai/goals/:user_id/generate`
- [x] Add budget/goal display to AI Features tab
- [x] Create frontend component for budget display
- [x] Create frontend component for goals display
- [x] Generate budget rationale (explain why these limits)
- [x] Handle users with limited transaction history
- [x] Write unit tests for budget generation
- [x] Write integration tests for budget endpoints
- [x] Test with various spending patterns
- [x] Document budget generation methodology
- [x] Update API documentation

#### Files Created/Updated:
```
CREATE: /backend/src/services/ai/budgetGenerator.js
CREATE: /backend/src/services/ai/promptTemplates.js (includes budget/goal prompts)
UPDATE: /backend/src/routes/ai.js (add budget/goal endpoints)
CREATE: /frontend/src/components/user/BudgetGenerator.jsx
CREATE: /frontend/src/components/user/BudgetDisplay.jsx
CREATE: /frontend/src/components/user/GoalsDisplay.jsx
UPDATE: /frontend/src/components/user/AIFeaturesTab.jsx (add budget/goal sections)
CREATE: /backend/tests/unit/budgetGenerator.test.js
CREATE: /backend/tests/integration/budgets.test.js
UPDATE: /backend/docs/API.md (document budget/goal endpoints)
```

#### Acceptance Criteria:
- ✅ AI generates realistic budgets based on spending history
- ✅ Budgets include category-specific limits
- ✅ Savings goals are personalized and achievable
- ✅ Budgets include rationale explaining recommendations
- ✅ Frontend displays budgets and goals clearly
- ✅ Budgets adapt to user's financial situation
- ✅ All tests pass
- ✅ Budgets are explainable

#### AI Prompt Structure:
```
System: You are a financial planner creating personalized budgets.
User: Generate a budget for a user with:
- Monthly income: [amount]
- Historical spending by category: [category breakdown]
- Current savings: [amount]
- Financial goals: [user goals if available]

Create:
- Category spending limits
- Monthly savings target
- Emergency fund goal
- Rationale for each recommendation
```

---

---

## Feature 4: Smart Subscription Cancellation Suggestions

### **PR #36: Smart Subscription Cancellation Suggestions**
**Branch:** `feature/ai-subscription-suggestions`

#### Overview:
Use AI to analyze user subscriptions and suggest which ones might be good candidates for cancellation based on usage patterns, cost, value, and financial goals.

#### Tasks:
- [x] Create subscription analysis service (`subscriptionAnalyzer.js`)
- [x] Design prompt templates for subscription analysis
- [x] Analyze subscription usage patterns and frequency
- [x] Calculate subscription value metrics (cost per use, usage frequency)
- [x] Identify underutilized subscriptions
- [x] Identify duplicate or overlapping subscriptions
- [x] Consider user's financial goals and spending patterns
- [x] Generate personalized cancellation suggestions with rationale
- [x] Rank suggestions by potential savings impact
- [x] Create API endpoint `/ai/subscriptions/:user_id/analyze`
- [x] Create API endpoint `/ai/subscriptions/:user_id/suggestions`
- [x] Add subscription suggestions to AI Features tab
- [x] Create frontend component for subscription analysis display
- [x] Create frontend component for cancellation suggestions
- [x] Display potential savings from cancellations
- [x] Show subscription usage metrics (frequency, cost per use)
- [x] Handle edge cases (few subscriptions, all high-value)
- [x] Test AI consent enforcement
- [ ] Document subscription analysis methodology
- [ ] Update API documentation

#### Files Created/Updated:
```
CREATE: /backend/src/services/ai/subscriptionAnalyzer.js
UPDATE: /backend/src/services/ai/promptTemplates.js (add subscription analysis prompts)
UPDATE: /backend/src/routes/ai.js (add subscription endpoints)
CREATE: /frontend/src/components/user/SubscriptionAnalyzer.jsx
CREATE: /frontend/src/components/user/SubscriptionSuggestions.jsx
UPDATE: /frontend/src/components/user/AIFeaturesTab.jsx (add subscription section)
CREATE: /backend/tests/unit/subscriptionAnalyzer.test.js
CREATE: /backend/tests/integration/subscriptions.test.js
UPDATE: /backend/docs/API.md (document subscription endpoints)
```

#### Acceptance Criteria:
- ✅ AI analyzes subscription usage patterns
- ✅ Identifies underutilized or low-value subscriptions
- ✅ Suggests cancellations with clear rationale
- ✅ Shows potential savings from cancellations
- ✅ Considers user's financial situation and goals
- ✅ Provides actionable recommendations
- ✅ Frontend displays suggestions clearly
- ✅ AI consent enforcement implemented
- ✅ Suggestions are explainable and non-judgmental

#### AI Prompt Structure:
```
System: You are a financial advisor helping users optimize subscription spending.
User: Analyze subscriptions for a user with:
- Subscription list: [merchant names, monthly costs, frequency]
- Usage patterns: [transaction frequency, dates]
- Total subscription spend: [amount]
- Monthly income: [amount]
- Financial goals: [savings goals, budget constraints]
- Spending patterns: [category breakdown]

Analyze:
- Subscription value (cost vs usage)
- Underutilized subscriptions
- Duplicate/overlapping services
- Potential savings opportunities

Suggest:
- Which subscriptions to consider canceling
- Rationale for each suggestion
- Estimated monthly/yearly savings
- Alternative options if applicable
```

#### Key Features:
1. **Usage Analysis**: Calculate cost per use, frequency of transactions
2. **Value Assessment**: Compare subscription cost to usage frequency
3. **Pattern Recognition**: Identify subscriptions that haven't been used recently
4. **Financial Context**: Consider user's income, goals, and overall spending
5. **Savings Calculation**: Show potential savings from cancellations
6. **Non-Judgmental Tone**: Empower users to make informed decisions

#### Integration Points:
- Uses existing subscription detection service (`subscriptionDetector.js`)
- Requires AI consent (separate from data processing consent)
- Integrates with behavioral signals (subscription analysis)
- Uses OpenAI for intelligent analysis and suggestions
- Falls back gracefully if AI not available or consent revoked

---

**Note:** The following feature was planned but not implemented:
- **PR #35: Automated Report Generation** - Not implemented

This feature can be implemented in future iterations if needed.

---

## Testing & Quality Assurance

### **PR #37: AI Features Testing & Integration**
**Branch:** `feature/ai-testing`

#### Tasks:
- [ ] Write comprehensive unit tests for all AI services
- [ ] Write integration tests for all AI endpoints
- [ ] Test AI consent enforcement across all features
- [ ] Test fallback mechanisms when AI consent revoked
- [ ] Test error handling for AI API failures
- [ ] Test rate limiting and caching
- [ ] Performance testing (response times, API call counts)
- [ ] Test with various user profiles and personas
- [ ] Test edge cases (insufficient data, API timeouts)
- [ ] Validate AI output quality (tone, accuracy, relevance)
- [ ] Test cost optimization (caching, batch requests)
- [ ] Update test documentation

#### Files Created/Updated:
```
UPDATE: /backend/tests/unit/ (all AI service tests)
UPDATE: /backend/tests/integration/ (all AI endpoint tests)
CREATE: /backend/tests/unit/aiIntegration.test.js
CREATE: /backend/docs/TESTING.md (AI features testing guide)
```

#### Acceptance Criteria:
- All unit tests pass
- All integration tests pass
- AI consent is properly enforced
- Fallbacks work correctly
- Error handling is robust
- Performance meets requirements
- Test coverage > 80% for AI features

---

## Documentation & Deployment

### **PR #38: AI Features Documentation**
**Branch:** `feature/ai-documentation`

#### Tasks:
- [x] Document AI features in main README
- [x] Create AI features usage guide
- [x] Document prompt engineering approach
- [x] Document cost optimization strategies
- [x] Update API documentation with AI endpoints
- [x] Update schema documentation
- [x] Create operator guide for AI features
- [x] Document consent management
- [x] Create troubleshooting guide
- [x] Update limitations documentation

#### Files Created/Updated:
```
CREATE: /backend/docs/AI_FEATURES.md ✅
CREATE: /backend/docs/AI_PROMPTS.md ✅
CREATE: /backend/docs/AI_COST_OPTIMIZATION.md ✅
CREATE: /backend/docs/AI_FEATURES_TROUBLESHOOTING.md ✅
CREATE: /backend/docs/AI_OPERATOR_GUIDE.md ✅
UPDATE: /backend/docs/API.md (AI endpoints including subscriptions) ✅
UPDATE: /backend/docs/SCHEMA.md (AI consent table) ✅
UPDATE: /README.md (AI features section) ✅
UPDATE: /backend/docs/LIMITATIONS.md (AI limitations) ✅
```

#### Acceptance Criteria:
- ✅ All AI features are documented
- ✅ Prompt engineering is explained
- ✅ Cost optimization strategies documented
- ✅ API documentation is complete (including subscription endpoints)
- ✅ Operator guide is available
- ✅ Troubleshooting guide is helpful
- ✅ Consent management documented
- ✅ Schema documentation updated
- ✅ Limitations documentation updated

---

## Implementation Order & Dependencies

### Phase 1: Foundation (Must complete first)
1. **PR #31: AI Infrastructure Setup & Consent Management** ⚠️ **REQUIRED FIRST**

### Phase 2: Core AI Features (Completed)
2. **PR #32: Dynamic Rationale Generation** ✅ **COMPLETED** (High impact, adds AI rationales alongside existing template rationales)
3. **PR #33: Predictive Financial Insights** ✅ **COMPLETED** (High value, new feature in AI Features tab)

### Phase 3: Advanced Features (Completed)
4. **PR #34: Budget and Goal Generation** ✅ **COMPLETED** (High value, new feature in AI Features tab)

### Phase 4: Additional Features (Completed)
5. **PR #36: Smart Subscription Cancellation Suggestions** ✅ **COMPLETED** (AI-powered subscription analysis and cancellation suggestions)

### Phase 4: Quality & Documentation
- **PR #37: AI Features Testing & Integration** - Partially completed (unit and integration tests exist for implemented features)
- **PR #38: AI Features Documentation** - ✅ **COMPLETED** (Comprehensive documentation created)

---

## Key Considerations

### Consent Management
- AI consent is **separate** from data processing consent
- AI features require **AI consent only** (independent of data processing consent)
- Users can grant AI consent without data processing consent to use AI features
- Users can grant data processing consent without AI consent (AI features disabled, existing features work)
- AI consent toggle appears below data processing consent in UI
- **Existing functionality remains unchanged** - template-based rationales, recommendations, etc. all work as before

### Fallback Mechanisms
- When AI consent is revoked: AI features are disabled, existing features continue to work
- When AI API fails: gracefully handle error, show message to user, existing features continue to work
- When insufficient data: provide helpful error messages, existing features continue to work
- Always ensure core functionality works without AI (no regressions)
- AI features are **additive** - they don't replace existing functionality

### Cost Optimization
- Cache AI responses aggressively (5-10 minute TTL for most features)
- Use GPT-3.5-turbo for simple tasks (categorization, normalization)
- Use GPT-4 for complex reasoning (rationales, predictions, reports)
- Batch requests when possible
- Set monthly budget limits
- Monitor API usage

### Error Handling
- Graceful degradation when AI API fails
- Clear error messages for users
- Logging for debugging
- Retry logic with exponential backoff
- Rate limit handling

### Security & Privacy
- Never send full transaction data to AI (summarize instead)
- Mask sensitive information (account numbers, exact amounts)
- Validate AI output before returning to users
- Audit all AI-generated content
- Comply with data privacy regulations

---

## Success Metrics

### Technical Metrics
- AI consent adoption rate (% users who grant AI consent)
- AI feature usage rate (% users using each AI feature)
- API response time (target: <3 seconds for AI features)
- Cache hit rate (target: >70%)
- Error rate (target: <1%)
- API cost per user per month (target: <$0.50)

### Quality Metrics
- User satisfaction with AI features (feedback ratings)
- Rationale quality (compared to templates)
- Prediction accuracy (for predictive insights)
- Budget adherence (for budget generation)
- Report usefulness (user feedback)

### Business Metrics
- User engagement increase
- Feature adoption rates
- Time saved for operators
- User retention improvement

---

## Notes

- All AI features require **AI consent only** (independent of data processing consent)
- AI features are opt-in (users must explicitly enable)
- AI features can be disabled at any time (revoke consent)
- **Existing functionality remains completely unchanged** - template-based rationales, recommendations, etc. all work as before
- AI features are **additive** - they add new capabilities without replacing existing ones
- AI rationale is provided as additional `ai_rationale` field alongside existing `rationale` field
- AI Features tab is added to Dashboard (Overview, Transactions, Insights, **AI Features**)
- All AI-generated content must pass existing guardrails (tone validation, etc.)
- Cost monitoring is critical - set up alerts for API usage
- Prompt engineering is iterative - expect to refine prompts based on results
- No regressions - all existing tests must continue to pass

