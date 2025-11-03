# SpendSense Backend

Backend API for SpendSense - Financial insights and recommendation engine.

## Overview

The SpendSense backend provides REST API endpoints for:
- User management
- Behavioral signal detection
- Persona assignment
- Recommendation generation
- Consent management
- Operator oversight

## Setup

### Prerequisites
- Node.js >= 16.0.0
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3001` by default.

### Development

Run in development mode with auto-reload:
```bash
npm run dev
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Database models
│   ├── services/        # Business logic
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   └── utils/           # Utility functions
├── tests/               # Test files
├── data/                # Data files (synthetic data, database)
└── docs/                # Documentation
```

## API Endpoints

- `GET /health` - Health check
- More endpoints to be added as development progresses

## Database

Uses SQLite for local storage. Database file location: `./data/database.sqlite`

## Scripts

- `npm start` - Start the server
- `npm run dev` - Start with nodemon (auto-reload)
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## License

MIT

