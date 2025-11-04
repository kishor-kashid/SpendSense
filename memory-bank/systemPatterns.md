# System Patterns: SpendSense

## Architecture Overview

### Modular Structure
The system is organized into clear, independent modules:

```
backend/src/services/
├── ingest/          # Data loading and validation
├── features/        # Signal detection and feature engineering
├── personas/        # Persona assignment logic
├── recommend/       # Recommendation engine
├── guardrails/      # Consent, eligibility, tone checks
└── eval/            # Evaluation harness
```

## Key Design Patterns

### 1. Service Layer Pattern
Each module (features, personas, recommend) is implemented as a service with clear interfaces:
- Input: User ID and time window (30d/180d)
- Output: Structured data (signals, personas, recommendations)
- Dependencies: Database models, configuration constants

### 2. Pipeline Pattern
Data flows through a clear pipeline:
```
Data Ingestion → Feature Detection → Persona Assignment → Recommendation Generation → Guardrails → Output
```

### 3. Guardrail Pattern
All recommendations pass through multiple guardrails:
- **Consent Check:** Must have opt-in consent
- **Eligibility Filter:** Must meet product requirements
- **Tone Validator:** Must pass language checks
- **Disclaimer:** Must include mandatory disclaimer

### 4. Explainability Pattern
Every recommendation includes:
- **Rationale:** "Because" statement citing specific data
- **Data Points:** Concrete numbers (e.g., "Visa ending in 4523 at 68% utilization")
- **Decision Trace:** Full audit trail of how recommendation was generated

### 5. Time Window Pattern
Analysis performed on two windows:
- **30-day window:** Short-term trends
- **180-day window:** Long-term patterns
- Both windows inform persona assignment and recommendations

## Data Models & Relationships

### Core Entities
- **User:** Base entity with consent status (user_id, name, consent_status, created_at)
- **Account:** Linked to User, has type/subtype and balances (account_id, user_id, type, subtype, available_balance, current_balance, credit_limit)
- **Transaction:** Linked to Account, has date, amount, merchant, category (transaction_id, account_id, date, amount, merchant_name, category, pending)
- **Liability:** Linked to Account, has APR, payment details, overdue status (liability_id, account_id, APR, payment details, overdue)
- **Consent:** Linked to User, tracks opt-in/opt-out with timestamps (consent_id, user_id, opted_in, timestamp)

### Relationships
```
User (1) → (N) Account
Account (1) → (N) Transaction
Account (1) → (0-1) Liability
User (1) → (1) Consent
```

### Database Schema
- **Storage:** SQLite database (`backend/data/database.sqlite`)
- **Migrations:** Automatic table creation on database initialization
- **Foreign Keys:** All relationships use ON DELETE CASCADE
- **Indexes:** Created on frequently queried columns (user_id, account_id, date, merchant_name, etc.)

## Data Ingestion Patterns

### Synthetic Data Generation
- **Generator:** `backend/src/services/ingest/dataGenerator.js`
- **Validator:** `backend/src/services/ingest/dataValidator.js`
- **Loader:** `backend/src/services/ingest/dataLoader.js`
- **CLI Script:** `npm run generate-data [userCount] [daysOfHistory]`

### Data Generation Strategy
- **Seeded Random:** Deterministic generation using seed for consistency
- **Profile Types:** 5 financial profile types matching personas
- **Account Types:** Checking, savings, credit cards, money market, HSA
- **Transaction Patterns:** Realistic patterns including subscriptions, income, expenses
- **Data Persistence:** Generated once, stored permanently in SQLite
- **Data Export:** JSON files exported to `backend/data/synthetic/` (excluded from git)

### Data Loading Pattern
1. **Validation:** Validate all data against schema before loading
2. **User Mapping:** Map generated user IDs to database user IDs
3. **Account Mapping:** Track account IDs for transaction linking
4. **Batch Loading:** Load users → accounts → transactions → liabilities
5. **Error Handling:** Skip invalid records, log errors for debugging

## Behavioral Signal Detection Patterns

### Subscription Detection ✅
- **Pattern:** Recurring merchants (≥3 occurrences in 90 days)
- **Cadence:** Monthly/weekly/irregular frequency analysis using coefficient of variation
- **Metrics:** Monthly recurring spend, subscription share of total spend
- **Service:** `backend/src/services/features/subscriptionDetector.js`
- **Implementation:**
  - Detects merchants with ≥3 transactions in 90-day lookback period
  - Calculates cadence using coefficient of variation (CV > 0.5 = irregular)
  - Estimates monthly recurring spend based on cadence
  - Calculates subscription share as percentage of total spend
  - Analyzes both 30-day and 180-day windows
  - Returns threshold flags for persona assignment
- **Testing:** 19 unit tests covering all functions and edge cases

### Savings Detection ✅
- **Pattern:** Net inflow to savings-like accounts (depository type, savings/money market subtypes)
- **Metrics:** Growth rate, emergency fund coverage (savings / avg monthly expenses)
- **Service:** `backend/src/services/features/savingsAnalyzer.js`
- **Implementation:**
  - Calculates net inflow (deposits - withdrawals) to savings accounts
  - Calculates growth rate based on starting balance and net inflow
  - Calculates average monthly expenses from checking account transactions
  - Calculates emergency fund coverage (months of expenses covered)
  - Analyzes both 30-day and 180-day windows
  - Returns threshold flags for persona assignment
- **Testing:** Unit tests for all savings analysis functions

### Credit Detection ✅
- **Pattern:** Utilization analysis (balance / limit)
- **Thresholds:** Low (<30%), Medium (30-50%), High (50-80%), Very High (>80%)
- **Behaviors:** Minimum-payment-only, interest charges, overdue status
- **Service:** `backend/src/services/features/creditAnalyzer.js`
- **Implementation:**
  - Calculates utilization per credit card (balance / limit)
  - Classifies utilization level (low/medium/high)
  - Detects minimum payment-only behavior (payment ≈ minimum with 5% tolerance)
  - Detects interest charges by scanning transactions for keywords
  - Checks overdue status (is_overdue flag or due date comparison)
  - Analyzes both 30-day and 180-day windows
  - Returns threshold flags for persona assignment
- **Testing:** Unit tests for all credit analysis functions

### Income Detection ✅
- **Pattern:** Payroll ACH detection (positive transactions, ACH channel, INCOME category)
- **Metrics:** Payment frequency, median pay gap, cash-flow buffer
- **Service:** `backend/src/services/features/incomeAnalyzer.js`
- **Implementation:**
  - Detects payroll transactions (positive amount, ACH channel or INCOME category)
  - Calculates payment frequency (bi-weekly, monthly, irregular) using median gap
  - Uses coefficient of variation (CV > 0.4) to detect irregular patterns
  - Calculates median pay gap between paychecks
  - Calculates cash-flow buffer (available balance / avg monthly expenses)
  - Analyzes both 30-day and 180-day windows
  - Returns threshold flags for persona assignment
- **Testing:** Unit tests for all income analysis functions
- **Fixed:** Irregular payment detection using coefficient of variation

## Persona Assignment Logic ✅

### Prioritization Pattern
When multiple personas match:
1. Define priority order (High Utilization [5] > Variable Income [4] > Subscription-Heavy [3] > Savings Builder [2] > New User [1])
2. Find all matching personas based on behavioral signals
3. Assign highest priority matching persona
4. Document all matching personas in decision trace for auditability

### Assignment Criteria
- Each persona has clear, measurable criteria
- Criteria use behavioral signals as inputs (from 30-day and 180-day windows)
- Persona matching functions evaluate short_term and long_term analysis results
- Both 30-day and 180-day windows considered
- Fallback to New User persona if no other persona matches
- **Services:** `backend/src/services/personas/personaDefinitions.js`, `personaPrioritizer.js`, `personaAssigner.js`
- **Testing:** 13 unit tests covering persona definitions, prioritization, matching, and end-to-end assignment
- **Documentation:** `backend/docs/PERSONAS.md` with complete persona definitions

### Persona Definitions
1. **High Utilization (Priority 5):** Credit utilization ≥50%, interest charges, minimum-payment-only, or overdue
2. **Variable Income (Priority 4):** Median pay gap >45 days AND cash-flow buffer <1 month
3. **Subscription-Heavy (Priority 3):** ≥3 recurring merchants AND (monthly recurring spend ≥$50 OR subscription share ≥10%)
4. **Savings Builder (Priority 2):** Savings growth rate ≥2% OR net inflow ≥$200/month, AND all card utilizations <30%
5. **New User (Priority 1):** Fallback for users with limited accounts or no matching patterns

## Content Catalog Patterns ✅

### Education Content Catalog
- **Service:** `backend/src/services/recommend/educationCatalog.js`
- **Data:** `backend/data/content/education_items.json`
- **Content:** 24 educational items (articles, guides, calculators, templates)
- **Features:**
  - Persona mapping (all 5 personas covered)
  - Category filtering (article, guide, calculator, template)
  - Recommendation type filtering (debt_paydown, budgeting, etc.)
  - Item selection for personas (scoring based on persona fit and recommendation types)
  - Returns 3-5 items per persona
- **Testing:** 13 unit tests covering loading, filtering, selection, and content quality

### Partner Offers Catalog
- **Service:** `backend/src/services/recommend/partnerOffers.js`
- **Data:** `backend/data/content/partner_offers.json`
- **Content:** 10 partner offers (balance transfer cards, high-yield savings, budgeting apps, subscription tools, credit builder cards, debt consolidation loans, expense tracking apps, cashback cards, bill negotiation services)
- **Features:**
  - Eligibility checking (credit score, income, utilization, excluded account types)
  - Persona mapping (all 5 personas covered)
  - Category filtering (balance_transfer, high_yield_savings, budgeting, etc.)
  - Recommendation type filtering
  - Offer selection for personas with eligibility filtering
  - Returns 1-3 eligible offers per persona
- **Eligibility Criteria:**
  - Minimum credit score (varies by offer type: 650-680)
  - Minimum income (varies by offer: $15,000-$40,000)
  - Maximum utilization (varies by offer: 40-90%)
  - Excluded account types (prevents duplicate account recommendations)
- **Testing:** 30 unit tests covering loading, filtering, eligibility checking, selection, and content quality
- **Configuration:** Eligibility thresholds in `backend/src/config/constants.js` (PARTNER_OFFER_THRESHOLDS)

## Recommendation Generation Pattern

### Selection Logic (To Be Implemented in PR #11)
1. **Education Items:** Select 3-5 items based on persona using `educationCatalog.selectItemsForPersona()`
2. **Partner Offers:** Select 1-3 eligible offers based on persona and user data using `partnerOffers.selectOffersForPersona()`
3. **Rationale Generation:** Create "because" statement for each item (PR #11)
4. **Disclaimer Addition:** Append mandatory disclaimer

### Rationale Template
Format: "We noticed [specific data point]. [Action/recommendation]. [Expected benefit]."

Example: "We noticed your Visa ending in 4523 is at 68% utilization ($3,400 of $5,000 limit). Bringing this below 30% could improve your credit score and reduce interest charges of $87/month."

## API Design Patterns

### RESTful Structure
- `GET /users` - List all users (for demo login)
- `POST /consent` - Record consent
- `GET /profile/:user_id` - Get behavioral profile
- `GET /recommendations/:user_id` - Get recommendations
- `POST /feedback` - Record feedback
- `GET /operator/review` - Operator approval queue

### Error Handling Pattern
- Consistent error response format
- Proper HTTP status codes
- Error messages logged for debugging
- User-friendly error messages in frontend

## Frontend Architecture Patterns

### Component Hierarchy
```
App
├── Login (role selection + user dropdown)
├── UserPortal
│   ├── ConsentPrompt
│   ├── BehavioralProfile
│   └── Dashboard (recommendations)
└── OperatorPortal
    ├── UserList
    ├── SignalViewer
    ├── RecommendationReview
    └── MetricsPanel
```

### State Management
- **AuthContext:** Role and user selection (localStorage persistence)
- **UserContext:** Current user data
- **API Service:** Centralized backend communication

### Simplified Authentication Pattern
- **No passwords:** Demo mode with role selection
- **User Dropdown:** Select from synthetic users
- **localStorage:** Persist session across page refreshes
- **Protected Routes:** Role-based access control

## Testing Patterns

### Unit Tests
- Test each service independently
- Mock database interactions
- Test edge cases and error conditions

### Integration Tests
- Test API endpoints
- Test end-to-end workflows
- Test frontend-backend communication

### Test Organization
```
backend/tests/
├── unit/
│   ├── features.test.js
│   ├── personas.test.js
│   ├── recommendations.test.js
│   └── guardrails.test.js
└── integration/
    ├── api.test.js
    └── workflow.test.js
```

## Configuration Management
- Environment variables for database paths, ports
- Constants file (`backend/src/config/constants.js`) for thresholds:
  - Subscription thresholds (min recurring merchants, min monthly spend, etc.)
  - Savings thresholds (min growth rate, min monthly inflow)
  - Credit thresholds (low/medium/high utilization levels)
  - Income thresholds (max pay gap, min cash-flow buffer)
  - Persona priority order
  - Recommendation limits (min/max education items, partner offers)
  - Partner offer eligibility thresholds (credit scores, income, utilization)
- Content catalogs (education items, partner offers) as JSON files

