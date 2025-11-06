# SpendSense API Documentation

## Base URL

```
http://localhost:3001
```

## Authentication

SpendSense uses a simplified authentication system for demo purposes. All authenticated endpoints require a valid user session or operator credentials.

### Authentication Endpoints

#### POST /auth/login

Authenticate a user or operator.

**Request Body:**
```json
{
  "username": "JohnDoe",
  "password": "JohnDoe123",
  "role": "customer"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "username": "JohnDoe",
    "first_name": "John",
    "last_name": "Doe",
    "role": "customer"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "message": "Invalid username or password",
    "code": "INVALID_CREDENTIALS"
  }
}
```

**Operator Login:**
```json
{
  "username": "operator",
  "password": "operator123",
  "role": "operator"
}
```

---

## User Endpoints

### GET /users

List all users (for login dropdown).

**Response:**
```json
{
  "success": true,
  "count": 75,
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "username": "JohnDoe",
      "first_name": "John",
      "last_name": "Doe"
    }
  ]
}
```

### GET /users/:id

Get user details by ID.

**Parameters:**
- `id` (path) - User ID (integer)

**Response:**
```json
{
  "success": true,
  "user": {
    "user_id": 1,
    "name": "John Doe",
    "username": "JohnDoe",
    "first_name": "John",
    "last_name": "Doe",
    "consent_status": "granted",
    "created_at": "2024-01-01 00:00:00"
  }
}
```

---

## Consent Endpoints

### POST /consent

Grant consent (opt-in) for a user.

**Request Body:**
```json
{
  "user_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Consent granted successfully",
  "consent": {
    "user_id": 1,
    "has_consent": true,
    "status": "granted",
    "timestamp": "2024-01-01 00:00:00"
  }
}
```

### GET /consent/:user_id

Get consent status for a user.

**Parameters:**
- `user_id` (path) - User ID (integer)

**Response:**
```json
{
  "success": true,
  "consent": {
    "user_id": 1,
    "has_consent": true,
    "status": "granted",
    "message": "User has granted consent",
    "timestamp": "2024-01-01 00:00:00"
  }
}
```

### DELETE /consent/:user_id

Revoke consent (opt-out) for a user.

---

## AI Consent Endpoints

AI consent is separate from data processing consent. Users must grant both consents to use AI-powered features. AI features will fall back to template-based systems when AI consent is not granted.

### POST /ai-consent

Grant AI consent (opt-in) for AI-powered features.

**Request Body:**
```json
{
  "user_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "AI consent granted successfully",
  "ai_consent": {
    "user_id": 1,
    "has_consent": true,
    "status": "granted",
    "timestamp": "2024-01-01 00:00:00"
  }
}
```

### GET /ai-consent/:user_id

Get AI consent status for a user.

**Parameters:**
- `user_id` (path) - User ID (integer)

**Response:**
```json
{
  "success": true,
  "ai_consent": {
    "user_id": 1,
    "has_consent": true,
    "status": "granted",
    "message": "User has granted consent for AI-powered features.",
    "timestamp": "2024-01-01 00:00:00"
  }
}
```

**Response (No Consent):**
```json
{
  "success": true,
  "ai_consent": {
    "user_id": 1,
    "has_consent": false,
    "status": "no_consent",
    "message": "No AI consent record found. User has not opted in to AI features.",
    "timestamp": null
  }
}
```

### DELETE /ai-consent/:user_id

Revoke AI consent (opt-out) for a user.

**Parameters:**
- `user_id` (path) - User ID (integer)

**Response:**
```json
{
  "success": true,
  "message": "AI consent revoked successfully",
  "ai_consent": {
    "user_id": 1,
    "has_consent": false,
    "status": "revoked",
    "timestamp": "2024-01-01 00:00:00"
  }
}
```

**Notes:**
- AI consent is independent of data processing consent
- Both consents must be granted for AI features to work
- When AI consent is revoked, AI features fall back to template-based systems
- AI consent can be granted/revoked independently of data processing consent

---

## Profile Endpoints

### GET /profile/:user_id

Get behavioral profile for a user (requires consent).

**Parameters:**
- `user_id` (path) - User ID (integer)

**Response:**
```json
{
  "success": true,
  "profile": {
    "user_id": 1,
    "user_name": "John Doe",
    "assigned_persona": {
      "type": "subscription_heavy",
      "name": "Subscription-Heavy",
      "priority": 3
    },
    "persona_rationale": "We noticed you have 5 recurring subscriptions, you're spending $75.00/month on subscriptions, subscriptions make up 12% of your spending.",
    "decision_trace": {
      "persona_assignment": {
        "persona_name": "Subscription-Heavy",
        "matching_personas": ["Subscription-Heavy", "Savings Builder"],
        "rationale": "..."
      },
      "signals": {
        "subscriptions": {
          "recurring_merchants": 5
        }
      },
      "guardrails": {
        "consent_checked": true,
        "eligibility_checked": true,
        "tone_validated": true
      }
    },
    "behavioral_signals": {
      "subscriptions": {
        "recurring_merchants": ["Netflix", "Spotify", "Amazon Prime"],
        "monthly_recurring_spend_30d": 75.00,
        "subscription_share_30d": 0.12
      },
      "savings": {
        "growth_rate_30d": 0.032,
        "emergency_fund_coverage_30d": 2.5,
        "net_inflow_30d": 250.00
      },
      "credit": {
        "cards": [
          {
            "account_name": "Visa ending in 4523",
            "utilization": 0.35,
            "utilization_level": "low",
            "has_interest_charges": false,
            "is_overdue": false
          }
        ]
      },
      "income": {
        "payment_frequency": "biweekly",
        "median_pay_gap_days": 14,
        "cash_flow_buffer_months": 2.5
      }
    },
    "all_matching_personas": [
      {
        "type": "subscription_heavy",
        "name": "Subscription-Heavy",
        "priority": 3
      }
    ],
    "timestamp": "2024-01-01 00:00:00"
  }
}
```

**Error (No Consent):**
```json
{
  "success": false,
  "error": {
    "message": "User has not granted consent for data processing",
    "code": "CONSENT_REQUIRED"
  }
}
```

---

## Recommendation Endpoints

### GET /recommendations/:user_id

Get personalized recommendations for a user (requires consent).

**Parameters:**
- `user_id` (path) - User ID (integer)

**Response (Approved Recommendations):**
```json
{
  "success": true,
  "recommendations": {
    "education_items": [
      {
        "id": "edu_001",
        "title": "How to Audit Your Subscriptions",
        "description": "Learn how to identify and cancel unused subscriptions...",
        "url": "https://example.com/subscription-audit",
        "type": "article",
        "rationale": "We noticed you have 5 recurring subscriptions, you're spending $75.00/month on subscriptions, subscriptions make up 12% of your spending.",
        "ai_rationale": "Based on your Subscription-Heavy profile, you have 5 subscriptions costing $75/month. This guide will help you optimize your subscription spending and potentially save money by identifying unused services."
      }
    ],
    "partner_offers": [
      {
        "id": "offer_001",
        "title": "Subscription Management Tool",
        "description": "Track and manage all your subscriptions in one place...",
        "url": "https://example.com/subscription-tool",
        "provider": "SubscriptionCo",
        "rationale": "Based on your subscription spending patterns, this tool can help you manage your recurring payments.",
        "ai_rationale": "Given your 5 active subscriptions totaling $75/month, this subscription management tool can help you track usage, identify unused services, and optimize your recurring expenses.",
        "eligibility": {
          "income_qualified": true,
          "credit_qualified": true,
          "reason": "Income and credit requirements met"
        }
      }
    ],
    "status": "approved",
    "approved_at": "2024-01-01 00:00:00"
  }
}
```

**Response (Pending Recommendations):**
```json
{
  "success": true,
  "recommendations": {
    "education_items": [],
    "partner_offers": [],
    "status": "pending",
    "pending_message": "Your recommendations are pending operator approval. Please check back later."
  }
}
```

**Response (New Recommendations - Auto-generated):**
```json
{
  "success": true,
  "recommendations": {
    "education_items": [...],
    "partner_offers": [...],
    "summary": {
      "total_recommendations": 5,
      "education_count": 3,
      "partner_offers_count": 2,
      "ai_rationales_available": true
    }
  }
}
```

**Note:** New recommendations are automatically added to the operator review queue with `status: "pending"`. Users can only see recommendations after operator approval.

**AI Rationale Field:**
- The `ai_rationale` field is an **optional** addition to recommendations
- It is only included when:
  1. User has granted **AI consent** (independent of data processing consent)
  2. AI rationale generation succeeds (graceful fallback if it fails)
- Template-based `rationale` field is **always** provided and remains unchanged
- If AI rationale is not available, `ai_rationale` will be `null`
- AI rationale provides personalized, context-aware explanations citing specific user data

---

## AI Features Endpoints

All AI features require **AI consent** only. AI features are independent of data processing consent and are opt-in. They can be disabled at any time.

### GET /ai/predictions/:user_id

Get predictive financial insights for a user. Predicts future cash flow, income, and expenses based on transaction patterns.

**Parameters:**
- `user_id` (path) - User ID (integer)
- `horizon` (query, optional) - Prediction horizon in days. Must be one of: 7, 30, 90 (default: 30)

**Response:**
```json
{
  "success": true,
  "predictions": {
    "horizon_days": 30,
    "generated_at": "2024-01-01T00:00:00.000Z",
    "current_state": {
      "current_balance": 5000.00,
      "avg_daily_income": 166.67,
      "avg_daily_expenses": 120.00,
      "avg_daily_net_flow": 46.67
    },
    "predictions": {
      "predicted_income": 5000.00,
      "predicted_expenses": 3600.00,
      "predicted_net_flow": 1400.00,
      "predicted_end_balance": 6400.00,
      "confidence_level": "high"
    },
    "ai_summary": "Based on your spending patterns, you are projected to have positive cash flow over the next 30 days.",
    "stress_points": [],
    "recommendations": [
      "Continue current spending patterns",
      "Consider increasing savings"
    ],
    "pattern_analysis": {
      "top_categories": [
        { "category": "FOOD_AND_DRINK", "amount": 1200.00 },
        { "category": "TRANSPORTATION", "amount": 800.00 }
      ],
      "income_frequency": "biweekly",
      "transaction_count": 45
    }
  }
}
```

**Response (No AI Consent):**
```json
{
  "success": false,
  "error": {
    "message": "AI consent is required for AI-powered features",
    "code": "AI_CONSENT_REQUIRED"
  }
}
```

### GET /ai/predictions/:user_id/all

Get predictive insights for all horizons (7, 30, and 90 days).

**Parameters:**
- `user_id` (path) - User ID (integer)

**Response:**
```json
{
  "success": true,
  "predictions": {
    "user_id": 1,
    "generated_at": "2024-01-01T00:00:00.000Z",
    "horizons": [7, 30, 90],
    "predictions": {
      "7_days": { ... },
      "30_days": { ... },
      "90_days": { ... }
    }
  }
}
```

**Notes:**
- Predictions are cached for 24 hours to reduce API calls
- Confidence level is based on transaction history quality (low/medium/high)
- Stress points identify potential financial issues (negative cash flow, low balance)
- Recommendations are AI-generated actionable suggestions
- All predictions require AI consent only (independent of data processing consent)

---

### GET /ai/budgets/:user_id/generate

Generate AI-powered budget recommendations based on the user's spending history.

**Parameters:**
- `user_id` (path) - User ID (integer)

**Response (Success):**
```json
{
  "success": true,
  "budget": {
    "success": true,
    "monthly_income": 5000.00,
    "monthly_expenses_avg": 3500.00,
    "categories": [
      {
        "category": "FOOD_AND_DRINK",
        "monthly_limit": 600.00,
        "current_avg": 550.00,
        "rationale": "Your current spending is reasonable. This limit allows for occasional dining out."
      },
      {
        "category": "TRANSPORTATION",
        "monthly_limit": 400.00,
        "current_avg": 380.00,
        "rationale": "Based on your commuting patterns, this limit should cover your transportation needs."
      }
    ],
    "monthly_savings_target": 500.00,
    "emergency_fund_goal": 10500.00,
    "rationale": "Based on your spending patterns, we recommend saving 10% of your monthly income to build a 3-month emergency fund.",
    "generated_at": "2024-01-15T10:30:00.000Z",
    "lookback_days": 90
  }
}
```

**Response (Insufficient Data):**
```json
{
  "success": false,
  "error": {
    "message": "Not enough transaction history to generate a budget. Please add more transactions.",
    "code": "INSUFFICIENT_DATA",
    "recommendations": [
      "Track your spending for at least 2-3 weeks",
      "Ensure transactions are properly categorized",
      "Try again once you have more financial data"
    ]
  }
}
```

**Notes:**
- Budgets are cached for 7 days to reduce API calls
- Requires at least 10 transactions for meaningful analysis
- Budget recommendations are based on 90-day spending history
- Category limits are set based on actual spending patterns
- All budgets require AI consent only (independent of data processing consent)

---

### GET /ai/goals/:user_id/generate

Generate AI-powered personalized savings goals based on the user's financial situation.

**Parameters:**
- `user_id` (path) - User ID (integer)

**Response (Success):**
```json
{
  "success": true,
  "goals": {
    "success": true,
    "goals": [
      {
        "name": "Emergency Fund",
        "target_amount": 10500.00,
        "current_progress": 2000.00,
        "target_date": "2024-12-31",
        "timeframe": "medium_term",
        "rationale": "Build a 3-month emergency fund to cover unexpected expenses. Based on your monthly expenses of $3,500, aim to save $10,500."
      },
      {
        "name": "Vacation Fund",
        "target_amount": 3000.00,
        "current_progress": 500.00,
        "target_date": "2024-06-30",
        "timeframe": "short_term",
        "rationale": "Save for your vacation by setting aside $500/month. This goal is achievable given your current cash flow."
      }
    ],
    "rationale": "Based on your financial situation, we recommend focusing on building an emergency fund first, followed by other savings goals.",
    "generated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response (Insufficient Data):**
```json
{
  "success": false,
  "error": {
    "message": "Not enough transaction history to generate goals. Please add more transactions.",
    "code": "INSUFFICIENT_DATA",
    "recommendations": [
      "Track your spending for at least 2-3 weeks",
      "Try again once you have more financial data"
    ]
  }
}
```

**Notes:**
- Goals are cached for 7 days to reduce API calls
- Goals are SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- Includes mix of short-term (1-3 months) and medium-term (3-12 months) goals
- Goals are personalized based on current financial situation
- All goals require AI consent only (independent of data processing consent)

---

## Transaction Endpoints

### GET /transactions/:user_id

Get all transactions for a user.

**Parameters:**
- `user_id` (path) - User ID (integer)

**Query Parameters:**
- `startDate` (optional) - Start date (YYYY-MM-DD)
- `endDate` (optional) - End date (YYYY-MM-DD)
- `includePending` (optional) - Include pending transactions (true/false)

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "transaction_id": "txn_123",
      "account_id": "acc_123",
      "date": "2024-01-15",
      "amount": -45.99,
      "merchant_name": "Netflix",
      "payment_channel": "online",
      "personal_finance_category_primary": "GENERAL_MERCHANDISE",
      "personal_finance_category_detailed": "SUBSCRIPTIONS",
      "pending": 0,
      "account_type": "depository",
      "account_subtype": "checking"
    }
  ],
  "count": 150
}
```

**Note:** Transactions do not require consent - users can always view their own transaction data.

### GET /transactions/:user_id/insights

Get spending insights and analytics for a user.

**Parameters:**
- `user_id` (path) - User ID (integer)

**Query Parameters:**
- `startDate` (optional) - Start date (YYYY-MM-DD), defaults to 30 days ago
- `endDate` (optional) - End date (YYYY-MM-DD), defaults to today

**Response:**
```json
{
  "success": true,
  "insights": {
    "period": {
      "startDate": "2023-12-01",
      "endDate": "2024-01-01"
    },
    "summary": {
      "totalSpending": 4500.00,
      "totalIncome": 6000.00,
      "netFlow": 1500.00,
      "transactionCount": 120,
      "incomeCount": 4,
      "avgTransactionAmount": 37.50,
      "largestTransaction": {
        "amount": 250.00,
        "merchant": "Amazon",
        "date": "2024-01-15",
        "category": "GENERAL_MERCHANDISE"
      }
    },
    "categoryBreakdown": [
      {
        "category": "GENERAL_MERCHANDISE",
        "amount": 1500.00,
        "count": 45,
        "transactions": [...]
      }
    ],
    "topMerchants": [
      {
        "merchant": "Amazon",
        "amount": 850.00,
        "count": 12
      }
    ],
    "trends": {
      "daily": {
        "2024-01-01": 125.50,
        "2024-01-02": 89.25
      },
      "monthly": {
        "2023-12": 4200.00,
        "2024-01": 4500.00
      }
    }
  }
}
```

---

## Feedback Endpoints

### POST /feedback

Record user feedback on a recommendation.

**Request Body:**
```json
{
  "user_id": 1,
  "recommendation_id": "edu_001",
  "recommendation_type": "education",
  "rating": 5,
  "comment": "Very helpful article!",
  "helpful": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback recorded successfully",
  "feedback": {
    "feedback_id": 1,
    "user_id": 1,
    "recommendation_id": "edu_001",
    "recommendation_type": "education",
    "rating": 5,
    "comment": "Very helpful article!",
    "helpful": true,
    "created_at": "2024-01-01 00:00:00"
  }
}
```

**Field Descriptions:**
- `user_id` (required) - User ID
- `recommendation_id` (optional) - Recommendation ID
- `recommendation_type` (optional) - "education" or "offer"
- `rating` (optional) - Rating 1-5
- `comment` (optional) - Text feedback
- `helpful` (optional) - Boolean indicating if helpful

---

## Operator Endpoints

### GET /operator/review

Get approval queue (pending recommendations).

**Response:**
```json
{
  "success": true,
  "count": 5,
  "reviews": [
    {
      "review_id": 1,
      "user_id": 1,
      "recommendation_data": {
        "education_items": [...],
        "partner_offers": [...],
        "summary": {...}
      },
      "decision_trace": {...},
      "status": "pending",
      "created_at": "2024-01-01 00:00:00"
    }
  ]
}
```

### POST /operator/approve

Approve a recommendation.

**Request Body:**
```json
{
  "review_id": 1,
  "operator_notes": "Approved - looks good",
  "reviewed_by": "operator"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Recommendation approved successfully",
  "review": {
    "review_id": 1,
    "user_id": 1,
    "status": "approved",
    "operator_notes": "Approved - looks good",
    "reviewed_at": "2024-01-01 00:00:00",
    "reviewed_by": "operator"
  }
}
```

### POST /operator/override

Override a recommendation (reject or modify).

**Request Body:**
```json
{
  "review_id": 1,
  "operator_notes": "Rejected - inappropriate content",
  "reviewed_by": "operator"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Recommendation overridden successfully",
  "review": {
    "review_id": 1,
    "user_id": 1,
    "status": "overridden",
    "operator_notes": "Rejected - inappropriate content",
    "reviewed_at": "2024-01-01 00:00:00",
    "reviewed_by": "operator"
  }
}
```

### GET /operator/users

Get all users with persona info and signals (operator view).

**Response:**
```json
{
  "success": true,
  "count": 75,
  "users": [
    {
      "user_id": 1,
      "name": "John Doe",
      "consent_status": "granted",
      "assigned_persona": {
        "type": "subscription_heavy",
        "name": "Subscription-Heavy",
        "priority": 3
      },
      "behavioral_signals": {
        "credit": {...},
        "income": {...},
        "subscriptions": {...},
        "savings": {...}
      },
      "has_profile": true
    }
  ]
}
```

**Note:** Users without consent will have `has_profile: false` and `behavioral_signals: null`.

---

## Health Check

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "SpendSense API is running"
}
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

### Common Error Codes

- `INVALID_USER_ID` - Invalid user ID parameter
- `USER_NOT_FOUND` - User does not exist
- `INVALID_CREDENTIALS` - Invalid login credentials
- `CONSENT_REQUIRED` - User has not granted consent
- `INVALID_ROLE` - Invalid role specified
- `INVALID_RATING` - Rating must be between 1 and 5
- `INVALID_RECOMMENDATION_TYPE` - Type must be "education" or "offer"
- `REVIEW_NOT_FOUND` - Review does not exist
- `INVALID_REVIEW_ID` - Invalid review ID parameter

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (consent required)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Rate Limiting

Currently, there are no rate limits enforced. In production, implement rate limiting to prevent abuse.

---

## CORS

The API accepts requests from `http://localhost:3000` by default. Configure CORS in `.env`:

```
CORS_ORIGIN=http://localhost:3000
```

---

## Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"JohnDoe","password":"JohnDoe123","role":"customer"}'

# Get recommendations
curl http://localhost:3001/recommendations/1
```

### Using Postman

Import the API collection (if available) or manually create requests using the examples above.

---

## Changelog

### Version 1.0.0
- Initial API release
- All endpoints implemented
- Operator review queue system
- Consent management system
- Behavioral signal detection
- Persona assignment system

