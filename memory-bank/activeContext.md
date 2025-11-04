# Active Context: SpendSense

## Current Status
**Project Phase:** Recommendation System In Progress
**Date:** After PR #10 completion

## Current Work Focus
- **PRs #5-10 Complete:** All behavioral signal detection, persona system, and content catalogs implemented
- **Feature detection:** All 4 behavioral signals working (subscriptions, savings, credit, income)
- **Persona system:** Complete with 5 personas and prioritization logic
- **Content catalogs:** Education items and partner offers catalogs ready
- **Next steps:** Ready to begin PR #11 (Recommendation Engine & Rationale Generator)
- **Data status:** 75 users, 218 accounts, 8,133 transactions, 66 liabilities loaded
- **Test status:** 104 tests passing across all modules

## Recent Changes

### Completed (PRs #1-10)
1. **PR #1: Project Setup & Infrastructure** ✅
   - Monorepo structure initialized (backend + frontend)
   - Node.js/Express backend configured (port 3001)
   - React/Vite frontend configured (port 3000)
   - ESLint and Prettier configured for both
   - SQLite database configuration
   - CORS configured for frontend-backend communication
   - .gitignore updated (excludes database and synthetic data)

2. **PR #2: Data Models & Database Schema** ✅
   - All 5 models created (User, Account, Transaction, Liability, Consent)
   - Database migration scripts with automatic table creation
   - Foreign key relationships established
   - Schema documentation completed (SCHEMA.md)
   - Fixed: Changed `limit` column to `credit_limit` (SQLite reserved keyword)

3. **PR #3: Synthetic Data Generator** ✅
   - Data generator for 75 users with diverse financial profiles
   - Generates 5 persona types (High Utilization, Variable Income, Subscription-Heavy, Savings Builder, New User)
   - 218 accounts (checking, savings, credit cards, money market, HSA)
   - 8,133 transactions (120 days of history)
   - 66 liabilities (credit card liabilities)
   - Data validation and loader implemented
   - JSON export functionality
   - Fixed: Transaction loading issues (account ID matching, transaction ID uniqueness)

4. **PR #4: Behavioral Signal Detection - Subscriptions** ✅
   - Recurring merchant detection algorithm (≥3 occurrences in 90 days)
   - Monthly/weekly cadence calculation with irregular pattern detection
   - Monthly recurring spend calculation
   - Subscription share of total spend calculation
   - Service for both 30-day and 180-day windows
   - Comprehensive unit tests (19 tests, all passing)
   - Fixed: Cadence detection using coefficient of variation for irregular patterns

5. **PR #5: Behavioral Signal Detection - Savings** ✅
   - Net inflow detection to savings-like accounts
   - Savings growth rate calculation
   - Emergency fund coverage calculation (savings / avg monthly expenses)
   - Service for both 30-day and 180-day windows
   - Unit tests for all savings analysis functions

6. **PR #6: Behavioral Signal Detection - Credit** ✅
   - Credit utilization calculation (balance / limit)
   - Utilization level classification (low/medium/high)
   - Minimum payment-only behavior detection
   - Interest charge detection
   - Overdue status checking
   - Service for both 30-day and 180-day windows
   - Unit tests for all credit analysis functions

7. **PR #7: Behavioral Signal Detection - Income** ✅
   - Payroll transaction detection (ACH deposits, INCOME category)
   - Payment frequency calculation (bi-weekly, monthly, irregular)
   - Median pay gap calculation
   - Cash-flow buffer calculation (months of expenses covered)
   - Service for both 30-day and 180-day windows
   - Unit tests for all income analysis functions
   - Fixed: Irregular payment detection using coefficient of variation

8. **PR #8: Persona Definitions & Assignment Logic** ✅
   - 5 persona definitions with clear criteria
   - Persona prioritization system (priority 1-5)
   - Persona matching logic based on behavioral signals
   - Persona assignment service
   - Decision trace for auditability
   - Comprehensive unit tests
   - Documentation (PERSONAS.md)

9. **PR #9: Education Content Catalog** ✅
   - Education catalog service (educationCatalog.js)
   - 24 educational content items in JSON
   - Persona mapping for all 5 personas
   - Category and recommendation type filtering
   - Item selection logic for personas
   - Unit tests (13 tests, all passing)
   - Fixed: File path resolution for JSON content

10. **PR #10: Partner Offers Catalog** ✅
    - Partner offers catalog service (partnerOffers.js)
    - 10 partner offers with eligibility criteria
    - Offer types: balance transfer cards, high-yield savings, budgeting apps, subscription tools, credit builder cards, debt consolidation loans, expense tracking apps, cashback cards, bill negotiation services
    - Eligibility checking (credit score, income, utilization, excluded account types)
    - Persona-based offer selection
    - Updated constants.js with eligibility thresholds
    - Unit tests (30 tests, all passing)
    - Fixed: Account type matching logic for excluded account types

### Technical Decisions
- **Frontend build tool:** Vite (not Create React App)
- **Database driver:** better-sqlite3 (synchronous, better performance)
- **Data persistence:** SQLite file persists across sessions (permanent data)
- **Data generation:** One-time generation, not regenerated on server start
- **Git strategy:** Synthetic data folder excluded from version control
- **Testing:** Jest configured with separate test database
- **Cadence detection:** Uses coefficient of variation (CV) to detect irregular patterns

## Next Steps (Immediate)

### Phase 2: Backend Core (PRs #4-14) - In Progress
**Next up: PR #11: Recommendation Engine & Rationale Generator**
- Build recommendation engine that combines persona + signals
- Implement logic to select 3-5 education items per user
- Implement logic to select 1-3 partner offers per user
- Build rationale generator with plain-language explanations
- Create "because" templates citing specific data
- Ensure recommendations include concrete numbers
- Write unit tests for recommendation logic

Then continue with:
- PR #12: Consent Management System
- PR #13: Eligibility Filter
- PR #14: Tone Validator

## Active Decisions & Considerations

### Authentication Approach
**Decision:** Simplified demo mode authentication
- No passwords or JWT tokens
- Role selection (Customer/Operator) + user dropdown
- localStorage persistence
- Demo banner for disclaimer
- **Rationale:** Focus on core functionality over production-ready auth

### Data Generation Strategy
**Decision:** One-time generation, persistent storage
- Data generated once with `npm run generate-data`
- Stored permanently in SQLite database
- Not regenerated on server startup
- Can be regenerated if needed (fresh data, different parameters)
- **Rationale:** Consistent dataset for development and testing

### Feature Detection Pattern
**Decision:** Service-based, windowed analysis
- Each feature detector is a service module
- Analysis performed on 30-day and 180-day windows
- Results include both short-term and long-term metrics
- Threshold-based detection for persona assignment
- **Rationale:** Flexible, reusable pattern for all behavioral signals

### Project Structure
**Decision:** Monorepo with separate backend and frontend folders
- Clear separation of concerns
- Independent package.json files
- Shared documentation at root level
- Data generator scripts in `backend/scripts/`
- Feature services in `backend/src/services/features/`

### Development Priority
**Focus Areas:**
1. ✅ Foundation (PRs 1-3) - COMPLETE
2. ✅ Behavioral Signal Detection (PRs 4-7) - COMPLETE
3. ✅ Persona System (PR #8) - COMPLETE
4. ✅ Content Catalogs (PRs 9-10) - COMPLETE
5. Recommendation engine (PR #11) - NEXT
6. Guardrails (PRs 12-14)
7. API endpoints (PRs 15-18)
8. Frontend interfaces (PRs 20-26)

## Current Blockers
- None at this time

## Questions Resolved
1. ✅ **Frontend build tool:** Vite selected
2. ✅ **Database column naming:** `credit_limit` instead of `limit` (reserved keyword)
3. ✅ **Data persistence:** Permanent storage in SQLite
4. ✅ **Git strategy:** Synthetic data excluded from version control
5. ✅ **Testing framework:** Jest configured with test database
6. ✅ **Cadence detection:** Coefficient of variation used for irregular pattern detection
7. ✅ **Persona system:** 5 personas implemented (custom persona deferred)
8. ✅ **Content catalogs:** Education items and partner offers catalogs implemented
9. ✅ **Test isolation:** Unique IDs in tests to prevent UNIQUE constraint violations

## Questions to Resolve
1. **Custom Persona (Persona 6):** Deferred - 5 personas implemented, custom persona can be added later if needed

## Active Development Notes
- Database file: `backend/data/database.sqlite` (persistent)
- Test database: `backend/data/test_database.sqlite` (auto-created for tests)
- Synthetic data: Generated in `backend/data/synthetic/` (excluded from git)
- Data can be regenerated with: `npm run generate-data [userCount] [daysOfHistory]`
- All models working correctly with foreign key constraints
- All feature detectors: 74 tests passing (subscriptions, savings, credit, income)
- Persona system: 13 tests passing
- Education catalog: 13 tests passing
- Partner offers catalog: 30 tests passing
- Total: 104 tests passing across all modules
- Test command: `npm test` (runs Jest with test database)

## Key Metrics to Track
- Coverage: % users with persona + ≥3 behaviors (target: 100%)
- Explainability: % recommendations with rationales (target: 100%)
- Latency: Recommendation generation time (target: <5s)
- Auditability: % recommendations with decision traces (target: 100%)
- Test coverage: Number of passing tests (target: ≥10) - **Current: 104 tests passing** ✅

## Communication Notes
- Foundation phase (PRs 1-3) successfully completed
- All behavioral signal detection (PRs 4-7) successfully completed
- Persona system (PR #8) successfully completed
- Content catalogs (PRs 9-10) successfully completed
- All unit tests passing (104/104)
- Ready to proceed with recommendation engine (PR #11)
- Following structured PR approach for organization
