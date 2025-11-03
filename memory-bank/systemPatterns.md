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
- **User:** Base entity with consent status
- **Account:** Linked to User, has type/subtype and balances
- **Transaction:** Linked to Account, has date, amount, merchant, category
- **Liability:** Linked to Account, has APR, payment details, overdue status
- **Consent:** Linked to User, tracks opt-in/opt-out with timestamps

### Relationships
```
User (1) → (N) Account
Account (1) → (N) Transaction
Account (1) → (0-1) Liability
User (1) → (1) Consent
```

## Behavioral Signal Detection Patterns

### Subscription Detection
- Pattern: Recurring merchants (≥3 occurrences in 90 days)
- Cadence: Monthly/weekly frequency analysis
- Metrics: Monthly recurring spend, subscription share of total

### Savings Detection
- Pattern: Net inflow to savings-like accounts
- Metrics: Growth rate, emergency fund coverage (savings / avg monthly expenses)

### Credit Detection
- Pattern: Utilization analysis (balance / limit)
- Thresholds: ≥30%, ≥50%, ≥80% flags
- Behaviors: Minimum-payment-only, interest charges, overdue status

### Income Detection
- Pattern: Payroll ACH detection
- Metrics: Payment frequency, median pay gap, cash-flow buffer

## Persona Assignment Logic

### Prioritization Pattern
When multiple personas match:
1. Define priority order (High Utilization > Variable Income > Subscription-Heavy > Savings Builder > New Users)
2. Assign highest priority matching persona
3. Document all matching personas in decision trace

### Assignment Criteria
- Each persona has clear, measurable criteria
- Criteria use behavioral signals as inputs
- Both 30-day and 180-day windows considered
- Custom persona (Persona 6) to be defined during development

## Recommendation Generation Pattern

### Selection Logic
1. **Education Items:** Select 3-5 items based on persona and signals
2. **Partner Offers:** Select 1-3 offers based on eligibility and persona
3. **Rationale Generation:** Create "because" statement for each item
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
- Constants file for thresholds (utilization %, subscription thresholds, etc.)
- Content catalogs (education items, partner offers) as JSON files

