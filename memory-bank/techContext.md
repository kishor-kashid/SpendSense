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
- **Data persistence:** Generated once, stored in SQLite permanently
- **Regeneration:** Can regenerate with `npm run generate-data` if needed
- **Git strategy:** Synthetic JSON files excluded from version control

### Performance Requirements
- **Latency:** <5 seconds per user for recommendation generation
- **Local execution:** Should run on laptop without external dependencies
- **Optimization:** Database indexes, query optimization, caching where needed

### API Constraints
- **REST API:** Simple REST endpoints
- **No authentication:** Demo mode (no JWT, passwords, etc.)
- **CORS:** Enabled for frontend-backend communication
- **Ports:** Backend on 3001, Frontend on 3000 (typical)

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
- **Current:** 153 unit tests passing ✅
  - Feature detection: 74 tests (subscriptions: 19, savings: 6, credit: 8, income: 8, plus 33 additional)
  - Persona system: 13 tests
  - Education catalog: 13 tests
  - Partner offers: 30 tests
  - Recommendation engine: 13 tests
  - Consent management: 26 tests
- **Coverage:** Aim for >80% test coverage
- **Test Framework:** Jest with separate test database
- **Test Database:** `backend/data/test_database.sqlite` (auto-created, excluded from git)
- **Test Isolation:** Unique IDs used in tests to prevent UNIQUE constraint violations
- **Deterministic:** Use seeds for randomness
- **Fast execution:** Tests should run quickly (~2-6 seconds for full suite)
- **Test Command:** `npm test` (runs all tests)

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
- No production-ready authentication
- No user registration
- Simplified role-based access
- Synthetic users only

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

