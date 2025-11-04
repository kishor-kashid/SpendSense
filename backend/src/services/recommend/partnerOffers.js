/**
 * Partner Offers Catalog Service
 * Manages partner offers mapped to personas with eligibility checking
 */

const fs = require('fs');
const path = require('path');

// Path: backend/src/services/recommend -> backend/data/content/partner_offers.json
const PARTNER_OFFERS_PATH = path.join(__dirname, '../../../data/content/partner_offers.json');

/**
 * Load partner offers from JSON file
 * @returns {Array} Array of partner offers
 */
function loadPartnerOffers() {
  try {
    const content = fs.readFileSync(PARTNER_OFFERS_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading partner offers:', error);
    return [];
  }
}

/**
 * Get partner offers by persona ID
 * @param {string} personaId - Persona ID (e.g., 'high_utilization')
 * @returns {Array} Filtered partner offers for the persona
 */
function getOffersByPersona(personaId) {
  const allOffers = loadPartnerOffers();
  return allOffers.filter(offer => 
    offer.persona_fit && offer.persona_fit.includes(personaId)
  );
}

/**
 * Get partner offers by offer category
 * @param {string} category - Offer category (e.g., 'balance_transfer', 'high_yield_savings')
 * @returns {Array} Filtered partner offers by category
 */
function getOffersByCategory(category) {
  const allOffers = loadPartnerOffers();
  return allOffers.filter(offer => offer.offer_category === category);
}

/**
 * Get partner offers by recommendation type
 * @param {string} recommendationType - Recommendation type (e.g., 'debt_paydown', 'savings_building')
 * @returns {Array} Filtered partner offers by recommendation type
 */
function getOffersByRecommendationType(recommendationType) {
  const allOffers = loadPartnerOffers();
  return allOffers.filter(offer => 
    offer.recommendation_types && offer.recommendation_types.includes(recommendationType)
  );
}

/**
 * Get all partner offers
 * @returns {Array} All partner offers
 */
function getAllOffers() {
  return loadPartnerOffers();
}

/**
 * Get partner offer by ID
 * @param {string} offerId - Partner offer ID
 * @returns {Object|null} Partner offer or null
 */
function getOfferById(offerId) {
  const allOffers = loadPartnerOffers();
  return allOffers.find(offer => offer.id === offerId) || null;
}

/**
 * Check if a user is eligible for a partner offer
 * @param {Object} offer - Partner offer object
 * @param {Object} userData - User data including financial analysis
 * @param {Object} userAccounts - Array of user's existing accounts
 * @returns {Object} Eligibility result with isEligible flag and reasons
 */
function checkEligibility(offer, userData, userAccounts = []) {
  const eligibility = offer.eligibility || {};
  const result = {
    isEligible: true,
    reasons: [],
    disqualifiers: []
  };

  // Check minimum credit score
  if (eligibility.min_credit_score !== null && eligibility.min_credit_score !== undefined) {
    const userCreditScore = userData.creditScore || null;
    if (userCreditScore === null || userCreditScore < eligibility.min_credit_score) {
      result.isEligible = false;
      result.disqualifiers.push(`Requires minimum credit score of ${eligibility.min_credit_score}`);
    }
  }

  // Check minimum income
  if (eligibility.min_income !== null && eligibility.min_income !== undefined) {
    const userIncome = userData.estimatedAnnualIncome || userData.monthlyIncome * 12 || null;
    if (userIncome === null || userIncome < eligibility.min_income) {
      result.isEligible = false;
      result.disqualifiers.push(`Requires minimum annual income of $${eligibility.min_income.toLocaleString()}`);
    }
  }

  // Check maximum utilization
  if (eligibility.max_utilization !== null && eligibility.max_utilization !== undefined) {
    const maxUtilization = userData.maxCreditUtilization || 0;
    if (maxUtilization > eligibility.max_utilization) {
      result.isEligible = false;
      result.disqualifiers.push(`Requires credit utilization below ${(eligibility.max_utilization * 100).toFixed(0)}%`);
    }
  }

  // Check for excluded account types
  if (eligibility.excluded_account_types && eligibility.excluded_account_types.length > 0) {
    const accountTypes = userAccounts.map(acc => {
      // Get both type and subtype, normalize to lowercase
      const type = (acc.type || '').toLowerCase();
      const subtype = (acc.subtype || '').toLowerCase();
      return { type, subtype };
    });
    
    const hasExcludedType = eligibility.excluded_account_types.some(excludedType => {
      const excludedLower = excludedType.toLowerCase();
      // Extract the base type from excluded type (e.g., "savings" from "savings_account")
      const excludedBase = excludedLower.split('_')[0];
      
      return accountTypes.some(acc => {
        // Check if type or subtype matches the excluded type
        // Match exact or if excluded type contains account type keyword
        // e.g., "savings_account" excluded matches account with type "savings"
        // Skip empty strings to avoid false matches
        return (acc.type && (
          acc.type === excludedLower ||
          acc.type.includes(excludedBase) ||
          excludedLower.includes(acc.type)
        )) || (acc.subtype && (
          acc.subtype === excludedLower ||
          acc.subtype.includes(excludedBase) ||
          excludedLower.includes(acc.subtype)
        ));
      });
    });
    
    if (hasExcludedType) {
      result.isEligible = false;
      result.disqualifiers.push(`User already has a ${eligibility.excluded_account_types.join(' or ')} account`);
    }
  }

  // If eligible, add positive reasons
  if (result.isEligible) {
    if (eligibility.min_credit_score) {
      result.reasons.push(`Credit score meets minimum requirement`);
    }
    if (eligibility.min_income) {
      result.reasons.push(`Income meets minimum requirement`);
    }
    if (eligibility.max_utilization !== null && eligibility.max_utilization !== undefined) {
      result.reasons.push(`Credit utilization within acceptable range`);
    }
  }

  return result;
}

/**
 * Filter offers by eligibility for a user
 * @param {Array} offers - Array of partner offers
 * @param {Object} userData - User data including financial analysis
 * @param {Array} userAccounts - Array of user's existing accounts
 * @returns {Array} Eligible offers with eligibility details
 */
function filterEligibleOffers(offers, userData, userAccounts = []) {
  return offers.map(offer => {
    const eligibility = checkEligibility(offer, userData, userAccounts);
    return {
      ...offer,
      eligibility_check: eligibility
    };
  }).filter(offer => offer.eligibility_check.isEligible);
}

/**
 * Select partner offers for a persona
 * Returns 1-3 offers that best match the persona and are eligible
 * 
 * @param {Object} persona - Persona object with recommendationTypes
 * @param {Object} userData - User data including financial analysis
 * @param {Array} userAccounts - Array of user's existing accounts
 * @param {Object} options - Selection options
 * @param {number} options.minOffers - Minimum offers to return (default: 1)
 * @param {number} options.maxOffers - Maximum offers to return (default: 3)
 * @returns {Array} Selected eligible partner offers
 */
function selectOffersForPersona(persona, userData, userAccounts = [], options = {}) {
  const { minOffers = 1, maxOffers = 3 } = options;
  
  if (!persona || !persona.recommendationTypes) {
    return [];
  }

  const allOffers = loadPartnerOffers();
  const personaId = persona.id;
  
  // Score offers based on how well they match
  const scoredOffers = allOffers.map(offer => {
    let score = 0;
    
    // High score if persona_fit includes this persona
    if (offer.persona_fit && offer.persona_fit.includes(personaId)) {
      score += 10;
    }
    
    // Score based on recommendation type matches
    if (offer.recommendation_types && persona.recommendationTypes) {
      const matchingTypes = offer.recommendation_types.filter(type => 
        persona.recommendationTypes.includes(type)
      );
      score += matchingTypes.length * 5;
    }
    
    return { offer, score };
  });
  
  // Sort by score (descending) and filter by eligibility
  const sorted = scoredOffers.sort((a, b) => b.score - a.score);
  const eligibleOffers = filterEligibleOffers(
    sorted.map(s => s.offer),
    userData,
    userAccounts
  );
  
  // Select top eligible offers
  const selected = eligibleOffers.slice(0, maxOffers);
  
  // If we don't have enough eligible offers, try to include more (even if lower score)
  if (selected.length < minOffers) {
    const remaining = sorted
      .filter(scored => !selected.find(s => s.id === scored.offer.id))
      .map(s => s.offer);
    
    const additionalEligible = filterEligibleOffers(remaining, userData, userAccounts);
    selected.push(...additionalEligible.slice(0, minOffers - selected.length));
  }
  
  return selected.slice(0, maxOffers);
}

module.exports = {
  loadPartnerOffers,
  getOffersByPersona,
  getOffersByCategory,
  getOffersByRecommendationType,
  getAllOffers,
  getOfferById,
  checkEligibility,
  filterEligibleOffers,
  selectOffersForPersona
};

