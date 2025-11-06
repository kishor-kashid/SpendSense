# Technical Context: SpendSense

## Technology Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite (local storage)
- **Data Format:** JSON for configs/logs, Parquet for analytics (optional)
- **Testing:** Jest (or similar Node.js testing framework)

### Frontend
- **Framework:** React
- **Build Tool:** Create React App or Vite
- **Routing:** React Router
- **State Management:** React Context API
- **Styling:** CSS (globals.css, component-specific CSS files)

### Development Tools
- **Linting:** ESLint
- **Formatting:** Prettier
- **Version Control:** Git

## Development Environment

### Setup Requirements
- Node.js (version to be determined)
- npm or yarn package manager
- SQLite (typically bundled with Node.js)
- Git for version control

### Project Structure
```
spendsense/
├── backend/          # Node.js/Express backend
│   ├── src/
│   ├── tests/
│   ├── data/
│   └── docs/
├── frontend/         # React frontend
│   ├── src/
│   └── public/
└── memory-bank/      # Project documentation
```

## Dependencies

### Backend (Installed)
- `express` (^4.18.2) - Web framework
- `better-sqlite3` (^9.2.2) - Database driver (synchronous, better performance)
- `cors` (^2.8.5) - Cross-origin resource sharing
- `dotenv` (^16.3.1) - Environment variables
- `jest` (^29.7.0) - Testing framework
- `nodemon` (^3.0.2) - Development auto-reload
- `openai` (^4.20.1) - OpenAI SDK for AI features (GPT-4)

### Frontend (Installed)
- `react` (^18.2.0) - UI library
- `react-dom` (^18.2.0) - React DOM rendering
- `react-router-dom` (^6.21.1) - Routing
- `axios` (^1.6.5) - API calls
- `vite` (^5.0.8) - Build tool (selected over Create React App)

## Technical Constraints

### Storage
- **Local only:** No cloud services
- **SQLite:** For relational data (users, accounts, transactions, liabilities, consent)
- **JSON files:** For synthetic data, content catalogs, configs
- **Parquet:** Optional for analytics (not required)

### Data Generation
- **Synthetic data only:** No real PII (fake names, masked account numbers)
- **75 users generated:** Diverse financial profiles (configurable 50-100)
- **120 days history:** Transaction history per user (configurable 90-180)
- **Plaid-style structure:** Match Plaid API format
- **User fields:** Generates first_name, last_name, username (first_name + last_name), password (first_name + last_name + "123")
- **Username uniqueness:** Handles duplicate usernames by appending counter
- **Data persistence:** Generated once, stored in SQLite permanently
- **Regeneration:** Can regenerate with `npm run generate-data` if needed
- **Git strategy:** Synthetic JSON files excluded from version control

### Performance Requirements
- **Latency:** <5 seconds per user for recommendation generation (target met)
- **Local execution:** Should run on laptop without external dependencies
- **Optimization:** 
  - Database indexes on frequently queried columns
  - Query optimization with `ANALYZE` command
  - In-memory caching with TTL (5 minutes default)
  - Frontend rendering optimizations (React.memo, useMemo, useCallback)
  - Performance monitoring and logging

### API Constraints
- **REST API:** Simple REST endpoints
- **Authentication:** Username/password system (simple, no encryption for demo mode)
- **User Credentials:** Username = first_name + last_name, Password = first_name + last_name + "123"
- **Operator Credentials:** Username "operator", Password "operator123"
- **CORS:** Enabled for frontend-backend communication
- **Ports:** Backend on 3001, Frontend on 3000 (typical)
- **AI Features:** Requires OpenAI API key in environment variables
- **AI Model:** GPT-4 used for all AI features (rationale generation, predictions, budgets, goals)

## Development Workflow

### Code Organization
- **Modular:** Clear separation of concerns
- **Service layer:** Business logic in services
- **Routes:** API endpoints in routes/
- **Models:** Database models in models/
- **Tests:** Unit and integration tests

### Code Quality Standards
- **ESLint:** Configured for both frontend and backend
- **Prettier:** Consistent code formatting
- **Semantic commits:** feat:, fix:, docs:, test:, refactor:
- **Documentation:** Inline comments for complex logic

### Testing Requirements
- **≥10 tests:** Unit and integration tests combined
- **Current:** 420 tests passing ✅
  - Backend unit: 322 tests (feature detection, personas, catalogs, recommendations, guardrails, evaluation)
  - Backend integration: 80 tests (workflow, API endpoints)
  - Frontend integration: 18 tests (authentication, consent, API integration)
- **Coverage:** Aim for >80% test coverage
- **Test Framework:** Jest (backend) and Vitest (frontend)
- **Test Database:** `backend/data/test_database.sqlite` (auto-created, excluded from git)
- **Test Isolation:** Unique IDs used in tests to prevent UNIQUE constraint violations
- **Test Configuration:** Serial execution (maxWorkers: 1) for database stability, 30s timeout
- **Deterministic:** Use seeds for randomness
- **Fast execution:** Tests should run quickly (~10-15 seconds for full backend suite)
- **Test Commands:** 
  - Backend: `npm test` (runs all Jest tests)
  - Frontend: `npm test` (runs Vitest tests)

## Build & Deployment

### Setup Commands
- **Backend:** 
  - `npm install` - Install dependencies
  - `npm start` - Start server (port 3001)
  - `npm run dev` - Start with auto-reload (nodemon)
  - `npm run generate-data` - Generate and load synthetic data
- **Frontend:** 
  - `npm install` - Install dependencies
  - `npm run dev` - Start development server (port 3000)
  - `npm run build` - Build for production
- **Data Generation:** 
  - `npm run generate-data` - Generate 75 users, 120 days (default)
  - `npm run generate-data 100 180` - Custom user count and days

### Environment Configuration
- `.env.example` file provided
- Environment variables for:
  - Database path
  - Server port
  - API endpoints
  - `OPENAI_API_KEY` - Required for AI features (GPT-4)
  - Other configuration

### Build Output
- **Backend:** No build step (runs directly with Node.js)
- **Frontend:** Production build with `npm run build`
- **Database:** SQLite file in `backend/data/`

## Data Formats

### Plaid-Style Data Structure
- **Accounts:** account_id, type, subtype, balances, currency
- **Transactions:** account_id, date, amount, merchant_name, category, pending
- **Liabilities:** APR, payment details, overdue status, next_payment_due_date

### JSON Exports
- Synthetic data exported as JSON files
- Content catalogs (education items, partner offers) as JSON
- Configuration files as JSON

## Limitations & Constraints

### No External Services
- No live Plaid API connection
- No cloud storage
- No external authentication services
- No payment processing

### Demo Mode
- Username/password authentication (simple, no encryption)
- No user registration (users pre-generated)
- Role-based access (customer/operator)
- Synthetic users only
- Operator credentials: "operator" / "operator123"

### Scalability
- Designed for 50-100 users
- SQLite may not scale to thousands of users
- Local storage limits

## Future Technical Considerations
- Migration to production database (PostgreSQL, MySQL)
- Implementation of proper authentication (JWT, OAuth)
- Cloud deployment (AWS, Azure, GCP)
- Real-time data processing
- Integration with actual Plaid API
- Advanced analytics with Parquet/Spark

