/**
 * Constants and configuration values for SpendSense
 */

// Time windows for analysis (in days)
const TIME_WINDOWS = {
  SHORT_TERM: 30,
  LONG_TERM: 180
};

// Subscription detection thresholds
const SUBSCRIPTION_THRESHOLDS = {
  MIN_RECURRING_MERCHANTS: 3,
  RECURRING_PERIOD_DAYS: 90,
  MIN_MONTHLY_RECURRING_SPEND: 50, // in dollars
  MIN_SUBSCRIPTION_SHARE: 0.10 // 10% of total spend
};

// Savings analysis thresholds
const SAVINGS_THRESHOLDS = {
  MIN_GROWTH_RATE: 0.02, // 2% growth rate
  MIN_MONTHLY_INFLOW: 200 // $200/month net inflow
};

// Credit utilization thresholds
const CREDIT_THRESHOLDS = {
  LOW_UTILIZATION: 0.30,   // 30%
  MEDIUM_UTILIZATION: 0.50, // 50%
  HIGH_UTILIZATION: 0.80    // 80%
};

// Income analysis thresholds
const INCOME_THRESHOLDS = {
  MAX_PAY_GAP_DAYS: 45,     // 45 days between paychecks
  MIN_CASH_FLOW_BUFFER: 1   // 1 month buffer
};

// Persona priority order (higher number = higher priority)
const PERSONA_PRIORITY = {
  HIGH_UTILIZATION: 5,
  VARIABLE_INCOME: 4,
  SUBSCRIPTION_HEAVY: 3,
  SAVINGS_BUILDER: 2,
  NEW_USER: 1
};

// Recommendation limits
const RECOMMENDATION_LIMITS = {
  MIN_EDUCATION_ITEMS: 3,
  MAX_EDUCATION_ITEMS: 5,
  MIN_PARTNER_OFFERS: 1,
  MAX_PARTNER_OFFERS: 3
};

// Partner offer eligibility thresholds
const PARTNER_OFFER_THRESHOLDS = {
  // Credit score requirements
  MIN_CREDIT_SCORE_BALANCE_TRANSFER: 670,
  MIN_CREDIT_SCORE_DEBT_CONSOLIDATION: 650,
  MIN_CREDIT_SCORE_CASHBACK_CARD: 680,
  
  // Income requirements
  MIN_INCOME_BALANCE_TRANSFER: 30000,
  MIN_INCOME_DEBT_CONSOLIDATION: 40000,
  MIN_INCOME_HIGH_YIELD_SAVINGS: 20000,
  MIN_INCOME_EMERGENCY_FUND: 25000,
  MIN_INCOME_CREDIT_BUILDER: 15000,
  MIN_INCOME_BILL_NEGOTIATION: 30000,
  MIN_INCOME_CASHBACK_CARD: 35000,
  
  // Utilization requirements
  MAX_UTILIZATION_BALANCE_TRANSFER: 0.90,
  MAX_UTILIZATION_DEBT_CONSOLIDATION: 0.85,
  MAX_UTILIZATION_CASHBACK_CARD: 0.40,
  
  // Default thresholds (used when not specified)
  DEFAULT_MIN_CREDIT_SCORE: null,
  DEFAULT_MIN_INCOME: null,
  DEFAULT_MAX_UTILIZATION: null
};

// Prohibited product types (predatory products that should never be recommended)
const PROHIBITED_PRODUCT_TYPES = [
  'payday loan',
  'payday loans',
  'cash advance',
  'title loan',
  'title loans',
  'pawn shop',
  'pawn',
  'check cashing',
  'rent-to-own',
  'rent to own',
  'predatory lending',
  'high-cost loan',
  'high cost loan',
  'installment loan', // Generic installment loans can be predatory - be cautious
  // Note: We're not blocking all installment loans, just being aware
  // Debt consolidation loans are OK if properly vetted
];

// Eligibility filter rules
const ELIGIBILITY_RULES = {
  // Income estimation methods
  USE_LONG_TERM_INCOME: true, // Prefer 180-day analysis for income
  MIN_INCOME_THRESHOLD: 10000, // Absolute minimum annual income to consider any offer
  
  // Credit score estimation
  ESTIMATE_CREDIT_SCORE: true, // Use utilization-based estimation if no actual score
  MIN_CREDIT_SCORE_THRESHOLD: 300, // Minimum possible credit score
  MAX_CREDIT_SCORE_THRESHOLD: 850, // Maximum possible credit score
  
  // Account type matching
  STRICT_ACCOUNT_TYPE_MATCHING: false, // If true, requires exact matches
  // If false, allows partial matches (e.g., "savings" matches "savings_account")
};

// Data generation constants
const DATA_GENERATION = {
  DEFAULT_USER_COUNT: 75,
  MIN_USER_COUNT: 50,
  MAX_USER_COUNT: 100,
  DEFAULT_DAYS_HISTORY: 120,
  MIN_DAYS_HISTORY: 90,
  MAX_DAYS_HISTORY: 180
};

// API endpoints
const API_ENDPOINTS = {
  HEALTH: '/health',
  USERS: '/users',
  CONSENT: '/consent',
  PROFILE: '/profile',
  RECOMMENDATIONS: '/recommendations',
  FEEDBACK: '/feedback',
  OPERATOR: '/operator'
};

module.exports = {
  TIME_WINDOWS,
  SUBSCRIPTION_THRESHOLDS,
  SAVINGS_THRESHOLDS,
  CREDIT_THRESHOLDS,
  INCOME_THRESHOLDS,
  PERSONA_PRIORITY,
  RECOMMENDATION_LIMITS,
  PARTNER_OFFER_THRESHOLDS,
  PROHIBITED_PRODUCT_TYPES,
  ELIGIBILITY_RULES,
  DATA_GENERATION,
  API_ENDPOINTS
};

