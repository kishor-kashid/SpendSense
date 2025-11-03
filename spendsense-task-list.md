# SpendSense - Development Task List & PR Breakdown (Updated)

## Project File Structure

```
spendsense/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── constants.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Account.js
│   │   │   ├── Transaction.js
│   │   │   ├── Liability.js
│   │   │   └── Consent.js
│   │   ├── services/
│   │   │   ├── ingest/
│   │   │   │   ├── dataGenerator.js
│   │   │   │   ├── dataValidator.js
│   │   │   │   └── dataLoader.js
│   │   │   ├── features/
│   │   │   │   ├── subscriptionDetector.js
│   │   │   │   ├── savingsAnalyzer.js
│   │   │   │   ├── creditAnalyzer.js
│   │   │   │   └── incomeAnalyzer.js
│   │   │   ├── personas/
│   │   │   │   ├── personaAssigner.js
│   │   │   │   ├── personaDefinitions.js
│   │   │   │   └── personaPrioritizer.js
│   │   │   ├── recommend/
│   │   │   │   ├── recommendationEngine.js
│   │   │   │   ├── educationCatalog.js
│   │   │   │   ├── partnerOffers.js
│   │   │   │   └── rationaleGenerator.js
│   │   │   ├── guardrails/
│   │   │   │   ├── consentChecker.js
│   │   │   │   ├── eligibilityFilter.js
│   │   │   │   └── toneValidator.js
│   │   │   └── eval/
│   │   │       ├── metricsCalculator.js
│   │   │       └── reportGenerator.js
│   │   ├── routes/
│   │   │   ├── users.js
│   │   │   ├── consent.js
│   │   │   ├── profile.js
│   │   │   ├── recommendations.js
│   │   │   ├── feedback.js
│   │   │   └── operator.js
│   │   ├── middleware/
│   │   │   ├── errorHandler.js
│   │   │   └── validator.js
│   │   ├── utils/
│   │   │   ├── logger.js
│   │   │   └── helpers.js
│   │   └── server.js
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── features.test.js
│   │   │   ├── personas.test.js
│   │   │   ├── recommendations.test.js
│   │   │   └── guardrails.test.js
│   │   └── integration/
│   │       ├── api.test.js
│   │       └── workflow.test.js
│   ├── data/
│   │   ├── synthetic/
│   │   │   ├── users.json
│   │   │   ├── accounts.json
│   │   │   ├── transactions.json
│   │   │   └── liabilities.json
│   │   ├── content/
│   │   │   ├── education_items.json
│   │   │   ├── partner_offers.json
│   │   │   └── prohibited_phrases.json
│   │   └── database.sqlite
│   ├── docs/
│   │   ├── DECISION_LOG.md
│   │   ├── API.md
│   │   ├── SCHEMA.md
│   │   ├── PERSONAS.md
│   │   ├── EVALUATION.md
│   │   └── LIMITATIONS.md
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Loading.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── ProtectedRoute.jsx
│   │   │   │   └── DemoBanner.jsx
│   │   │   ├── user/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── ConsentPrompt.jsx
│   │   │   │   ├── BehavioralProfile.jsx
│   │   │   │   ├── RecommendationCard.jsx
│   │   │   │   ├── EducationItem.jsx
│   │   │   │   └── PartnerOffer.jsx
│   │   │   └── operator/
│   │   │       ├── OperatorDashboard.jsx
│   │   │       ├── UserList.jsx
│   │   │       ├── SignalViewer.jsx
│   │   │       ├── RecommendationReview.jsx
│   │   │       ├── DecisionTrace.jsx
│   │   │       └── MetricsPanel.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── UserPortal.jsx
│   │   │   └── OperatorPortal.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── UserContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useConsent.js
│   │   │   └── useRecommendations.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   ├── formatters.js
│   │   │   └── validators.js
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   ├── Login.css
│   │   │   └── DemoBanner.css
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   └── README.md
├── .gitignore
├── README.md
└── REQUIREMENTS.md
```

---

## Development Task List

### **PR #1: Project Setup & Infrastructure**
**Branch:** `feature/project-setup`

#### Tasks:
- [ ] Initialize monorepo structure with backend and frontend folders
- [ ] Set up Node.js backend with Express
- [ ] Set up React frontend with Create React App or Vite
- [ ] Configure ESLint and Prettier for both frontend and backend
- [ ] Set up SQLite database configuration
- [ ] Create .gitignore files
- [ ] Write initial README.md files

#### Files Created/Updated:
```
CREATE: /backend/package.json
CREATE: /backend/src/server.js
CREATE: /backend/src/config/database.js
CREATE: /backend/src/config/constants.js
CREATE: /backend/.env.example
CREATE: /backend/README.md
CREATE: /frontend/package.json
CREATE: /frontend/src/App.jsx
CREATE: /frontend/src/index.js
CREATE: /frontend/public/index.html
CREATE: /frontend/README.md
CREATE: /README.md
CREATE: /REQUIREMENTS.md
CREATE: /.gitignore
```

#### Acceptance Criteria:
- Backend server runs on `npm start` (port 3001)
- Frontend runs on `npm start` (port 3000)
- Database connection established
- Both environments have linting configured
- CORS configured for frontend-backend communication
- Environment variables setup (.env.example provided)

---

### **PR #2: Data Models & Database Schema**
**Branch:** `feature/data-models`

#### Tasks:
- [ ] Define User model with fields (user_id, name, consent_status, created_at)
- [ ] Define Account model (account_id, user_id, type, subtype, balances, currency)
- [ ] Define Transaction model (transaction_id, account_id, date, amount, merchant, category)
- [ ] Define Liability model (liability_id, account_id, APR, payment_details, overdue_status)
- [ ] Define Consent model (consent_id, user_id, opted_in, timestamp)
- [ ] Create database migration scripts
- [ ] Write schema documentation

#### Files Created/Updated:
```
CREATE: /backend/src/models/User.js
CREATE: /backend/src/models/Account.js
CREATE: /backend/src/models/Transaction.js
CREATE: /backend/src/models/Liability.js
CREATE: /backend/src/models/Consent.js
CREATE: /backend/docs/SCHEMA.md
UPDATE: /backend/src/config/database.js
```

#### Acceptance Criteria:
- All models properly defined with relationships
- Database tables created successfully
- Schema documentation is complete
- Models can be imported and used
- Foreign key relationships established

---

### **PR #3: Synthetic Data Generator**
**Branch:** `feature/data-generator`

#### Tasks:
- [ ] Create data generator for 50-100 synthetic users
- [ ] Generate diverse financial profiles (various income levels, credit behaviors)
- [ ] Generate realistic account data (checking, savings, credit cards, etc.)
- [ ] Generate 90-180 days of transaction history per user
- [ ] Generate liability data (credit cards with utilization, mortgages, loans)
- [ ] Implement data validation logic
- [ ] Create data loader to import synthetic data into database
- [ ] Export data as JSON files

#### Files Created/Updated:
```
CREATE: /backend/src/services/ingest/dataGenerator.js
CREATE: /backend/src/services/ingest/dataValidator.js
CREATE: /backend/src/services/ingest/dataLoader.js
CREATE: /backend/data/synthetic/users.json
CREATE: /backend/data/synthetic/accounts.json
CREATE: /backend/data/synthetic/transactions.json
CREATE: /backend/data/synthetic/liabilities.json
UPDATE: /backend/src/config/constants.js
```

#### Acceptance Criteria:
- Generates 50-100 users with diverse profiles
- No real PII (fake names, masked account numbers)
- Data matches Plaid structure
- Data validates against schema
- Can load data into SQLite database
- JSON exports are properly formatted
- Users have varied financial situations (different personas represented)

---

### **PR #4: Behavioral Signal Detection - Subscriptions**
**Branch:** `feature/subscription-detection`

#### Tasks:
- [ ] Implement recurring merchant detection algorithm (≥3 occurrences in 90 days)
- [ ] Calculate monthly/weekly cadence for recurring transactions
- [ ] Calculate total monthly recurring spend
- [ ] Calculate subscription share of total spend
- [ ] Create service to analyze subscriptions for 30-day and 180-day windows
- [ ] Write unit tests for subscription detection

#### Files Created/Updated:
```
CREATE: /backend/src/services/features/subscriptionDetector.js
CREATE: /backend/tests/unit/features.test.js (subscription tests)
UPDATE: /backend/src/config/constants.js (add subscription thresholds)
```

#### Acceptance Criteria:
- Detects recurring merchants correctly
- Calculates cadence (monthly/weekly)
- Computes subscription metrics for both time windows
- All unit tests pass
- Handles edge cases (irregular patterns, one-time purchases)

---

### **PR #5: Behavioral Signal Detection - Savings**
**Branch:** `feature/savings-detection`

#### Tasks:
- [ ] Detect net inflow to savings-like accounts (savings, money market, HSA)
- [ ] Calculate savings growth rate over time windows
- [ ] Calculate emergency fund coverage (savings / avg monthly expenses)
- [ ] Identify patterns in savings behavior
- [ ] Write unit tests for savings analysis

#### Files Created/Updated:
```
CREATE: /backend/src/services/features/savingsAnalyzer.js
UPDATE: /backend/tests/unit/features.test.js (add savings tests)
UPDATE: /backend/src/config/constants.js (savings thresholds)
```

#### Acceptance Criteria:
- Accurately calculates net inflow to savings accounts
- Computes growth rate for 30-day and 180-day windows
- Calculates emergency fund coverage correctly
- Unit tests cover various savings patterns
- Handles users with no savings accounts

---

### **PR #6: Behavioral Signal Detection - Credit**
**Branch:** `feature/credit-detection`

#### Tasks:
- [ ] Calculate credit utilization (balance / limit) per card
- [ ] Flag utilization thresholds (≥30%, ≥50%, ≥80%)
- [ ] Detect minimum-payment-only behavior
- [ ] Identify interest charges from transactions
- [ ] Check overdue status from liability data
- [ ] Write unit tests for credit analysis

#### Files Created/Updated:
```
CREATE: /backend/src/services/features/creditAnalyzer.js
UPDATE: /backend/tests/unit/features.test.js (add credit tests)
UPDATE: /backend/src/config/constants.js (credit thresholds)
```

#### Acceptance Criteria:
- Calculates utilization for all credit cards
- Correctly flags utilization levels
- Detects minimum payment patterns
- Identifies interest charges
- Checks overdue status
- Unit tests pass

---

### **PR #7: Behavioral Signal Detection - Income**
**Branch:** `feature/income-detection`

#### Tasks:
- [ ] Detect payroll ACH transactions
- [ ] Calculate payment frequency (weekly, bi-weekly, monthly, irregular)
- [ ] Calculate median pay gap
- [ ] Calculate cash-flow buffer in months
- [ ] Detect income variability patterns
- [ ] Write unit tests for income analysis

#### Files Created/Updated:
```
CREATE: /backend/src/services/features/incomeAnalyzer.js
UPDATE: /backend/tests/unit/features.test.js (add income tests)
UPDATE: /backend/src/config/constants.js (income patterns)
```

#### Acceptance Criteria:
- Detects payroll transactions accurately
- Calculates payment frequency correctly
- Computes median pay gap
- Calculates cash flow buffer
- Identifies variable income users
- Unit tests pass

---

### **PR #8: Persona Definitions & Assignment Logic**
**Branch:** `feature/persona-system`

#### Tasks:
- [ ] Define 5 persona types with clear criteria
- [ ] Implement Persona 1: High Utilization
- [ ] Implement Persona 2: Variable Income Budgeter
- [ ] Implement Persona 3: Subscription-Heavy
- [ ] Implement Persona 4: Savings Builder
- [ ] Implement Persona 5: New or recently joined Users
- [ ] Create persona prioritization logic (when multiple match)
- [ ] Build persona assignment service
- [ ] Write unit tests for persona assignment

#### Files Created/Updated:
```
CREATE: /backend/src/services/personas/personaDefinitions.js
CREATE: /backend/src/services/personas/personaAssigner.js
CREATE: /backend/src/services/personas/personaPrioritizer.js
CREATE: /backend/tests/unit/personas.test.js
CREATE: /backend/docs/PERSONAS.md
```

#### Acceptance Criteria:
- All 5 personas clearly defined with criteria
- Custom persona (Persona 5) documented with rationale
- Assignment logic works for both 30-day and 180-day windows
- Prioritization logic handles multiple persona matches
- Unit tests cover all persona scenarios
- Documentation explains each persona's focus

---

### **PR #9: Education Content Catalog**
**Branch:** `feature/education-catalog`

#### Tasks:
- [ ] Create education content catalog (articles, guides, calculators)
- [ ] Map content to each persona type
- [ ] Create content for debt paydown strategies
- [ ] Create content for variable income budgeting
- [ ] Create content for subscription management
- [ ] Create content for emergency fund building
- [ ] Create content for credit utilization
- [ ] Add metadata (title, description, category, persona_fit)

#### Files Created/Updated:
```
CREATE: /backend/src/services/recommend/educationCatalog.js
CREATE: /backend/data/content/education_items.json
```

#### Acceptance Criteria:
- At least 15-20 education items created
- Content mapped to appropriate personas
- Each item has clear metadata
- Content uses empowering, non-judgmental language
- Covers all 5 persona focus areas

---

### **PR #10: Partner Offers Catalog**
**Branch:** `feature/partner-offers`

#### Tasks:
- [ ] Create partner offers catalog
- [ ] Define balance transfer credit card offers
- [ ] Define high-yield savings account offers
- [ ] Define budgeting app offers
- [ ] Define subscription management tool offers
- [ ] Add eligibility criteria for each offer
- [ ] Map offers to personas and behavioral signals

#### Files Created/Updated:
```
CREATE: /backend/src/services/recommend/partnerOffers.js
CREATE: /backend/data/content/partner_offers.json
UPDATE: /backend/src/config/constants.js (eligibility thresholds)
```

#### Acceptance Criteria:
- At least 8-10 partner offers defined
- Each offer has clear eligibility criteria
- Offers mapped to appropriate personas
- Includes minimum income/credit requirements
- No predatory products included

---

### **PR #11: Recommendation Engine & Rationale Generator**
**Branch:** `feature/recommendation-engine`

#### Tasks:
- [ ] Build recommendation engine that combines persona + signals
- [ ] Implement logic to select 3-5 education items per user
- [ ] Implement logic to select 1-3 partner offers per user
- [ ] Build rationale generator with plain-language explanations
- [ ] Create "because" templates citing specific data
- [ ] Ensure recommendations include concrete numbers (balances, utilization, etc.)
- [ ] Write unit tests for recommendation logic

#### Files Created/Updated:
```
CREATE: /backend/src/services/recommend/recommendationEngine.js
CREATE: /backend/src/services/recommend/rationaleGenerator.js
CREATE: /backend/tests/unit/recommendations.test.js
```

#### Acceptance Criteria:
- Engine selects appropriate education items based on persona
- Selects relevant partner offers based on eligibility
- Every recommendation includes clear rationale
- Rationales cite specific data (e.g., "Visa ending in 4523 at 68% utilization")
- Plain-language, no jargon
- Unit tests pass

---

### **PR #12: Consent Management System**
**Branch:** `feature/consent-system`

#### Tasks:
- [ ] Implement consent checker service
- [ ] Track consent status per user in database
- [ ] Create opt-in logic
- [ ] Create opt-out/revoke logic
- [ ] Ensure no processing happens without consent
- [ ] Write unit tests for consent logic

#### Files Created/Updated:
```
CREATE: /backend/src/services/guardrails/consentChecker.js
UPDATE: /backend/src/models/Consent.js
CREATE: /backend/tests/unit/guardrails.test.js (consent tests)
```

#### Acceptance Criteria:
- Consent status tracked per user
- Users can opt-in and opt-out
- System blocks processing without consent
- Timestamps recorded for audit
- Unit tests pass

---

### **PR #13: Eligibility Filter**
**Branch:** `feature/eligibility-filter`

#### Tasks:
- [ ] Implement eligibility filter service
- [ ] Check minimum income requirements
- [ ] Check minimum credit score requirements (if available)
- [ ] Filter based on existing accounts (don't offer savings if they have one)
- [ ] Block predatory products (payday loans, etc.)
- [ ] Write unit tests for eligibility filtering

#### Files Created/Updated:
```
CREATE: /backend/src/services/guardrails/eligibilityFilter.js
UPDATE: /backend/tests/unit/guardrails.test.js (eligibility tests)
UPDATE: /backend/src/config/constants.js (eligibility rules)
```

#### Acceptance Criteria:
- Filters offers based on income requirements
- Checks for duplicate account types
- Prevents predatory product recommendations
- Unit tests cover various eligibility scenarios
- Documentation explains eligibility rules

---

### **PR #14: Tone Validator**
**Branch:** `feature/tone-validator`

#### Tasks:
- [ ] Implement tone validation service
- [ ] Create list of prohibited shaming phrases
- [ ] Create list of judgmental terms to avoid
- [ ] Validate all recommendation text for tone
- [ ] Ensure empowering, educational language
- [ ] Write unit tests for tone validation

#### Files Created/Updated:
```
CREATE: /backend/src/services/guardrails/toneValidator.js
CREATE: /backend/data/content/prohibited_phrases.json
UPDATE: /backend/tests/unit/guardrails.test.js (tone tests)
```

#### Acceptance Criteria:
- Blocks shaming language (e.g., "you're overspending")
- Enforces neutral, supportive tone
- Validates all content before delivery
- Unit tests catch prohibited phrases
- Documentation explains tone guidelines

---

### **PR #15: REST API - User Endpoints**
**Branch:** `feature/api-users`

#### Tasks:
- [ ] Implement GET /users (list all users - for login dropdown)
- [ ] Implement GET /users/:id (get user details)
- [ ] Add validation middleware
- [ ] Add error handling
- [ ] Write integration tests

#### Files Created/Updated:
```
CREATE: /backend/src/routes/users.js
CREATE: /backend/src/middleware/validator.js
CREATE: /backend/src/middleware/errorHandler.js
UPDATE: /backend/src/server.js (register routes)
CREATE: /backend/tests/integration/api.test.js (user tests)
```

#### Acceptance Criteria:
- GET /users returns list of all synthetic users (id, name)
- GET /users/:id returns user details
- Input validation works
- Error handling returns proper status codes
- Integration tests pass
- No authentication required (demo mode)

---

### **PR #16: REST API - Consent Endpoints**
**Branch:** `feature/api-consent`

#### Tasks:
- [ ] Implement POST /consent (record consent)
- [ ] Implement GET /consent/:user_id (get consent status)
- [ ] Implement DELETE /consent/:user_id (revoke consent)
- [ ] Add validation and error handling
- [ ] Write integration tests

#### Files Created/Updated:
```
CREATE: /backend/src/routes/consent.js
UPDATE: /backend/src/server.js (register consent routes)
UPDATE: /backend/tests/integration/api.test.js (consent tests)
```

#### Acceptance Criteria:
- POST /consent records user opt-in
- GET /consent/:user_id returns current status
- DELETE /consent/:user_id revokes consent
- Timestamps recorded
- Integration tests pass

---

### **PR #17: REST API - Profile & Recommendations**
**Branch:** `feature/api-recommendations`

#### Tasks:
- [ ] Implement GET /profile/:user_id (get behavioral profile)
- [ ] Implement GET /recommendations/:user_id (get recommendations)
- [ ] Integrate with feature detection services
- [ ] Integrate with persona assignment
- [ ] Integrate with recommendation engine
- [ ] Apply all guardrails (consent, eligibility, tone)
- [ ] Add mandatory disclaimer to all recommendations
- [ ] Write integration tests

#### Files Created/Updated:
```
CREATE: /backend/src/routes/profile.js
CREATE: /backend/src/routes/recommendations.js
UPDATE: /backend/src/server.js (register routes)
UPDATE: /backend/tests/integration/api.test.js (profile/recommendation tests)
```

#### Acceptance Criteria:
- GET /profile/:user_id returns detected signals and persona
- GET /recommendations/:user_id returns 3-5 education + 1-3 offers
- All recommendations include rationales
- Consent checked before processing
- Eligibility filter applied
- Tone validated
- Disclaimer included
- Integration tests pass

---

### **PR #18: REST API - Feedback & Operator**
**Branch:** `feature/api-operator`

#### Tasks:
- [ ] Implement POST /feedback (record user feedback)
- [ ] Implement GET /operator/review (get approval queue)
- [ ] Implement POST /operator/approve (approve recommendation)
- [ ] Implement POST /operator/override (override recommendation)
- [ ] Implement GET /operator/users (get all users with persona info)
- [ ] Write integration tests

#### Files Created/Updated:
```
CREATE: /backend/src/routes/feedback.js
CREATE: /backend/src/routes/operator.js
UPDATE: /backend/src/server.js (register routes)
UPDATE: /backend/tests/integration/api.test.js (operator tests)
```

#### Acceptance Criteria:
- POST /feedback records user feedback
- GET /operator/review returns pending recommendations
- Operators can approve/override
- GET /operator/users returns all users with signals
- Decision traces logged
- Integration tests pass
- No separate operator authentication (demo mode)

---

### **PR #19: Evaluation & Metrics System**
**Branch:** `feature/evaluation-metrics`

#### Tasks:
- [ ] Implement coverage metric (% users with persona + ≥3 behaviors)
- [ ] Implement explainability metric (% recommendations with rationales)
- [ ] Implement latency tracking
- [ ] Implement auditability metric (% with decision traces)
- [ ] Create metrics report generator (JSON/CSV)
- [ ] Create summary report (1-2 pages)
- [ ] Add per-user decision trace export
- [ ] Write tests for metrics calculation

#### Files Created/Updated:
```
CREATE: /backend/src/services/eval/metricsCalculator.js
CREATE: /backend/src/services/eval/reportGenerator.js
CREATE: /backend/tests/unit/eval.test.js
CREATE: /backend/docs/EVALUATION.md
```

#### Acceptance Criteria:
- All 5 metrics calculated correctly
- Meets targets: 100% coverage, 100% explainability, <5s latency
- JSON/CSV export works
- Summary report generated
- Decision traces available per user
- Tests pass

---

### **PR #20: Frontend - Common Components**
**Branch:** `feature/frontend-components`

#### Tasks:
- [ ] Create Button component
- [ ] Create Card component
- [ ] Create Loading spinner component
- [ ] Create Modal component
- [ ] Set up global styles
- [ ] Create utility functions (formatters, validators)

#### Files Created/Updated:
```
CREATE: /frontend/src/components/common/Button.jsx
CREATE: /frontend/src/components/common/Card.jsx
CREATE: /frontend/src/components/common/Loading.jsx
CREATE: /frontend/src/components/common/Modal.jsx
CREATE: /frontend/src/styles/globals.css
CREATE: /frontend/src/utils/formatters.js
CREATE: /frontend/src/utils/validators.js
```

#### Acceptance Criteria:
- All common components render correctly
- Components are reusable and styled
- Utilities work for formatting currencies, dates, etc.
- Responsive design
- No PropTypes warnings

---

### **PR #21: Frontend - Authentication & Context (Simplified)**
**Branch:** `feature/frontend-auth`

#### Tasks:
- [ ] Create AuthContext for role and user selection
- [ ] Create UserContext for user data
- [ ] Create useAuth custom hook
- [ ] Implement Login page with role toggle and user dropdown
- [ ] Create API service for backend communication
- [ ] Create ProtectedRoute wrapper component
- [ ] Create DemoBanner component
- [ ] Integrate contexts into App.jsx
- [ ] Add localStorage persistence
- [ ] Document simplified auth approach in DECISION_LOG.md

#### Files Created/Updated:
```
CREATE: /frontend/src/context/AuthContext.jsx
CREATE: /frontend/src/context/UserContext.jsx
CREATE: /frontend/src/hooks/useAuth.js
CREATE: /frontend/src/pages/Login.jsx
CREATE: /frontend/src/services/api.js
CREATE: /frontend/src/components/common/ProtectedRoute.jsx
CREATE: /frontend/src/components/common/DemoBanner.jsx
CREATE: /frontend/src/styles/Login.css
CREATE: /frontend/src/styles/DemoBanner.css
UPDATE: /frontend/src/App.jsx
UPDATE: /backend/docs/DECISION_LOG.md
```

#### Acceptance Criteria:
- Users can select role (Customer or Operator)
- Customers select from user dropdown
- Operators get direct access
- Authentication state persists (localStorage)
- Protected routes enforce access control
- Demo banner visible on all pages
- No passwords required (demo mode)
- Login UI is clean and intuitive
- API service connects to backend

---

### **PR #22: Frontend - User Dashboard Components**
**Branch:** `feature/user-dashboard`

#### Tasks:
- [ ] Create ConsentPrompt component
- [ ] Create BehavioralProfile component (shows detected signals)
- [ ] Create RecommendationCard component
- [ ] Create EducationItem component
- [ ] Create PartnerOffer component
- [ ] Create useConsent hook
- [ ] Create useRecommendations hook

#### Files Created/Updated:
```
CREATE: /frontend/src/components/user/ConsentPrompt.jsx
CREATE: /frontend/src/components/user/BehavioralProfile.jsx
CREATE: /frontend/src/components/user/RecommendationCard.jsx
CREATE: /frontend/src/components/user/EducationItem.jsx
CREATE: /frontend/src/components/user/PartnerOffer.jsx
CREATE: /frontend/src/hooks/useConsent.js
CREATE: /frontend/src/hooks/useRecommendations.js
```

#### Acceptance Criteria:
- ConsentPrompt shows opt-in/opt-out UI
- BehavioralProfile displays user's detected patterns
- RecommendationCard shows education items with rationales
- EducationItem displays content nicely
- PartnerOffer shows offers with eligibility info
- Hooks fetch data from backend API
- All components render correctly
- Loading and error states handled

---

### **PR #23: Frontend - User Portal Page**
**Branch:** `feature/user-portal`

#### Tasks:
- [ ] Create Dashboard component that combines all user components
- [ ] Create UserPortal page
- [ ] Integrate consent check
- [ ] Display behavioral profile
- [ ] Display recommendations (education + offers)
- [ ] Add loading states
- [ ] Add error handling
- [ ] Make responsive

#### Files Created/Updated:
```
CREATE: /frontend/src/components/user/Dashboard.jsx
CREATE: /frontend/src/pages/UserPortal.jsx
UPDATE: /frontend/src/App.jsx (add routing)
UPDATE: /frontend/package.json (add react-router-dom if needed)
```

#### Acceptance Criteria:
- Dashboard shows consent prompt if not opted in
- Shows behavioral profile after consent
- Shows 3-5 education items
- Shows 1-3 partner offers
- All items include rationales
- Loading states work
- Error handling works
- Responsive on mobile/tablet/desktop
- User can give feedback on recommendations

---

### **PR #24: Frontend - Operator Dashboard Components**
**Branch:** `feature/operator-components`

#### Tasks:
- [ ] Create UserList component
- [ ] Create SignalViewer component (shows detected behaviors)
- [ ] Create RecommendationReview component
- [ ] Create DecisionTrace component
- [ ] Create MetricsPanel component

#### Files Created/Updated:
```
CREATE: /frontend/src/components/operator/UserList.jsx
CREATE: /frontend/src/components/operator/SignalViewer.jsx
CREATE: /frontend/src/components/operator/RecommendationReview.jsx
CREATE: /frontend/src/components/operator/DecisionTrace.jsx
CREATE: /frontend/src/components/operator/MetricsPanel.jsx
```

#### Acceptance Criteria:
- UserList displays all users with personas
- SignalViewer shows detected signals for a user
- RecommendationReview shows pending recommendations
- DecisionTrace displays audit trail
- MetricsPanel shows system metrics
- All components functional and styled

---

### **PR #25: Frontend - Operator Portal Page**
**Branch:** `feature/operator-portal`

#### Tasks:
- [ ] Create OperatorDashboard component
- [ ] Create OperatorPortal page
- [ ] Integrate all operator components
- [ ] Add approve/override functionality
- [ ] Add filtering and search
- [ ] Add loading/error states
- [ ] Make responsive

#### Files Created/Updated:
```
CREATE: /frontend/src/components/operator/OperatorDashboard.jsx
CREATE: /frontend/src/pages/OperatorPortal.jsx
UPDATE: /frontend/src/App.jsx (add operator routing)
UPDATE: /frontend/src/services/api.js (operator endpoints)
```

#### Acceptance Criteria:
- Operator can view all users
- Can filter by persona
- Can view signals for any user
- Can review recommendations
- Can approve/override with notes
- Can see decision traces
- Metrics displayed
- Responsive design

---

### **PR #26: Frontend - Navigation & Final Routing**
**Branch:** `feature/navigation-routing`

#### Tasks:
- [ ] Create navigation component with logout
- [ ] Ensure all routes properly configured
- [ ] Add route guards for role-based access
- [ ] Create 404/NotFound page
- [ ] Add navigation menu (conditional based on role)
- [ ] Test all navigation flows

#### Files Created/Updated:
```
CREATE: /frontend/src/components/common/Navigation.jsx
CREATE: /frontend/src/pages/NotFound.jsx
UPDATE: /frontend/src/App.jsx (finalize all routes)
```

#### Acceptance Criteria:
- Routes work for all pages (/, /login, /dashboard, /operator)
- Protected routes require authentication
- Role-based access control works
- Navigation menu shows appropriate links
- Logout functionality works
- 404 page shows for invalid routes
- Cannot access operator routes as customer
- Cannot access customer routes as operator

---

### **PR #27: Integration & End-to-End Testing**
**Branch:** `feature/integration-tests`

#### Tasks:
- [ ] Write end-to-end workflow tests
- [ ] Test user consent flow
- [ ] Test recommendation generation flow
- [ ] Test operator review flow
- [ ] Test edge cases (no consent, no data, etc.)
- [ ] Add integration tests for frontend-backend communication

#### Files Created/Updated:
```
CREATE: /backend/tests/integration/workflow.test.js
UPDATE: /backend/tests/integration/api.test.js (comprehensive tests)
CREATE: /frontend/src/__tests__/integration.test.js
```

#### Acceptance Criteria:
- All workflows tested end-to-end
- Tests cover happy path and edge cases
- Frontend-backend integration verified
- All tests pass
- Test coverage >80%

---

### **PR #28: Documentation & Decision Log**
**Branch:** `feature/documentation`

#### Tasks:
- [ ] Write comprehensive README for project
- [ ] Document API endpoints in API.md
- [ ] Complete SCHEMA.md with database schema
- [ ] Write DECISION_LOG.md explaining key architectural choices
- [ ] Document simplified authentication approach
- [ ] Document limitations and future improvements
- [ ] Add setup instructions
- [ ] Add usage examples
- [ ] Document custom Persona 5 rationale

#### Files Created/Updated:
```
UPDATE: /README.md
CREATE: /backend/docs/API.md
UPDATE: /backend/docs/SCHEMA.md
UPDATE: /backend/docs/DECISION_LOG.md
CREATE: /backend/docs/LIMITATIONS.md
UPDATE: /frontend/README.md
UPDATE: /backend/README.md
```

#### Acceptance Criteria:
- README includes setup instructions (one-command)
- API documentation complete with examples
- Schema fully documented
- Decision log explains key choices (especially simplified auth)
- Limitations documented
- Custom persona (Persona 5) rationale explained
- Usage examples provided
- Setup instructions tested and work

---

### **PR #29: Performance Optimization & Latency**
**Branch:** `feature/performance`

#### Tasks:
- [ ] Profile recommendation generation performance
- [ ] Optimize database queries (add indexes)
- [ ] Add caching for frequently accessed data
- [ ] Optimize frontend rendering (React.memo, useMemo)
- [ ] Ensure <5 second recommendation generation
- [ ] Add performance monitoring

#### Files Created/Updated:
```
UPDATE: /backend/src/config/database.js (add indexes)
UPDATE: /backend/src/services/recommend/recommendationEngine.js (optimize)
CREATE: /backend/src/utils/cache.js
UPDATE: /frontend/src/components/user/Dashboard.jsx (optimize renders)
UPDATE: /backend/docs/DECISION_LOG.md (performance notes)
```

#### Acceptance Criteria:
- Recommendation generation <5 seconds per user
- Database queries optimized
- Caching reduces redundant calculations
- Frontend renders efficiently
- Latency metrics meet targets
- No unnecessary re-renders in React

---

### **PR #30: Final Evaluation & Report**
**Branch:** `feature/final-evaluation`

#### Tasks:
- [ ] Run full evaluation harness on all synthetic users
- [ ] Generate metrics report (JSON/CSV)
- [ ] Create summary report (1-2 pages)
- [ ] Verify 100% coverage (users with persona + ≥3 behaviors)
- [ ] Verify 100% explainability (recommendations with rationales)
- [ ] Verify <5s latency
- [ ] Verify 100% auditability (decision traces)
- [ ] Document fairness analysis (if demographics included)
- [ ] Create final demo video/presentation
- [ ] Prepare submission package

#### Files Created/Updated:
```
CREATE: /backend/data/evaluation/metrics.json
CREATE: /backend/data/evaluation/metrics.csv
CREATE: /backend/data/evaluation/summary_report.md
CREATE: /backend/data/evaluation/decision_traces/
UPDATE: /backend/docs/EVALUATION.md
CREATE: /DEMO.md (demo script)
CREATE: /SUBMISSION.md (submission checklist)
```

#### Acceptance Criteria:
- All metrics calculated
- All targets met (100% coverage, explainability, auditability, <5s)
- Summary report complete (1-2 pages)
- Per-user decision traces exported
- Fairness analysis included
- Demo video/presentation ready
- Submission package complete
- System ready for evaluation

---

## Testing Strategy

### Unit Tests (≥10 required)
- Feature detection (subscriptions, savings, credit, income)
- Persona assignment logic
- Recommendation engine
- Guardrails (consent, eligibility, tone)
- Evaluation metrics

### Integration Tests
- API endpoints
- End-to-end workflows
- Frontend-backend communication
- Database operations

### Test Files Location:
```
/backend/tests/unit/
  - features.test.js
  - personas.test.js
  - recommendations.test.js
  - guardrails.test.js
  - eval.test.js

/backend/tests/integration/
  - api.test.js
  - workflow.test.js

/frontend/src/__tests__/
  - integration.test.js
```

---

## Success Metrics Checklist

Track these throughout development:

- [ ] Coverage: 100% of users have assigned persona + ≥3 detected behaviors
- [ ] Explainability: 100% of recommendations include rationales
- [ ] Latency: Recommendation generation <5 seconds per user
- [ ] Auditability: 100% of recommendations have decision traces
- [ ] Code Quality: ≥10 passing unit/integration tests
- [ ] Documentation: Complete schema and decision log

---

## Key Changes from Original Task List

### **Authentication Approach (PR #21):**
- ❌ Removed: JWT tokens, password hashing, separate login portals
- ✅ Added: Simplified role selection, user dropdown, localStorage persistence
- ✅ Added: DemoBanner component for demo disclaimer
- ✅ Added: Decision log documentation explaining simplified auth

### **User Management:**
- ❌ Removed: User registration flow (POST /auth/register)
- ❌ Removed: Authentication middleware (auth.js)
- ✅ Simplified: Direct access to synthetic users only
- ✅ Focus: Core functionality over production-ready auth

### **API Endpoints:**
- ❌ Removed: POST /auth/register, POST /auth/login, POST /auth/refresh
- ✅ Simplified: No authentication required for endpoints (demo mode)
- ✅ Added: GET /users (for login dropdown population)

### **Frontend Structure:**
- ✅ Added: DemoBanner component (always visible)
- ✅ Simplified: Single Login page for both roles
- ✅ Added: localStorage for session persistence
- ❌ Removed: Separate CustomerLogin and OperatorLogin pages

### **Documentation Updates:**
- ✅ Added: Simplified auth approach in DECISION_LOG.md
- ✅ Added: Rationale for demo-first approach
- ✅ Added: Future enhancement path to production auth

---

## Notes

- Each PR should be atomic and independently reviewable
- Run tests before submitting each PR
- Update documentation as you go
- Keep commits small and descriptive
- Use semantic commit messages (feat:, fix:, docs:, test:, refactor:)
- Ensure all PRs pass CI/CD checks before merging
- **Focus on core functionality first** (behavioral analysis, personas, recommendations)
- **Authentication is intentionally simplified** for demo/prototype purposes

**Total PRs: 30**
**Estimated Timeline: 8-12 weeks for solo developer**

---

## Quick Start Guide

### Phase 1: Foundation (PRs 1-3)
Set up project structure, database, and synthetic data

### Phase 2: Backend Core (PRs 4-14)
Build behavioral detection, personas, recommendations, and guardrails

### Phase 3: Backend API (PRs 15-19)
Create REST API endpoints and evaluation system

### Phase 4: Frontend Core (PRs 20-21)
Build common components and authentication

### Phase 5: Frontend Features (PRs 22-26)
Build user and operator interfaces

### Phase 6: Polish (PRs 27-30)
Testing, documentation, optimization, and final evaluation