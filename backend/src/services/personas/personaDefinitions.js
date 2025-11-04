/**
 * Persona Definitions
 * Defines all 5 personas with clear, measurable criteria
 */

const { 
  CREDIT_THRESHOLDS, 
  INCOME_THRESHOLDS, 
  SUBSCRIPTION_THRESHOLDS,
  SAVINGS_THRESHOLDS 
} = require('../../config/constants');

/**
 * Persona definitions with criteria and metadata
 */
const PERSONAS = {
  HIGH_UTILIZATION: {
    id: 'high_utilization',
    name: 'High Utilization',
    description: 'Users with high credit card utilization, interest charges, or payment issues',
    priority: 5, // Highest priority
    
    /**
     * Check if user matches High Utilization persona criteria
     * Criteria: Any card utilization ≥50% OR interest charges > 0 OR minimum-payment-only OR is_overdue = true
     * 
     * @param {Object} creditAnalysis - Credit analysis results (from creditAnalyzer)
     * @returns {boolean} True if user matches this persona
     */
    matches: (creditAnalysis) => {
      if (!creditAnalysis) {
        return false;
      }
      
      // Credit analyzer returns object with short_term and long_term
      // Check if either window meets threshold
      const shortTerm = creditAnalysis.short_term;
      const longTerm = creditAnalysis.long_term;
      
      return (shortTerm && shortTerm.meets_threshold) || 
             (longTerm && longTerm.meets_threshold) ||
             creditAnalysis.meets_credit_threshold;
    },
    
    /**
     * Get rationale for why user matches this persona
     * @param {Object} creditAnalysis - Credit analysis results
     * @returns {string} Human-readable rationale
     */
    getRationale: (creditAnalysis) => {
      if (!creditAnalysis) {
        return null;
      }
      
      // Get cards from short_term or long_term
      const shortTerm = creditAnalysis.short_term;
      const longTerm = creditAnalysis.long_term;
      const cards = (shortTerm && shortTerm.cards) || (longTerm && longTerm.cards) || [];
      
      if (cards.length === 0) {
        return null;
      }
      
      const reasons = [];
      
      // Check for high utilization
      const highUtilCards = cards.filter(c => c.is_high_utilization);
      if (highUtilCards.length > 0) {
        const card = highUtilCards[0];
        reasons.push(`Your ${card.account_name} has ${card.utilization_percentage}% utilization`);
      } else {
        const medUtilCards = cards.filter(c => c.is_medium_utilization);
        if (medUtilCards.length > 0) {
          const card = medUtilCards[0];
          reasons.push(`Your ${card.account_name} has ${card.utilization_percentage}% utilization`);
        }
      }
      
      // Check for interest charges
      const interestCards = cards.filter(c => c.has_interest_charges);
      if (interestCards.length > 0) {
        const card = interestCards[0];
        reasons.push(`you're paying $${card.total_interest_charges.toFixed(2)} in interest charges`);
      }
      
      // Check for minimum payment only
      const minPayCards = cards.filter(c => c.is_minimum_payment_only);
      if (minPayCards.length > 0) {
        reasons.push(`you're making minimum payments only`);
      }
      
      // Check for overdue
      if (creditAnalysis.has_overdue) {
        reasons.push(`you have overdue payments`);
      }
      
      return reasons.length > 0 
        ? `We noticed ${reasons.join(', ')}.` 
        : 'You have credit utilization concerns.';
    },
    
    educationalFocus: 'Reduce utilization and interest through payment planning and autopay education',
    recommendationTypes: ['debt_paydown', 'payment_planning', 'autopay_setup', 'balance_transfer']
  },

  VARIABLE_INCOME: {
    id: 'variable_income',
    name: 'Variable Income Budgeter',
    description: 'Users with irregular income patterns and limited cash flow buffer',
    priority: 4,
    
    /**
     * Check if user matches Variable Income Budgeter persona criteria
     * Criteria: Median pay gap > 45 days AND cash-flow buffer < 1 month
     * 
     * @param {Object} incomeAnalysis - Income analysis results (from incomeAnalyzer)
     * @returns {boolean} True if user matches this persona
     */
    matches: (incomeAnalysis) => {
      if (!incomeAnalysis) {
        return false;
      }
      
      // Check both short-term and long-term windows
      const shortTerm = incomeAnalysis.short_term;
      const longTerm = incomeAnalysis.long_term;
      
      // Check if median pay gap > 45 days AND cash-flow buffer < 1 month
      const checkWindow = (window) => {
        if (!window) return false;
        
        const payGapCheck = window.median_pay_gap_days !== null && 
                           window.median_pay_gap_days > INCOME_THRESHOLDS.MAX_PAY_GAP_DAYS;
        const bufferCheck = window.cash_flow_buffer_months < INCOME_THRESHOLDS.MIN_CASH_FLOW_BUFFER;
        
        return payGapCheck && bufferCheck;
      };
      
      return checkWindow(shortTerm) || checkWindow(longTerm);
    },
    
    /**
     * Get rationale for why user matches this persona
     * @param {Object} incomeAnalysis - Income analysis results
     * @returns {string} Human-readable rationale
     */
    getRationale: (incomeAnalysis) => {
      if (!incomeAnalysis) return null;
      
      const window = incomeAnalysis.short_term || incomeAnalysis.long_term;
      if (!window) return null;
      
      const reasons = [];
      
      if (window.median_pay_gap_days && window.median_pay_gap_days > INCOME_THRESHOLDS.MAX_PAY_GAP_DAYS) {
        reasons.push(`your paychecks come ${window.median_pay_gap_days} days apart on average`);
      }
      
      if (window.cash_flow_buffer_months < INCOME_THRESHOLDS.MIN_CASH_FLOW_BUFFER) {
        reasons.push(`you have ${window.cash_flow_buffer_months.toFixed(1)} months of expenses saved`);
      }
      
      return reasons.length > 0
        ? `We noticed ${reasons.join(' and ')}.`
        : 'You have variable income patterns.';
    },
    
    educationalFocus: 'Percent-based budgets, emergency fund basics, smoothing strategies',
    recommendationTypes: ['budgeting', 'emergency_fund', 'income_smoothing', 'savings_strategy']
  },

  SUBSCRIPTION_HEAVY: {
    id: 'subscription_heavy',
    name: 'Subscription-Heavy',
    description: 'Users with multiple recurring subscriptions consuming significant spending',
    priority: 3,
    
    /**
     * Check if user matches Subscription-Heavy persona criteria
     * Criteria: Recurring merchants ≥3 AND (monthly recurring spend ≥$50 in 30d OR subscription spend share ≥10%)
     * 
     * @param {Object} subscriptionAnalysis - Subscription analysis results (from subscriptionDetector)
     * @returns {boolean} True if user matches this persona
     */
    matches: (subscriptionAnalysis) => {
      if (!subscriptionAnalysis) {
        return false;
      }
      
      // Check both short-term and long-term windows
      const shortTerm = subscriptionAnalysis.short_term;
      const longTerm = subscriptionAnalysis.long_term;
      
      const checkWindow = (window) => {
        if (!window) return false;
        
        const hasEnoughMerchants = window.recurring_merchant_count >= SUBSCRIPTION_THRESHOLDS.MIN_RECURRING_MERCHANTS;
        const hasEnoughSpend = window.total_monthly_recurring_spend >= SUBSCRIPTION_THRESHOLDS.MIN_MONTHLY_RECURRING_SPEND;
        const hasEnoughShare = window.subscription_share >= SUBSCRIPTION_THRESHOLDS.MIN_SUBSCRIPTION_SHARE;
        
        return hasEnoughMerchants && (hasEnoughSpend || hasEnoughShare);
      };
      
      return checkWindow(shortTerm) || checkWindow(longTerm);
    },
    
    /**
     * Get rationale for why user matches this persona
     * @param {Object} subscriptionAnalysis - Subscription analysis results
     * @returns {string} Human-readable rationale
     */
    getRationale: (subscriptionAnalysis) => {
      if (!subscriptionAnalysis) return null;
      
      const window = subscriptionAnalysis.short_term || subscriptionAnalysis.long_term;
      if (!window) return null;
      
      const reasons = [];
      
      if (window.recurring_merchant_count >= SUBSCRIPTION_THRESHOLDS.MIN_RECURRING_MERCHANTS) {
        reasons.push(`you have ${window.recurring_merchant_count} recurring subscriptions`);
      }
      
      if (window.total_monthly_recurring_spend >= SUBSCRIPTION_THRESHOLDS.MIN_MONTHLY_RECURRING_SPEND) {
        reasons.push(`you're spending $${window.total_monthly_recurring_spend.toFixed(2)}/month on subscriptions`);
      }
      
      if (window.subscription_share >= SUBSCRIPTION_THRESHOLDS.MIN_SUBSCRIPTION_SHARE) {
        const sharePercent = (window.subscription_share * 100).toFixed(0);
        reasons.push(`subscriptions make up ${sharePercent}% of your spending`);
      }
      
      return reasons.length > 0
        ? `We noticed ${reasons.join(', ')}.`
        : 'You have multiple recurring subscriptions.';
    },
    
    educationalFocus: 'Subscription audit, cancellation/negotiation tips, bill alerts',
    recommendationTypes: ['subscription_audit', 'bill_management', 'spending_tracking', 'negotiation_tips']
  },

  SAVINGS_BUILDER: {
    id: 'savings_builder',
    name: 'Savings Builder',
    description: 'Users actively building savings with good credit utilization',
    priority: 2,
    
    /**
     * Check if user matches Savings Builder persona criteria
     * Criteria: Savings growth rate ≥2% OR net savings inflow ≥$200/month, AND all card utilizations < 30%
     * 
     * @param {Object} savingsAnalysis - Savings analysis results (from savingsAnalyzer)
     * @param {Object} creditAnalysis - Credit analysis results (from creditAnalyzer)
     * @returns {boolean} True if user matches this persona
     */
    matches: (savingsAnalysis, creditAnalysis) => {
      if (!savingsAnalysis) {
        return false;
      }
      
      // Check both short-term and long-term windows for savings
      const shortTerm = savingsAnalysis.short_term;
      const longTerm = savingsAnalysis.long_term;
      
      const checkSavingsWindow = (window) => {
        if (!window) return false;
        
        const hasGrowthRate = window.growth_rate >= SAVINGS_THRESHOLDS.MIN_GROWTH_RATE;
        const hasMonthlyInflow = window.monthly_net_inflow >= SAVINGS_THRESHOLDS.MIN_MONTHLY_INFLOW;
        
        return hasGrowthRate || hasMonthlyInflow;
      };
      
      const meetsSavingsCriteria = checkSavingsWindow(shortTerm) || checkSavingsWindow(longTerm);
      
      if (!meetsSavingsCriteria) {
        return false;
      }
      
      // Also need all credit cards to have < 30% utilization
      if (!creditAnalysis) {
        // No credit analysis = automatically passes the credit check
        return true;
      }
      
      // Get credit card count from short_term or long_term
      const creditShortTerm = creditAnalysis.short_term;
      const creditLongTerm = creditAnalysis.long_term;
      const creditCardCount = (creditShortTerm && creditShortTerm.credit_card_count) || 
                             (creditLongTerm && creditLongTerm.credit_card_count) || 0;
      
      if (creditCardCount === 0) {
        // No credit cards = automatically passes the credit check
        return true;
      }
      
      // Check all cards have < 30% utilization
      const cards = (creditShortTerm && creditShortTerm.cards) || 
                   (creditLongTerm && creditLongTerm.cards) || [];
      
      if (cards.length === 0) {
        // No cards found = automatically passes
        return true;
      }
      
      const allCardsUnder30 = cards.every(card => 
        card.utilization < CREDIT_THRESHOLDS.LOW_UTILIZATION
      );
      
      return allCardsUnder30;
    },
    
    /**
     * Get rationale for why user matches this persona
     * @param {Object} savingsAnalysis - Savings analysis results
     * @param {Object} creditAnalysis - Credit analysis results
     * @returns {string} Human-readable rationale
     */
    getRationale: (savingsAnalysis, creditAnalysis) => {
      if (!savingsAnalysis) return null;
      
      const window = savingsAnalysis.short_term || savingsAnalysis.long_term;
      if (!window) return null;
      
      const reasons = [];
      
      if (window.growth_rate >= SAVINGS_THRESHOLDS.MIN_GROWTH_RATE) {
        const growthPercent = (window.growth_rate * 100).toFixed(1);
        reasons.push(`your savings are growing at ${growthPercent}%`);
      }
      
      if (window.monthly_net_inflow >= SAVINGS_THRESHOLDS.MIN_MONTHLY_INFLOW) {
        reasons.push(`you're saving $${window.monthly_net_inflow.toFixed(2)}/month`);
      }
      
      if (creditAnalysis && creditAnalysis.credit_card_count > 0) {
        const allLowUtil = creditAnalysis.cards.every(c => 
          c.utilization < CREDIT_THRESHOLDS.LOW_UTILIZATION
        );
        if (allLowUtil) {
          reasons.push(`you're keeping credit utilization low`);
        }
      }
      
      return reasons.length > 0
        ? `Great job! We noticed ${reasons.join(', ')}.`
        : 'You\'re actively building your savings.';
    },
    
    educationalFocus: 'Goal setting, automation, APY optimization (HYSA/CD basics)',
    recommendationTypes: ['savings_goals', 'automation', 'hysa', 'cd_basics', 'investment_basics']
  },

  NEW_USER: {
    id: 'new_user',
    name: 'New User',
    description: 'Recently joined users with limited credit history or accounts',
    priority: 1, // Lowest priority (fallback)
    
    /**
     * Check if user matches New User persona criteria
     * Criteria: New user who may just have created the account and do not have much credit limit or loans
     * 
     * @param {Object} userData - User data from database
     * @param {Object} creditAnalysis - Credit analysis results (from creditAnalyzer)
     * @param {Object} accountData - Account data
     * @returns {boolean} True if user matches this persona
     */
    matches: (userData, creditAnalysis, accountData) => {
      // Check if user is new (created within last 90 days)
      if (!userData || !userData.created_at) {
        return false;
      }
      
      const createdDate = new Date(userData.created_at);
      const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // User must be created within last 90 days
      if (daysSinceCreation > 90) {
        return false;
      }
      
      // Check if user has limited credit
      const shortTerm = creditAnalysis?.short_term;
      const longTerm = creditAnalysis?.long_term;
      const creditCardCount = (shortTerm && shortTerm.credit_card_count) || 
                             (longTerm && longTerm.credit_card_count) || 0;
      
      const hasLimitedCredit = creditCardCount === 0 ||
                              (creditCardCount > 0 && 
                               ((shortTerm && shortTerm.cards) || (longTerm && longTerm.cards) || [])
                               .every(card => (card.limit || 0) < 1000)); // Low credit limits
      
      // Check if user has few accounts
      const hasFewAccounts = !accountData || 
                            (accountData.account_count || 0) <= 2; // 2 or fewer accounts
      
      return hasLimitedCredit && hasFewAccounts;
    },
    
    /**
     * Get rationale for why user matches this persona
     * @param {Object} userData - User data
     * @returns {string} Human-readable rationale
     */
    getRationale: (userData) => {
      if (!userData) return null;
      
      const createdDate = new Date(userData.created_at);
      const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return `Welcome! You've been with us for ${daysSinceCreation} days. We'd like to help you build your financial foundation.`;
    },
    
    educationalFocus: 'Build credit history, understand financial products, establish good habits',
    recommendationTypes: ['credit_building', 'first_credit_card', 'financial_basics', 'account_setup']
  }
};

/**
 * Get all persona definitions
 * @returns {Object} All persona definitions
 */
function getAllPersonas() {
  return PERSONAS;
}

/**
 * Get persona by ID
 * @param {string} personaId - Persona ID
 * @returns {Object|null} Persona definition or null
 */
function getPersonaById(personaId) {
  return PERSONAS[personaId.toUpperCase()] || null;
}

/**
 * Get persona by name (case-insensitive)
 * @param {string} personaName - Persona name
 * @returns {Object|null} Persona definition or null
 */
function getPersonaByName(personaName) {
  const normalizedName = personaName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const personaKey = Object.keys(PERSONAS).find(key => 
    PERSONAS[key].id === normalizedName
  );
  return personaKey ? PERSONAS[personaKey] : null;
}

module.exports = {
  PERSONAS,
  getAllPersonas,
  getPersonaById,
  getPersonaByName
};

