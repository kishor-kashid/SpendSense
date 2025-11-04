/**
 * Eligibility Filter Service
 * Guards against recommending ineligible or predatory products
 */

const Account = require('../../models/Account');
const { analyzeIncomeForUser } = require('../features/incomeAnalyzer');
const { analyzeCreditForUser } = require('../features/creditAnalyzer');
const { PROHIBITED_PRODUCT_TYPES } = require('../../config/constants');

/**
 * Estimate credit score from utilization and credit behavior
 * This is a simplified estimation - in production, use actual credit score data
 * @param {Object} creditAnalysis - Credit analysis results
 * @returns {number|null} Estimated credit score or null if cannot estimate
 */
function estimateCreditScore(creditAnalysis) {
  // Use long-term analysis if available, otherwise short-term
  const analysis = creditAnalysis.long_term || creditAnalysis.short_term || {};
  
  // If no credit accounts, cannot estimate
  if (!analysis.max_utilization && analysis.max_utilization !== 0) {
    return null;
  }

  // Simple estimation based on utilization:
  // - 0% utilization: ~750 (good credit behavior)
  // - 30% utilization: ~700 (good management)
  // - 50% utilization: ~650 (moderate)
  // - 80% utilization: ~600 (high risk)
  // - 100% utilization: ~550 (very high risk)
  
  const maxUtilization = analysis.max_utilization || 0;
  let estimatedScore = 750; // Base score
  
  // Penalize based on utilization
  if (maxUtilization >= 0.90) {
    estimatedScore = 550; // Very high utilization
  } else if (maxUtilization >= 0.70) {
    estimatedScore = 600; // High utilization
  } else if (maxUtilization >= 0.50) {
    estimatedScore = 650; // Moderate utilization
  } else if (maxUtilization >= 0.30) {
    estimatedScore = 700; // Good utilization
  } else {
    estimatedScore = 750; // Excellent utilization
  }
  
  // Additional penalties for negative behaviors
  if (analysis.has_interest_charges) {
    estimatedScore -= 20; // Interest charges indicate carrying balance
  }
  
  if (analysis.has_overdue_accounts) {
    estimatedScore -= 50; // Overdue is serious negative factor
  }
  
  if (analysis.has_minimum_payment_only) {
    estimatedScore -= 10; // Minimum payments indicate financial stress
  }
  
  // Clamp to reasonable range (300-850)
  return Math.max(300, Math.min(850, estimatedScore));
}

/**
 * Get user's annual income from income analysis
 * @param {number} userId - User ID
 * @returns {number|null} Annual income in dollars or null if cannot determine
 */
function getUserAnnualIncome(userId) {
  try {
    const incomeAnalysis = analyzeIncomeForUser(userId);
    
    // Prefer long-term analysis for more accurate income estimate
    const analysis = incomeAnalysis.long_term || incomeAnalysis.short_term || {};
    const avgMonthlyIncome = analysis.avg_monthly_income || 0;
    
    if (avgMonthlyIncome > 0) {
      return Math.round(avgMonthlyIncome * 12);
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting income for user ${userId}:`, error);
    return null;
  }
}

/**
 * Get user's credit score (estimated or actual if available)
 * @param {number} userId - User ID
 * @returns {number|null} Credit score or null if cannot determine
 */
function getUserCreditScore(userId) {
  try {
    const creditAnalysis = analyzeCreditForUser(userId);
    return estimateCreditScore(creditAnalysis);
  } catch (error) {
    console.error(`Error getting credit score for user ${userId}:`, error);
    return null;
  }
}

/**
 * Check if user has an account of the specified type
 * @param {number} userId - User ID
 * @param {string|Array} accountTypes - Account type(s) to check (e.g., 'savings', ['savings_account', 'savings'])
 * @returns {boolean} True if user has matching account
 */
function hasAccountType(userId, accountTypes) {
  const accounts = Account.findByUserId(userId);
  const typesToCheck = Array.isArray(accountTypes) ? accountTypes : [accountTypes];
  
  return accounts.some(account => {
    const accountType = (account.type || '').toLowerCase();
    const accountSubtype = (account.subtype || '').toLowerCase();
    
    return typesToCheck.some(typeToCheck => {
      const checkType = typeToCheck.toLowerCase();
      // Check exact match or if account type contains the check type
      return accountType === checkType || 
             accountSubtype === checkType ||
             accountType.includes(checkType) ||
             checkType.includes(accountType) ||
             accountSubtype.includes(checkType) ||
             checkType.includes(accountSubtype);
    });
  });
}

/**
 * Check if a product is a prohibited/predatory product
 * @param {Object} offer - Partner offer object
 * @returns {boolean} True if product is prohibited
 */
function isProhibitedProduct(offer) {
  if (!offer || !offer.offer_category) {
    return false;
  }
  
  const category = offer.offer_category.toLowerCase();
  const offerType = (offer.offer_type || '').toLowerCase();
  const title = (offer.title || '').toLowerCase();
  const description = (offer.description || '').toLowerCase();
  
  // Check against prohibited product types
  const isProhibited = PROHIBITED_PRODUCT_TYPES.some(prohibited => {
    const prohibitedLower = prohibited.toLowerCase();
    return category.includes(prohibitedLower) ||
           offerType.includes(prohibitedLower) ||
           title.includes(prohibitedLower) ||
           description.includes(prohibitedLower);
  });
  
  return isProhibited;
}

/**
 * Check if a user is eligible for a partner offer
 * @param {Object} offer - Partner offer object
 * @param {number} userId - User ID
 * @returns {Object} Eligibility result with isEligible flag and details
 */
function checkOfferEligibility(offer, userId) {
  const result = {
    isEligible: true,
    reasons: [],
    disqualifiers: [],
    checks: {
      prohibited_product: false,
      income: null,
      credit_score: null,
      account_type: null
    }
  };
  
  // Check 1: Prohibited products (hard block)
  if (isProhibitedProduct(offer)) {
    result.isEligible = false;
    result.disqualifiers.push('This product type is prohibited (predatory product)');
    result.checks.prohibited_product = true;
    return result; // Early return - no need to check other criteria
  }
  
  // Get user's financial data
  const userAnnualIncome = getUserAnnualIncome(userId);
  const userCreditScore = getUserCreditScore(userId);
  const userAccounts = Account.findByUserId(userId);
  
  const eligibility = offer.eligibility || {};
  
  // Check 2: Minimum income requirement
  if (eligibility.min_income !== null && eligibility.min_income !== undefined) {
    result.checks.income = {
      required: eligibility.min_income,
      actual: userAnnualIncome,
      meets_requirement: userAnnualIncome !== null && userAnnualIncome >= eligibility.min_income
    };
    
    if (userAnnualIncome === null) {
      result.isEligible = false;
      result.disqualifiers.push(`Cannot determine income. Requires minimum annual income of $${eligibility.min_income.toLocaleString()}`);
    } else if (userAnnualIncome < eligibility.min_income) {
      result.isEligible = false;
      result.disqualifiers.push(`Requires minimum annual income of $${eligibility.min_income.toLocaleString()}. Your income: $${userAnnualIncome.toLocaleString()}`);
    } else {
      result.reasons.push(`Income requirement met: $${userAnnualIncome.toLocaleString()} >= $${eligibility.min_income.toLocaleString()}`);
    }
  }
  
  // Check 3: Minimum credit score requirement
  if (eligibility.min_credit_score !== null && eligibility.min_credit_score !== undefined) {
    result.checks.credit_score = {
      required: eligibility.min_credit_score,
      actual: userCreditScore,
      meets_requirement: userCreditScore !== null && userCreditScore >= eligibility.min_credit_score
    };
    
    if (userCreditScore === null) {
      result.isEligible = false;
      result.disqualifiers.push(`Cannot determine credit score. Requires minimum credit score of ${eligibility.min_credit_score}`);
    } else if (userCreditScore < eligibility.min_credit_score) {
      result.isEligible = false;
      result.disqualifiers.push(`Requires minimum credit score of ${eligibility.min_credit_score}. Estimated score: ${userCreditScore}`);
    } else {
      result.reasons.push(`Credit score requirement met: ${userCreditScore} >= ${eligibility.min_credit_score}`);
    }
  }
  
  // Check 4: Maximum utilization requirement
  if (eligibility.max_utilization !== null && eligibility.max_utilization !== undefined) {
    try {
      const creditAnalysis = analyzeCreditForUser(userId);
      const analysis = creditAnalysis.long_term || creditAnalysis.short_term || {};
      const maxUtilization = analysis.max_utilization || 0;
      
      result.checks.max_utilization = {
        required: eligibility.max_utilization,
        actual: maxUtilization,
        meets_requirement: maxUtilization <= eligibility.max_utilization
      };
      
      if (maxUtilization > eligibility.max_utilization) {
        result.isEligible = false;
        result.disqualifiers.push(`Requires credit utilization below ${(eligibility.max_utilization * 100).toFixed(0)}%. Current: ${(maxUtilization * 100).toFixed(0)}%`);
      } else {
        result.reasons.push(`Credit utilization acceptable: ${(maxUtilization * 100).toFixed(0)}% <= ${(eligibility.max_utilization * 100).toFixed(0)}%`);
      }
    } catch (error) {
      // If we can't analyze credit, we might still allow the offer
      // but log the issue
      console.warn(`Could not check utilization for user ${userId}:`, error);
    }
  }
  
  // Check 5: Excluded account types (don't offer if user already has this type)
  if (eligibility.excluded_account_types && eligibility.excluded_account_types.length > 0) {
    const hasExcludedType = eligibility.excluded_account_types.some(excludedType => {
      return hasAccountType(userId, excludedType);
    });
    
    result.checks.account_type = {
      excluded_types: eligibility.excluded_account_types,
      has_excluded_type: hasExcludedType
    };
    
    if (hasExcludedType) {
      result.isEligible = false;
      result.disqualifiers.push(`User already has a ${eligibility.excluded_account_types.join(' or ')} account`);
    } else {
      result.reasons.push(`User does not have excluded account types: ${eligibility.excluded_account_types.join(', ')}`);
    }
  }
  
  return result;
}

/**
 * Filter offers to only include eligible ones
 * @param {Array} offers - Array of partner offers
 * @param {number} userId - User ID
 * @returns {Array} Eligible offers with eligibility details
 */
function filterEligibleOffers(offers, userId) {
  if (!Array.isArray(offers)) {
    return [];
  }
  
  return offers.map(offer => {
    const eligibility = checkOfferEligibility(offer, userId);
    return {
      ...offer,
      eligibility_check: eligibility
    };
  }).filter(offer => offer.eligibility_check.isEligible);
}

/**
 * Check if an offer passes all eligibility filters
 * Throws error if offer is ineligible (for use as guardrail)
 * @param {Object} offer - Partner offer object
 * @param {number} userId - User ID
 * @throws {Error} If offer is ineligible
 */
function requireEligibleOffer(offer, userId) {
  const eligibility = checkOfferEligibility(offer, userId);
  
  if (!eligibility.isEligible) {
    const reasons = eligibility.disqualifiers.join('; ');
    throw new Error(`Offer "${offer.title || offer.id}" is not eligible for user ${userId}: ${reasons}`);
  }
}

module.exports = {
  estimateCreditScore,
  getUserAnnualIncome,
  getUserCreditScore,
  hasAccountType,
  isProhibitedProduct,
  checkOfferEligibility,
  filterEligibleOffers,
  requireEligibleOffer
};

