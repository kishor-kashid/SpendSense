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

### Backend (Expected)
- `express` - Web framework
- `sqlite3` or `better-sqlite3` - Database driver
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables
- `jest` - Testing framework
- Additional utilities as needed

### Frontend (Expected)
- `react` - UI library
- `react-dom` - React DOM rendering
- `react-router-dom` - Routing
- `axios` or `fetch` - API calls
- Additional UI utilities as needed

## Technical Constraints

### Storage
- **Local only:** No cloud services
- **SQLite:** For relational data (users, accounts, transactions, liabilities, consent)
- **JSON files:** For synthetic data, content catalogs, configs
- **Parquet:** Optional for analytics (not required)

### Data Generation
- **Synthetic data only:** No real PII
- **50-100 users:** Diverse financial profiles
- **90-180 days:** Transaction history per user
- **Plaid-style structure:** Match Plaid API format

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
- **Coverage:** Aim for >80% test coverage
- **Deterministic:** Use seeds for randomness
- **Fast execution:** Tests should run quickly

## Build & Deployment

### Setup Commands
- **Backend:** `npm install` then `npm start` (runs on port 3001)
- **Frontend:** `npm install` then `npm start` (runs on port 3000)
- **One-command setup:** Single command to set up entire project

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

