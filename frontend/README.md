# SpendSense Frontend

Frontend React application for SpendSense - User and Operator interfaces.

## Overview

The SpendSense frontend provides:
- User portal for viewing personalized recommendations
- Operator portal for oversight and review
- Consent management interface
- Behavioral profile visualization

## Setup

### Prerequisites
- Node.js >= 16.0.0
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000` by default.

### Build for Production

```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
frontend/
├── public/            # Static assets
├── src/
│   ├── components/   # React components
│   ├── pages/        # Page components
│   ├── context/      # React Context providers
│   ├── hooks/        # Custom React hooks
│   ├── services/     # API services
│   ├── utils/        # Utility functions
│   └── styles/        # CSS styles
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## API Integration

The frontend communicates with the backend API at `http://localhost:3001`. Vite proxy is configured to forward `/api` requests to the backend.

## License

MIT

