# Active Context: SpendSense

## Current Status
**Project Phase:** Foundation Complete, Ready for Feature Detection
**Date:** After PR #3 completion

## Current Work Focus
- **Foundation phase complete:** PRs #1-3 successfully implemented
- **Data generation:** 75 users, 218 accounts, 8,133 transactions, 66 liabilities loaded
- **Next steps:** Ready to begin PR #4 (Behavioral Signal Detection - Subscriptions)

## Recent Changes

### Completed (PRs #1-3)
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

### Technical Decisions
- **Frontend build tool:** Vite (not Create React App)
- **Database driver:** better-sqlite3 (synchronous, better performance)
- **Data persistence:** SQLite file persists across sessions (permanent data)
- **Data generation:** One-time generation, not regenerated on server start
- **Git strategy:** Synthetic data folder excluded from version control

## Next Steps (Immediate)

### Phase 2: Backend Core (PRs #4-7)
**Next up: PR #4: Behavioral Signal Detection - Subscriptions**
- Implement recurring merchant detection (≥3 occurrences in 90 days)
- Calculate monthly/weekly cadence
- Calculate monthly recurring spend
- Calculate subscription share of total spend
- Service for 30-day and 180-day windows
- Unit tests for subscription detection

Then continue with:
- PR #5: Savings Detection
- PR #6: Credit Detection
- PR #7: Income Detection

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

### Project Structure
**Decision:** Monorepo with separate backend and frontend folders
- Clear separation of concerns
- Independent package.json files
- Shared documentation at root level
- Data generator scripts in `backend/scripts/`

### Development Priority
**Focus Areas:**
1. ✅ Foundation (PRs 1-3) - COMPLETE
2. Core behavioral detection (PRs 4-7) - NEXT
3. Persona system (PR #8)
4. Recommendation engine (PR #11)
5. Guardrails (PRs 12-14)
6. API endpoints (PRs 15-18)
7. Frontend interfaces (PRs 20-26)

## Current Blockers
- None at this time

## Questions Resolved
1. ✅ **Frontend build tool:** Vite selected
2. ✅ **Database column naming:** `credit_limit` instead of `limit` (reserved keyword)
3. ✅ **Data persistence:** Permanent storage in SQLite
4. ✅ **Git strategy:** Synthetic data excluded from version control

## Questions to Resolve
1. **Custom Persona (Persona 6):** Criteria and rationale to be defined during PR #8
2. **Testing framework:** Jest confirmed (in package.json)

## Active Development Notes
- Database file: `backend/data/database.sqlite` (persistent)
- Synthetic data: Generated in `backend/data/synthetic/` (excluded from git)
- Data can be regenerated with: `npm run generate-data [userCount] [daysOfHistory]`
- All models working correctly with foreign key constraints
- Account ID mapping fixed for transaction loading

## Key Metrics to Track
- Coverage: % users with persona + ≥3 behaviors (target: 100%)
- Explainability: % recommendations with rationales (target: 100%)
- Latency: Recommendation generation time (target: <5s)
- Auditability: % recommendations with decision traces (target: 100%)
- Test coverage: Number of passing tests (target: ≥10)

## Communication Notes
- Foundation phase (PRs 1-3) successfully completed
- Data generation working perfectly (8,133 transactions loaded)
- Ready to proceed with behavioral signal detection
- Following structured PR approach for organization
