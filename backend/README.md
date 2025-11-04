# SpendSense Backend

Backend API for SpendSense - Explainable financial insights and recommendation engine.

## Overview

The SpendSense backend provides a RESTful API for:
- User management and authentication
- Behavioral signal detection (subscriptions, savings, credit, income)
- Persona assignment based on financial patterns
- Personalized recommendation generation
- Consent management
- Operator oversight and review workflows

## Quick Start

### Prerequisites
- Node.js >= 16.0.0
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Environment setup (optional):
```bash
cp .env.example .env
```

3. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3001` by default.

### Development Mode

Run in development mode with auto-reload:
```bash
npm run dev
```

### Data Generation

Generate synthetic Plaid-style transaction data for testing:

**Basic Command:**
```bash
npm run generate-data
```

This generates:
- **75 users** (default)
- **120 days** of transaction history (default)
- Accounts, transactions, and liabilities
- Data loaded into SQLite database
- JSON files exported to `data/synthetic/`

**Custom Parameters:**
```bash
# Syntax: npm run generate-data [userCount] [daysOfHistory]
npm run generate-data 50 90    # 50 users, 90 days
npm run generate-data 100 180 # 100 users, 180 days
```

**Parameters:**
- `userCount`: Number of users to generate (50-100)
- `daysOfHistory`: Days of transaction history (90-180)

**Output Files:**
- `data/database.sqlite` - SQLite database with all data
- `data/synthetic/users.json` - User data
- `data/synthetic/accounts.json` - Account data
- `data/synthetic/transactions.json` - Transaction data
- `data/synthetic/liabilities.json` - Liability data

**Generated Data Includes:**
- Diverse user profiles (various financial behaviors)
- Multiple account types (checking, savings, credit cards, loans)
- Realistic transaction patterns
- Subscription transactions
- Income deposits
- Credit card payments and charges
- Loan payments
- Various credit utilization levels
- Different savings behaviors

**Data Validation:**
The generator includes validation to ensure:
- All required fields are present
- Data relationships are correct (users → accounts → transactions)
- Foreign key constraints are satisfied
- Transaction amounts are realistic

**Regenerating Data:**
To regenerate data (overwrites existing):
```bash
npm run generate-data
```

**Note:** Regenerating will overwrite existing data in the database and JSON files.

**Loading from Existing JSON Files:**
If you have existing JSON files in `data/synthetic/`, you can load them directly:
```javascript
const { loadDataFromFiles } = require('./src/services/ingest/dataLoader');
loadDataFromFiles('data/synthetic');
```

The data generator automatically:
1. Generates synthetic data
2. Exports to JSON files
3. Loads into database

So you typically don't need to load JSON files separately unless you're importing external data.

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files (database, constants)
│   ├── models/          # Database models (User, Account, Transaction, etc.)
│   ├── services/        # Business logic services
│   │   ├── ingest/      # Data loading and validation
│   │   ├── features/    # Signal detection (subscriptions, savings, credit, income)
│   │   ├── personas/   # Persona assignment and prioritization
│   │   ├── recommend/   # Recommendation engine and rationale generation
│   │   ├── guardrails/  # Consent, eligibility, tone validation
│   │   └── eval/        # Evaluation metrics and reporting
│   ├── routes/          # API route handlers
│   ├── middleware/      # Express middleware (error handling, validation)
│   └── migrations/      # Database migrations
├── tests/               # Test files
│   ├── unit/            # Unit tests for services
│   └── integration/    # Integration tests for API endpoints
├── data/                # Data files
│   ├── synthetic/       # Synthetic user data
│   ├── content/         # Recommendation content catalogs
│   └── database.sqlite  # SQLite database file
└── docs/                # Documentation
```

## API Documentation

Comprehensive API documentation is available in [`docs/API.md`](./docs/API.md).

### Quick API Reference

**Authentication:**
- `POST /auth/login` - User authentication

**Users:**
- `GET /users` - List all users
- `GET /users/:id` - Get user details

**Consent:**
- `POST /consent` - Grant consent
- `GET /consent/:user_id` - Get consent status
- `DELETE /consent/:user_id` - Revoke consent

**Profile:**
- `GET /profile/:user_id` - Get behavioral profile (signals, persona, decision trace)

**Recommendations:**
- `GET /recommendations/:user_id` - Get personalized recommendations

**Transactions:**
- `GET /transactions/:user_id` - Get transactions
- `GET /transactions/:user_id/insights` - Get spending insights

**Feedback:**
- `POST /feedback` - Submit feedback on recommendations

**Operator:**
- `GET /operator/review` - Get review queue
- `POST /operator/approve` - Approve recommendation
- `POST /operator/override` - Override recommendation
- `GET /operator/users` - Get all users (operator view)

**Health:**
- `GET /health` - Health check

## Database

### SQLite Database

SpendSense uses SQLite for local storage:
- Database file: `./data/database.sqlite`
- Schema documentation: [`docs/SCHEMA.md`](./docs/SCHEMA.md)

### Database Schema

The database consists of 7 main tables:
1. **users** - User accounts and authentication
2. **accounts** - Financial accounts (checking, savings, credit cards, loans)
3. **transactions** - Individual financial transactions
4. **liabilities** - Credit card and loan liability details
5. **consent** - User consent records
6. **feedback** - User feedback on recommendations
7. **recommendation_reviews** - Operator review queue

### Database Initialization

The database is automatically initialized when the server starts. Tables are created if they don't exist.

To manually run migrations:
```javascript
const { createTables } = require('./src/migrations/createTables');
createTables();
```

## Services

### Behavioral Signal Detection

Services in `src/services/features/` detect financial patterns:
- **SubscriptionDetector** - Recurring merchant detection, monthly spend analysis
- **SavingsAnalyzer** - Net inflow tracking, growth rate, emergency fund coverage
- **CreditAnalyzer** - Utilization analysis, payment patterns, overdue detection
- **IncomeAnalyzer** - Stability detection, payment frequency, cash-flow buffer

### Persona Assignment

Services in `src/services/personas/` assign users to personas:
- **PersonaDefinitions** - Defines 5 personas with criteria
- **PersonaAssigner** - Assigns persona based on behavioral signals
- **PersonaPrioritizer** - Prioritizes when multiple personas match

### Recommendation Engine

Services in `src/services/recommend/` generate recommendations:
- **RecommendationEngine** - Main recommendation generation logic
- **EducationCatalog** - Educational content catalog
- **PartnerOffers** - Partner offer catalog
- **RationaleGenerator** - Generates plain-language rationales

### Guardrails

Services in `src/services/guardrails/` enforce safety:
- **ConsentChecker** - Verifies user consent
- **EligibilityFilter** - Checks income, credit, existing accounts
- **ToneValidator** - Validates language (no shaming, empowering)

## Testing

### Run Tests

```bash
npm test
```

### Test Structure

- **Unit Tests** (`tests/unit/`) - Test individual services and functions
- **Integration Tests** (`tests/integration/`) - Test API endpoints and workflows

### Test Database

Tests use a separate test database (`test_database.sqlite`) to avoid affecting development data.

## Scripts

- `npm start` - Start the server
- `npm run dev` - Start with nodemon (auto-reload)
- `npm run generate-data` - Generate synthetic data (see Data Generation section)
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Configuration

### Environment Variables

Create a `.env` file (see `.env.example`):

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Constants

Configuration constants are defined in `src/config/constants.js`:
- Time windows (30 days, 180 days)
- Persona criteria thresholds
- Guardrail rules

## Documentation

- [API Documentation](./docs/API.md) - Complete API reference
- [Database Schema](./docs/SCHEMA.md) - Database schema documentation
- [Decision Log](./docs/DECISION_LOG.md) - Architectural decisions
- [Limitations](./docs/LIMITATIONS.md) - Known limitations and future improvements
- [Personas](./docs/PERSONAS.md) - Persona system documentation
- [Evaluation](./docs/EVALUATION.md) - Evaluation metrics and harness

## Authentication

SpendSense uses simplified authentication for demo purposes:

**Customer Login:**
- Username: `first_name + last_name` (e.g., "JohnDoe")
- Password: `first_name + last_name + "123"` (e.g., "JohnDoe123")

**Operator Login:**
- Username: `operator`
- Password: `operator123`

> **Note:** Passwords are stored in plain text (acceptable for demo only). See [LIMITATIONS.md](./docs/LIMITATIONS.md) for production considerations.

## Key Features

### Behavioral Signal Detection
- Detects subscriptions, savings patterns, credit usage, and income stability
- Analyzes both short-term (30d) and long-term (180d) patterns

### Persona System
- Assigns users to one of 5 personas based on behavioral patterns
- Priority-based system ensures critical issues take precedence
- Every persona assignment includes a clear rationale

### Recommendation Generation
- Generates 3-5 education items per user
- Generates 1-3 partner offers with eligibility checks
- Every recommendation includes a plain-language rationale
- All recommendations pass through consent, eligibility, and tone guardrails

### Operator Review Queue
- All recommendations automatically added to review queue
- Operators can approve or override recommendations
- Full decision traces stored for auditability

## Development Guidelines

### Code Organization
- Services are organized by domain (features, personas, recommend, guardrails)
- Each service has a clear interface (input: user_id, output: structured data)
- Models handle database operations
- Routes handle HTTP requests/responses

### Error Handling
- Use middleware error handler for consistent error responses
- Return structured error objects with `success: false` and error details
- Use appropriate HTTP status codes

### Testing
- Write unit tests for all services
- Write integration tests for all API endpoints
- Aim for >80% test coverage

## License

MIT
