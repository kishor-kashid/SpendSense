# SpendSense

**From Plaid to Personalized Learning**

An explainable, consent-aware system that detects behavioral patterns from transaction data, assigns personas, and delivers personalized financial education with clear guardrails around eligibility and tone.

## Overview

SpendSense transforms massive transaction data into actionable customer insights without crossing into regulated financial advice. The system:

- Analyzes Plaid-style transaction data
- Detects behavioral patterns (subscriptions, savings, credit, income)
- Assigns users to personas based on their financial behavior
- Generates personalized recommendations with clear, data-driven rationales
- Maintains strict guardrails around consent, eligibility, and tone

## Quick Start (One-Command Setup)

### Prerequisites
- Node.js >= 16.0.0
- npm or yarn

### Full Setup

```bash
# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### Data Generation

Before running the application, generate synthetic data:

```bash
cd backend
npm run generate-data
```

This will:
- Generate 75 users with 120 days of transaction history (default)
- Create accounts, transactions, and liabilities
- Load data into SQLite database
- Export data to JSON files in `backend/data/synthetic/`

**Custom Data Generation:**
```bash
# Generate 50 users with 90 days of history
npm run generate-data 50 90

# Generate 100 users with 180 days of history
npm run generate-data 100 180
```

**Limits:**
- User count: 50-100 users
- Days of history: 90-180 days

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
Backend runs on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:3000`

### Demo Login Credentials

**Customer Login:**
- Username: `first_name + last_name` (e.g., "JohnDoe")
- Password: `first_name + last_name + "123"` (e.g., "JohnDoe123")
- Role: `customer`

**Operator Login:**
- Username: `operator`
- Password: `operator123`
- Role: `operator`

> **Note:** See `backend/data/synthetic/users.json` for all available test users.

## Project Structure

```
spendsense/
├── backend/          # Node.js/Express backend API
│   ├── src/          # Source code
│   ├── tests/        # Test files
│   ├── data/         # Synthetic data and database
│   └── docs/         # Backend documentation
├── frontend/         # React/Vite frontend application
│   ├── src/          # Source code
│   └── public/       # Static assets
├── memory-bank/      # Project documentation and context
└── README.md         # This file
```

## Features

### Behavioral Signal Detection
- **Subscriptions:** Recurring merchant detection, monthly spend analysis
- **Savings:** Net inflow tracking, growth rate, emergency fund coverage
- **Credit:** Utilization analysis, payment patterns, overdue detection
- **Income:** Stability detection, payment frequency, cash-flow buffer

### Persona System
Five personas based on behavioral patterns:

1. **High Utilization** (Priority 5) - Focus on debt reduction
   - Target: Credit utilization ≥50%, interest charges, overdue payments
   - Focus: Payment planning, autopay, debt paydown strategies

2. **Variable Income Budgeter** (Priority 4) - Focus on budgeting for irregular income
   - Target: Median pay gap >45 days AND cash-flow buffer <1 month
   - Focus: Percent-based budgets, emergency fund basics, income smoothing

3. **Subscription-Heavy** (Priority 3) - Focus on subscription management
   - Target: ≥3 recurring merchants AND (monthly spend ≥$50 OR share ≥10%)
   - Focus: Subscription audit, cancellation tips, bill management

4. **Savings Builder** (Priority 2) - Focus on goal setting and optimization
   - Target: Savings growth ≥2% OR net inflow ≥$200/month AND all utilizations <30%
   - Focus: Goal setting, automation, HYSA/CD basics, investment starter

5. **New User** (Priority 1) - Focus on new credit/loan offers
   - Target: Created within 90 days AND limited credit (<$1,000 limits) AND ≤2 accounts
   - Focus: Build credit history, understand financial products, starter credit cards

### Recommendation Engine
- 3-5 personalized education items per user
- 1-3 partner offers with eligibility checks
- Plain-language rationales citing specific data points
- Mandatory disclaimers on all recommendations
- Operator review queue for oversight

### Guardrails
- **Consent Management:** Opt-in/opt-out at any time
- **Eligibility Filtering:** Income, credit, existing accounts
- **Tone Validation:** No shaming, empowering language
- **Operator Oversight:** Review, approve, override capabilities

## Success Criteria

| Metric | Target |
|--------|--------|
| Coverage | 100% users with persona + ≥3 behaviors |
| Explainability | 100% recommendations with rationales |
| Latency | <5 seconds per user |
| Auditability | 100% recommendations with decision traces |
| Code Quality | ≥10 passing tests |
| Documentation | Complete schema and decision log |

## Development

### Backend Scripts

```bash
cd backend
npm start          # Start server
npm run dev        # Start with auto-reload (nodemon)
npm test           # Run tests
npm run lint       # Run ESLint
npm run format     # Format with Prettier
```

### Frontend Scripts

```bash
cd frontend
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm test           # Run tests
npm run lint       # Run ESLint
npm run format     # Format with Prettier
```

## API Documentation

Comprehensive API documentation is available in [`backend/docs/API.md`](./backend/docs/API.md).

### Quick API Reference

- `GET /health` - Health check
- `POST /auth/login` - User authentication
- `GET /users` - List all users
- `GET /users/:id` - Get user details
- `POST /consent` - Grant consent
- `GET /consent/:user_id` - Get consent status
- `DELETE /consent/:user_id` - Revoke consent
- `GET /profile/:user_id` - Get behavioral profile
- `GET /recommendations/:user_id` - Get recommendations
- `GET /transactions/:user_id` - Get transactions
- `GET /transactions/:user_id/insights` - Get spending insights
- `POST /feedback` - Submit feedback
- `GET /operator/review` - Get review queue
- `POST /operator/approve` - Approve recommendation
- `POST /operator/override` - Override recommendation
- `GET /operator/users` - Get all users (operator view)

## Data Generation

### Generating Synthetic Data

SpendSense includes a synthetic data generator that creates realistic Plaid-style transaction data for testing and development.

**Basic Usage:**
```bash
cd backend
npm run generate-data
```

**With Custom Parameters:**
```bash
# Syntax: npm run generate-data [userCount] [daysOfHistory]
npm run generate-data 50 90    # 50 users, 90 days
npm run generate-data 75 120   # 75 users, 120 days (default)
npm run generate-data 100 180  # 100 users, 180 days
```

**What Gets Generated:**
- **Users:** Synthetic users with names, usernames, and passwords
- **Accounts:** Checking, savings, credit cards, loans
- **Transactions:** Realistic transaction patterns over time
- **Liabilities:** Credit card balances, interest rates, payment due dates

**Output:**
- Data loaded into SQLite database (`backend/data/database.sqlite`)
- JSON files exported to `backend/data/synthetic/`:
  - `users.json` - User data
  - `accounts.json` - Account data
  - `transactions.json` - Transaction data
  - `liabilities.json` - Liability data

**Data Characteristics:**
- Diverse financial profiles (high utilization, savings builders, subscription-heavy, etc.)
- Realistic transaction patterns (income, expenses, subscriptions)
- Various credit card utilization levels
- Different savings behaviors
- Mix of personas represented

**Regenerating Data:**
Running the generator again will overwrite existing data. To start fresh:
```bash
# Delete existing database (optional)
rm backend/data/database.sqlite

# Generate new data
npm run generate-data
```

## Usage Examples

### Example 1: User Login and View Recommendations

```bash
# 1. Login as a customer
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "JohnDoe",
    "password": "JohnDoe123",
    "role": "customer"
  }'

# 2. Grant consent
curl -X POST http://localhost:3001/consent \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1}'

# 3. Get recommendations
curl http://localhost:3001/recommendations/1
```

### Example 2: Operator Review Workflow

```bash
# 1. Login as operator
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "operator",
    "password": "operator123",
    "role": "operator"
  }'

# 2. Get pending reviews
curl http://localhost:3001/operator/review

# 3. Approve a recommendation
curl -X POST http://localhost:3001/operator/approve \
  -H "Content-Type: application/json" \
  -d '{
    "review_id": 1,
    "operator_notes": "Approved - looks good"
  }'
```

### Example 3: View Behavioral Profile

```bash
# Get user profile with signals and persona
curl http://localhost:3001/profile/1
```

## Database

SpendSense uses SQLite for local storage. Database file: `backend/data/database.sqlite`

Schema documentation: [`backend/docs/SCHEMA.md`](./backend/docs/SCHEMA.md)

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Documentation

- [API Documentation](./backend/docs/API.md) - Complete API reference
- [Database Schema](./backend/docs/SCHEMA.md) - Database schema documentation
- [Decision Log](./backend/docs/DECISION_LOG.md) - Architectural decisions
- [Limitations](./backend/docs/LIMITATIONS.md) - Known limitations and future improvements
- [Personas](./backend/docs/PERSONAS.md) - Persona system documentation
- [Evaluation](./backend/docs/EVALUATION.md) - Evaluation metrics and harness
- [Task List](./spendsense-task-list.md) - Development task breakdown
- [Memory Bank](./memory-bank/) - Project context and documentation

## Core Principles

1. **Transparency over sophistication** - Every recommendation has a clear rationale
2. **User control over automation** - Consent management required
3. **Education over sales** - Focus on learning, not product promotion
4. **Fairness built in from day one** - No predatory products, no shaming

## License

MIT

## Disclaimer

**This is educational content, not financial advice. Consult a licensed advisor for personalized guidance.**
