# AI Features Documentation

## Overview

SpendSense includes AI-powered features that provide enhanced personalization and insights using OpenAI's GPT-4. All AI features require separate AI consent (independent of data processing consent) and are opt-in.

## AI Features

### 1. Dynamic Rationale Generation

**Description:** AI-generated personalized recommendation rationales that explain why each recommendation is relevant to the user's specific financial situation.

**How It Works:**
- Analyzes user's behavioral signals, persona, and financial data
- Generates contextual rationales citing specific numbers and data points
- Uses template rationales as fallback when AI consent is not granted
- Validates tone to ensure non-judgmental, empowering language

**API Endpoint:** Integrated into `/recommendations/:user_id` endpoint

**Requirements:**
- AI consent must be granted
- OpenAI API key must be configured
- User must have data processing consent (for behavioral signals)

**Caching:** 24-hour cache per user

**Example:**
```
Template Rationale: "We noticed you have 5 recurring subscriptions..."

AI Rationale: "Based on your Subscription-Heavy profile, you have 5 
subscriptions costing $75/month. This guide will help you optimize your 
subscription spending and potentially save money."
```

---

### 2. Predictive Financial Insights

**Description:** Forecasts future spending, income, and cash flow for short-term (7 days), medium-term (30 days), and long-term (90 days) horizons.

**How It Works:**
- Analyzes transaction patterns and trends
- Projects future income and expenses
- Identifies potential stress points
- Provides actionable recommendations

**API Endpoints:**
- `GET /ai/predictions/:user_id?horizon=30` - Get predictions for specific horizon
- `GET /ai/predictions/:user_id/all` - Get predictions for all horizons

**Parameters:**
- `horizon` (optional): 7, 30, or 90 days (default: 30)

**Response Structure:**
```json
{
  "success": true,
  "predictions": {
    "horizon_days": 30,
    "predicted_income": 5000,
    "predicted_expenses": 3500,
    "predicted_net_flow": 1500,
    "confidence_level": "high",
    "stress_points": [],
    "recommendations": ["Continue current patterns"]
  }
}
```

**Requirements:**
- AI consent must be granted
- OpenAI API key must be configured
- User must have at least 30 days of transaction history

**Caching:** 24-hour cache per user per horizon

---

### 3. Budget & Goal Generation

**Description:** AI-powered personalized budgets and savings goals based on user's spending history and financial situation.

#### Budget Generation

**API Endpoint:** `GET /ai/budgets/:user_id/generate`

**Features:**
- Category-specific spending limits
- Monthly savings targets
- Emergency fund goals
- Rationale for each recommendation

**Response Structure:**
```json
{
  "success": true,
  "budget": {
    "categories": [
      {
        "category": "FOOD_AND_DRINK",
        "monthly_limit": 400,
        "current_avg": 450,
        "rationale": "Based on your current spending..."
      }
    ],
    "monthly_savings_target": 500,
    "emergency_fund_goal": 6000,
    "rationale": "Overall budget rationale..."
  }
}
```

#### Goal Generation

**API Endpoint:** `GET /ai/goals/:user_id/generate`

**Features:**
- SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound)
- Mix of short-term (1-3 months) and medium-term (3-12 months) goals
- Personalized based on financial situation
- Rationale for each goal

**Response Structure:**
```json
{
  "success": true,
  "goals": {
    "goals": [
      {
        "name": "Emergency Fund",
        "target_amount": 3000,
        "current_progress": 500,
        "target_date": "2024-06-01",
        "timeframe": "short_term",
        "rationale": "Build an emergency fund..."
      }
    ],
    "rationale": "Overall goal rationale..."
  }
}
```

**Requirements:**
- AI consent must be granted
- OpenAI API key must be configured
- User must have at least 90 days of transaction history (for accurate analysis)

**Caching:** 7-day cache per user

**Error Handling:**
If insufficient data, returns:
```json
{
  "success": false,
  "error": {
    "message": "Not enough transaction history...",
    "code": "INSUFFICIENT_DATA",
    "recommendations": ["Add more transactions", "..."]
  }
}
```

---

### 4. Subscription Cancellation Suggestions

**Description:** Smart analysis of subscription usage patterns to suggest which subscriptions might be good candidates for cancellation.

**How It Works:**
- Analyzes subscription usage frequency and cost
- Calculates value metrics (cost per use, usage frequency)
- Identifies underutilized subscriptions
- Considers user's financial situation and goals
- Provides personalized cancellation suggestions with rationale

**API Endpoints:**
- `GET /ai/subscriptions/:user_id/analyze` - Analyze subscriptions with value metrics
- `GET /ai/subscriptions/:user_id/suggestions` - Get AI-powered cancellation suggestions

**Analysis Response:**
```json
{
  "success": true,
  "analysis": {
    "user_id": 1,
    "subscriptions": [
      {
        "merchant_name": "Netflix",
        "monthlySpend": 15.99,
        "usageFrequency": 4.5,
        "costPerUse": 3.55,
        "valueScore": 0.85,
        "isUnderutilized": false
      }
    ],
    "summary": {
      "total_subscriptions": 3,
      "total_monthly_recurring_spend": 45.99,
      "subscription_share_of_income": 2.5,
      "underutilized_count": 1
    }
  }
}
```

**Suggestions Response:**
```json
{
  "success": true,
  "suggestions": {
    "suggestions": [
      {
        "merchant_name": "Unused Service",
        "monthly_cost": 29.99,
        "rationale": "This subscription has been used only once in the last 30 days...",
        "potential_alternatives": "Consider switching to a free tier",
        "priority": "high",
        "potential_savings": {
          "monthly": 29.99,
          "yearly": 359.88
        }
      }
    ],
    "summary": {
      "total_suggestions": 1,
      "potential_monthly_savings": 29.99,
      "potential_yearly_savings": 359.88
    }
  }
}
```

**Requirements:**
- AI consent must be granted
- OpenAI API key must be configured
- User must have detected recurring subscriptions

**Caching:** 5-minute cache per user

---

## AI Consent Management

### Consent Independence

AI consent is **independent** of data processing consent:
- **Data Processing Consent:** Required for behavioral analysis, persona assignment, and recommendations
- **AI Consent:** Required only for AI-powered features (rationales, predictions, budgets, goals, subscription suggestions)

### Consent Workflow

1. **Grant AI Consent:**
   ```http
   POST /ai-consent
   Content-Type: application/json
   
   {
     "user_id": 1
   }
   ```

2. **Check AI Consent Status:**
   ```http
   GET /ai-consent/:user_id
   ```

3. **Revoke AI Consent:**
   ```http
   DELETE /ai-consent/:user_id
   ```

### Consent States

- **granted:** AI features are enabled
- **revoked:** AI features are disabled (fall back to templates)
- **no_consent:** No consent record exists (default state)

### Fallback Behavior

When AI consent is revoked:
- Rationale generation falls back to template rationales
- Predictive insights return 403 (Forbidden)
- Budget/goal generation returns 403 (Forbidden)
- Subscription suggestions return 403 (Forbidden)

---

## Configuration

### Environment Variables

```bash
# Required for AI features
OPENAI_API_KEY=sk-...

# Optional: Model configuration
OPENAI_MODEL=gpt-4  # Default: gpt-4
```

### Setup

1. **Get OpenAI API Key:**
   - Sign up at https://platform.openai.com
   - Generate an API key in your account settings

2. **Configure Environment:**
   ```bash
   # In backend/.env or environment variables
   export OPENAI_API_KEY=sk-your-api-key-here
   ```

3. **Verify Configuration:**
   ```bash
   # Check if OpenAI is configured
   curl http://localhost:3001/health
   ```

---

## Cost Optimization

AI features use several strategies to optimize API costs:

1. **Caching:**
   - Rationales: 24-hour cache
   - Predictions: 24-hour cache per horizon
   - Budgets/Goals: 7-day cache
   - Subscription suggestions: 5-minute cache

2. **Data Sanitization:**
   - Only sends summarized data, not full transaction lists
   - Removes sensitive information before sending to AI

3. **Rate Limiting:**
   - 100 requests per user per minute (configurable)
   - Prevents API abuse

4. **Error Handling:**
   - Graceful fallbacks when API fails
   - No unnecessary retries on errors

For detailed cost optimization strategies, see [`AI_COST_OPTIMIZATION.md`](./AI_COST_OPTIMIZATION.md).

---

## Error Handling

### Common Errors

**403 Forbidden - AI Consent Required:**
```json
{
  "success": false,
  "error": {
    "message": "AI consent is required for AI-powered features",
    "code": "AI_CONSENT_REQUIRED"
  }
}
```

**500 Internal Server Error - OpenAI Not Configured:**
```json
{
  "success": false,
  "error": {
    "message": "OpenAI API is not configured",
    "code": "OPENAI_NOT_CONFIGURED"
  }
}
```

**429 Too Many Requests:**
```json
{
  "success": false,
  "error": {
    "message": "AI service is temporarily unavailable due to rate limits...",
    "code": "RATE_LIMIT_EXCEEDED",
    "retryAfter": 60
  }
}
```

**400 Bad Request - Insufficient Data:**
```json
{
  "success": false,
  "error": {
    "message": "Not enough transaction history...",
    "code": "INSUFFICIENT_DATA"
  }
}
```

---

## Usage Examples

### Frontend Integration

```javascript
import { useAIConsent } from '../hooks/useAIConsent';
import { getAllPredictions } from '../services/api';

const MyComponent = () => {
  const { userId } = useAuth();
  const { hasAIConsent } = useAIConsent(userId);
  
  useEffect(() => {
    if (hasAIConsent) {
      // Load AI features
      getAllPredictions(userId).then(data => {
        // Handle predictions
      });
    }
  }, [hasAIConsent, userId]);
};
```

### Backend Integration

```javascript
const { generateAIRationale } = require('./services/ai/rationaleGenerator');
const { generatePredictiveInsights } = require('./services/ai/predictiveInsights');

// Generate AI rationale
const rationale = await generateAIRationale(
  item,
  persona,
  behavioralSignals,
  userData
);

// Get predictions
const predictions = await generatePredictiveInsights(userId, 30);
```

---

## Security & Privacy

### Data Privacy

- **Data Sanitization:** All user data is sanitized before sending to OpenAI
- **No PII:** Account IDs are masked, personal information is removed
- **Summarized Data:** Only transaction summaries, not full transaction lists
- **Consent Required:** Users must explicitly grant AI consent

### Security Best Practices

1. **API Key Protection:**
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly

2. **Rate Limiting:**
   - Prevents abuse and excessive costs
   - Configurable per user

3. **Error Handling:**
   - No sensitive data in error messages
   - Graceful degradation

---

## Troubleshooting

For common issues and solutions, see the [Troubleshooting Guide](#troubleshooting) section or [`AI_FEATURES_TROUBLESHOOTING.md`](./AI_FEATURES_TROUBLESHOOTING.md).

---

## Related Documentation

- [`AI_PROMPTS.md`](./AI_PROMPTS.md) - Prompt engineering documentation
- [`AI_COST_OPTIMIZATION.md`](./AI_COST_OPTIMIZATION.md) - Cost optimization strategies
- [`API.md`](./API.md) - Complete API documentation
- [`SCHEMA.md`](./SCHEMA.md) - Database schema including AI consent table

