# SpendSense

**From Plaid to Personalized Learning**

An explainable, consent-aware system that detects behavioral patterns from transaction data, assigns personas, and delivers personalized financial education with clear guardrails around eligibility and tone.

## Overview

SpendSense transforms massive transaction data into actionable customer insights without crossing into regulated financial advice. The system:

- Analyzes Plaid-style transaction data
- Detects behavioral patterns (subscriptions, savings, credit, income)
- Assigns users to personas based on their financial behavior
- Generates personalized recommendations with clear, data-driven rationales
- Maintains strict guardrails around consent, eligibility, and tone

## Project Structure

```
spendsense/
├── backend/          # Node.js/Express backend API
├── frontend/         # React frontend application
├── memory-bank/      # Project documentation and context
└── docs/             # Additional documentation
```

## Quick Start

### Prerequisites
- Node.js >= 16.0.0
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Start the backend server:
```bash
npm start
```

Backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## Features

### Behavioral Signal Detection
- **Subscriptions:** Recurring merchant detection, monthly spend analysis
- **Savings:** Net inflow tracking, growth rate, emergency fund coverage
- **Credit:** Utilization analysis, payment patterns, overdue detection
- **Income:** Stability detection, payment frequency, cash-flow buffer

### Persona System
Five personas based on behavioral patterns:
1. **High Utilization** - Focus on debt reduction
2. **Variable Income Budgeter** - Focus on budgeting for irregular income
3. **Subscription-Heavy** - Focus on subscription management
4. **Savings Builder** - Focus on goal setting and optimization
5. **New Users** - Focus on new credit/loan offers

### Recommendation Engine
- 3-5 personalized education items per user
- 1-3 partner offers with eligibility checks
- Plain-language rationales citing specific data points
- Mandatory disclaimers on all recommendations

### Guardrails
- **Consent Management:** Opt-in/opt-out at any time
- **Eligibility Filtering:** Income, credit, existing accounts
- **Tone Validation:** No shaming, empowering language
- **Operator Oversight:** Review, approve, override capabilities

## Success Criteria

| Metric | Target |
|--------|--------|
| Coverage | 100% users with persona + ≥3 behaviors |
| Explainability | 100% recommendations with rationales |
| Latency | <5 seconds per user |
| Auditability | 100% recommendations with decision traces |
| Code Quality | ≥10 passing tests |
| Documentation | Complete schema and decision log |

## Development

### Backend Scripts
- `npm start` - Start server
- `npm run dev` - Start with auto-reload (nodemon)
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format with Prettier

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format with Prettier

## Documentation

- [Requirements](./spendsense-requirements.md) - Full project requirements
- [Task List](./spendsense-task-list.md) - Development task breakdown
- [Memory Bank](./memory-bank/) - Project context and documentation

## Core Principles

1. **Transparency over sophistication** - Every recommendation has a clear rationale
2. **User control over automation** - Consent management required
3. **Education over sales** - Focus on learning, not product promotion
4. **Fairness built in from day one** - No predatory products, no shaming

## License

MIT

## Disclaimer

**This is educational content, not financial advice. Consult a licensed advisor for personalized guidance.**
