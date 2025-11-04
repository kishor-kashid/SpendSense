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

**Parameters:**
- `user_id` (path) - User ID (integer)

**Response:**
```json
{
  "success": true,
  "message": "Consent revoked successfully",
  "consent": {
    "user_id": 1,
    "has_consent": false,
    "status": "revoked",
    "timestamp": "2024-01-01 00:00:00"
  }
}
```

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
        "rationale": "We noticed you have 5 recurring subscriptions, you're spending $75.00/month on subscriptions, subscriptions make up 12% of your spending."
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
      "partner_offers_count": 2
    }
  }
}
```

**Note:** New recommendations are automatically added to the operator review queue with `status: "pending"`. Users can only see recommendations after operator approval.

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

