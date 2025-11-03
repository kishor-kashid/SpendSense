# Active Context: SpendSense

## Current Status
**Project Phase:** Initialization
**Date:** Project start

## Current Work Focus
- **Memory Bank initialization:** Creating foundational documentation
- **Project understanding:** Reviewing requirements and task list
- **Next steps:** Ready to begin PR #1 (Project Setup & Infrastructure)

## Recent Changes
- Memory Bank structure created
- Core documentation files initialized:
  - projectbrief.md
  - productContext.md
  - systemPatterns.md
  - techContext.md
  - activeContext.md
  - progress.md

## Next Steps (Immediate)

### Phase 1: Foundation (PRs 1-3)
1. **PR #1: Project Setup & Infrastructure**
   - Initialize monorepo structure
   - Set up Node.js backend with Express
   - Set up React frontend
   - Configure ESLint and Prettier
   - Set up SQLite database configuration
   - Create .gitignore files
   - Write initial README.md files

2. **PR #2: Data Models & Database Schema**
   - Define all models (User, Account, Transaction, Liability, Consent)
   - Create database migration scripts
   - Write schema documentation

3. **PR #3: Synthetic Data Generator**
   - Create data generator for 50-100 synthetic users
   - Generate diverse financial profiles
   - Generate account and transaction data
   - Generate liability data
   - Implement data validation and loader

## Active Decisions & Considerations

### Authentication Approach
**Decision:** Simplified demo mode authentication
- No passwords or JWT tokens
- Role selection (Customer/Operator) + user dropdown
- localStorage persistence
- Demo banner for disclaimer
- **Rationale:** Focus on core functionality over production-ready auth

### Project Structure
**Decision:** Monorepo with separate backend and frontend folders
- Clear separation of concerns
- Independent package.json files
- Shared documentation at root level

### Development Priority
**Focus Areas:**
1. Core behavioral detection (PRs 4-7)
2. Persona system (PR #8)
3. Recommendation engine (PR #11)
4. Guardrails (PRs 12-14)
5. API endpoints (PRs 15-18)
6. Frontend interfaces (PRs 20-26)

## Current Blockers
- None at this time

## Questions to Resolve
1. **Custom Persona (Persona 6):** Criteria and rationale to be defined during PR #8
2. **Node.js version:** Determine minimum Node.js version requirement
3. **Testing framework:** Confirm Jest or alternative
4. **Frontend build tool:** CRA vs Vite decision

## Active Development Notes
- Memory Bank will be updated as patterns are discovered
- Decision log will track architectural choices
- All code changes will follow the 30-PR structure outlined in task list

## Key Metrics to Track
- Coverage: % users with persona + ≥3 behaviors (target: 100%)
- Explainability: % recommendations with rationales (target: 100%)
- Latency: Recommendation generation time (target: <5s)
- Auditability: % recommendations with decision traces (target: 100%)
- Test coverage: Number of passing tests (target: ≥10)

## Communication Notes
- User has reviewed requirements and task list
- Ready to proceed with development
- Following structured PR approach for organization

