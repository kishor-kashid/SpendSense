# SpendSense Frontend

Frontend React application for SpendSense - User and Operator interfaces.

## Overview

The SpendSense frontend provides:
- **User Portal** - Personalized financial recommendations and insights
- **Operator Portal** - Oversight dashboard for reviewing recommendations
- Consent management interface
- Behavioral profile visualization
- Transaction and spending insights

## Quick Start

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
│   │   ├── common/   # Shared components (Button, Card, Modal, etc.)
│   │   ├── user/     # User portal components
│   │   └── operator/ # Operator portal components
│   ├── pages/        # Page components (Login, UserPortal, OperatorPortal)
│   ├── context/      # React Context providers (AuthContext, UserContext)
│   ├── hooks/        # Custom React hooks (useAuth, useConsent, useRecommendations)
│   ├── services/     # API services (api.js)
│   ├── utils/        # Utility functions (formatters, validators)
│   ├── styles/       # Global CSS styles
│   └── __tests__/    # Test files
├── index.html         # HTML entry point
└── vite.config.js    # Vite configuration
```

## Features

### User Portal

**Dashboard:**
- Overview of financial insights
- Personalized recommendations (education items + partner offers)
- Transaction history
- Spending insights and analytics

**Consent Management:**
- Toggle consent on/off via profile menu
- Clear indication of consent status
- Recommendations only visible with consent

**Recommendations:**
- 3-5 education items with clear rationales
- 1-3 partner offers with eligibility information
- Feedback collection on recommendations

### Operator Portal

**User Analysis:**
- View all users with assigned personas
- Filter by persona type
- View behavioral signals for any user
- View decision traces

**Review Queue:**
- Pending recommendations requiring approval
- Approve or override recommendations with notes
- View urgency indicators and filter/sort reviews
- See detailed recommendation content

**Metrics:**
- System-wide metrics (coverage, explainability, latency, auditability)
- User statistics

## API Integration

The frontend communicates with the backend API at `http://localhost:3001`.

### API Service

All API calls are made through `src/services/api.js`, which provides:
- Centralized API configuration
- Error handling
- Request/response interceptors

### Authentication

Authentication is handled via React Context (`AuthContext`):
- Login credentials stored in context
- Protected routes check authentication
- Role-based access (customer vs operator)

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests (Vitest)
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Development Server

The development server runs on `http://localhost:3000` with:
- Hot module replacement (HMR)
- Fast refresh
- Vite build tool

### State Management

State is managed using:
- **React Context API** - Global state (authentication, user data)
- **Local State** - Component-specific state (useState, useReducer)
- **Custom Hooks** - Reusable state logic (useAuth, useConsent, useRecommendations)

## Component Architecture

### Common Components

Located in `src/components/common/`:
- **Button** - Reusable button component with variants
- **Card** - Card container component
- **Modal** - Modal dialog component
- **Loading** - Loading spinner component
- **Navigation** - Navigation bar with logout
- **ProtectedRoute** - Route guard component

### User Components

Located in `src/components/user/`:
- **Dashboard** - Main user dashboard
- **Recommendations** - Recommendation display
- **Transactions** - Transaction list
- **Insights** - Spending insights
- **ConsentToggle** - Consent management

### Operator Components

Located in `src/components/operator/`:
- **OperatorDashboard** - Main operator dashboard with tabs
- **UserList** - User list with persona badges
- **SignalViewer** - Behavioral signals display
- **RecommendationReview** - Review queue with approval/override
- **DecisionTrace** - Decision trace viewer
- **MetricsPanel** - System metrics display

## Styling

### CSS Architecture

- **Global Styles** - `src/styles/globals.css` with CSS variables
- **Component Styles** - Each component has its own CSS file
- **CSS Variables** - Used for theming (colors, spacing, etc.)

### Design System

The frontend uses a consistent design system:
- Color palette defined in CSS variables
- Consistent spacing (--spacing-xs, --spacing-sm, etc.)
- Border radius and shadows for cards
- Responsive breakpoints

## Testing

### Test Setup

Tests use Vitest with jsdom environment:
- Configuration: `vitest.config.js`
- Test files: `src/__tests__/`

### Running Tests

```bash
npm test              # Run tests once
npm run test:watch    # Run tests in watch mode
npm run test:ui       # Run tests with UI (Vitest UI)
```

### Test Structure

- **Integration Tests** - Test frontend-backend integration
- Tests check backend availability and gracefully skip if unavailable

## Routes

### User Routes

- `/` - Login page
- `/dashboard` - User dashboard (protected)
- `/operator` - Operator portal (protected, operator only)

### Route Protection

Routes are protected using `ProtectedRoute` component:
- Requires authentication
- Role-based access (customer vs operator)
- Redirects to login if not authenticated

## Demo Login

**Customer Login:**
- Username: `first_name + last_name` (e.g., "JohnDoe")
- Password: `first_name + last_name + "123"` (e.g., "JohnDoe123")
- Role: `customer`

**Operator Login:**
- Username: `operator`
- Password: `operator123`
- Role: `operator`

> See `backend/data/synthetic/users.json` for all available test users.

## Build Configuration

### Vite Configuration

Vite is configured in `vite.config.js`:
- React plugin for JSX support
- Proxy configuration for API requests
- Build optimization

### Production Build

Production build:
- Optimized and minified
- Code splitting
- Asset optimization
- Output to `dist/` directory

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features required
- No IE11 support

## Performance

### Optimization

- Code splitting for routes
- Lazy loading for heavy components
- Optimized bundle size
- Fast refresh for development

## Troubleshooting

### Common Issues

**Backend Connection Errors:**
- Ensure backend server is running on `http://localhost:3001`
- Check CORS configuration in backend
- Verify API endpoint URLs

**Build Errors:**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (>= 16.0.0)

## License

MIT
