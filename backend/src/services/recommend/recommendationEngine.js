/**
 * Recommendation Engine Service
 * Combines persona assignment, content selection, and rationale generation
 * to create personalized recommendations for users
 */

const { assignPersonaToUser } = require('../personas/personaAssigner');
const { selectItemsForPersona } = require('./educationCatalog');
const { selectOffersForPersona } = require('./partnerOffers');
const { generateRationale } = require('./rationaleGenerator');
const { requireConsent } = require('../guardrails/consentChecker');
const { hasAIConsent } = require('../guardrails/aiConsentChecker');
const { generateAIRationalesForRecommendations } = require('../ai/rationaleGenerator');
const { RECOMMENDATION_LIMITS } = require('../../config/constants');
const Account = require('../../models/Account');
const User = require('../../models/User');
const cache = require('../../utils/cache');

/**
 * Performance monitoring wrapper
 * @param {string} operation - Operation name
 * @param {Function} fn - Function to measure
 * @returns {any} Function result
 */
function measurePerformance(operation, fn) {
  const startTime = Date.now();
  try {
    const result = fn();
    const duration = Date.now() - startTime;
    if (process.env.NODE_ENV !== 'test' && duration > 1000) {
      console.log(`[Performance] ${operation} took ${duration}ms`);
    }
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Performance] ${operation} failed after ${duration}ms:`, error.message);
    throw error;
  }
}

/**
 * Generate recommendations for a user
 * Combines persona assignment, content selection, and rationale generation
 * 
 * @param {number} userId - User ID
 * @param {Object} options - Options for recommendation generation
 * @param {number} options.minEducationItems - Minimum education items (default: 3)
 * @param {number} options.maxEducationItems - Maximum education items (default: 5)
 * @param {number} options.minPartnerOffers - Minimum partner offers (default: 1)
 * @param {number} options.maxPartnerOffers - Maximum partner offers (default: 3)
 * @param {boolean} options.forceRefresh - Force refresh (skip cache) (default: false)
 * @returns {Promise<Object>} Recommendations with education items, partner offers, and rationales
 */
async function generateRecommendations(userId, options = {}) {
  const {
    minEducationItems = RECOMMENDATION_LIMITS.MIN_EDUCATION_ITEMS,
    maxEducationItems = RECOMMENDATION_LIMITS.MAX_EDUCATION_ITEMS,
    minPartnerOffers = RECOMMENDATION_LIMITS.MIN_PARTNER_OFFERS,
    maxPartnerOffers = RECOMMENDATION_LIMITS.MAX_PARTNER_OFFERS,
    forceRefresh = false
  } = options;

  // Check cache first (unless force refresh)
  const cacheKey = cache.generateKey('recommendations', userId, minEducationItems, maxEducationItems, minPartnerOffers, maxPartnerOffers);
  if (!forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Check consent before processing
  requireConsent(userId);

  // Get user data (cached)
  const userCacheKey = cache.generateKey('user', userId);
  let user = cache.get(userCacheKey);
  if (!user) {
    user = measurePerformance(`getUser(${userId})`, () => User.findById(userId));
    if (user) {
      cache.set(userCacheKey, user, 300000); // Cache for 5 minutes
    }
  }
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  // Get accounts for eligibility checking (cached)
  const accountsCacheKey = cache.generateKey('accounts', userId);
  let accounts = cache.get(accountsCacheKey);
  if (!accounts) {
    accounts = measurePerformance(`getAccounts(${userId})`, () => Account.findByUserId(userId));
    if (accounts) {
      cache.set(accountsCacheKey, accounts, 300000); // Cache for 5 minutes
    }
  }

  // Assign persona (this runs all feature analyses) - cached
  const personaCacheKey = cache.generateKey('persona', userId);
  let personaAssignment = cache.get(personaCacheKey);
  if (!personaAssignment) {
    personaAssignment = measurePerformance(`assignPersona(${userId})`, () => assignPersonaToUser(userId));
    if (personaAssignment) {
      cache.set(personaCacheKey, personaAssignment, 300000); // Cache for 5 minutes
    }
  }
  const persona = personaAssignment.assigned_persona;
  const behavioralSignals = personaAssignment.behavioral_signals;

  // Prepare user data for offer eligibility checking
  const userData = {
    creditScore: extractCreditScore(behavioralSignals.credit),
    estimatedAnnualIncome: extractAnnualIncome(behavioralSignals.income),
    monthlyIncome: extractMonthlyIncome(behavioralSignals.income),
    maxCreditUtilization: extractMaxUtilization(behavioralSignals.credit)
  };

  // Select education items
  const educationItems = selectItemsForPersona(
    {
      id: persona.id,
      recommendationTypes: persona.recommendation_types
    },
    {
      minItems: minEducationItems,
      maxItems: maxEducationItems
    }
  );

  // Select partner offers
  const partnerOffers = selectOffersForPersona(
    {
      id: persona.id,
      recommendationTypes: persona.recommendation_types
    },
    userData,
    accounts,
    {
      minOffers: minPartnerOffers,
      maxOffers: maxPartnerOffers
    }
  );

  // Generate template-based rationales for education items (ALWAYS generated)
  const educationRecommendations = educationItems.map(item => ({
    type: 'education',
    item: {
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      content_type: item.content_type,
      url: item.url,
      estimated_read_time: item.estimated_read_time,
      difficulty: item.difficulty
    },
    rationale: generateRationale(
      item,
      'education',
      persona,
      behavioralSignals,
      { user, accounts }
    ),
    // AI rationale will be added below if AI consent is granted
    ai_rationale: null
  }));

  // Generate template-based rationales for partner offers (ALWAYS generated)
  const offerRecommendations = partnerOffers.map(offer => ({
    type: 'offer',
    item: {
      id: offer.id,
      title: offer.title,
      description: offer.description,
      offer_type: offer.offer_type,
      offer_category: offer.offer_category,
      benefits: offer.benefits,
      provider_name: offer.provider_name,
      provider_url: offer.provider_url,
      estimated_savings: offer.estimated_savings,
      difficulty: offer.difficulty
    },
    rationale: generateRationale(
      offer,
      'offer',
      persona,
      behavioralSignals,
      { user, accounts }
    ),
    eligibility_check: offer.eligibility_check || null,
    // AI rationale will be added below if AI consent is granted
    ai_rationale: null
  }));

  // Add AI rationales if AI consent is granted (non-blocking, graceful fallback)
  let finalEducationRecommendations = educationRecommendations;
  let finalOfferRecommendations = offerRecommendations;

  if (hasAIConsent(userId)) {
    try {
      // Prepare recommendations with context for AI rationale generation
      const allRecommendations = [
        ...educationRecommendations.map(rec => ({
          ...rec,
          persona: persona,
          behavioralSignals: behavioralSignals,
          userData: { user, accounts }
        })),
        ...offerRecommendations.map(rec => ({
          ...rec,
          persona: persona,
          behavioralSignals: behavioralSignals,
          userData: { user, accounts }
        }))
      ];

      // Generate AI rationales (non-blocking, will fallback to null if fails)
      const recommendationsWithAI = await generateAIRationalesForRecommendations(
        allRecommendations,
        userId
      );

      // Split back into education and offers
      finalEducationRecommendations = recommendationsWithAI
        .filter(rec => rec.type === 'education')
        .map(rec => ({
          type: rec.type,
          item: rec.item,
          rationale: rec.rationale, // Keep template rationale
          ai_rationale: rec.ai_rationale // Add AI rationale if available
        }));

      finalOfferRecommendations = recommendationsWithAI
        .filter(rec => rec.type === 'offer')
        .map(rec => ({
          type: rec.type,
          item: rec.item,
          rationale: rec.rationale, // Keep template rationale
          eligibility_check: rec.eligibility_check,
          ai_rationale: rec.ai_rationale // Add AI rationale if available
        }));
    } catch (error) {
      // If AI rationale generation fails, continue with template rationales only
      // This is expected behavior - template rationales are always available
      if (process.env.NODE_ENV === 'development') {
        console.warn('AI rationale generation failed, using template rationales only:', error.message);
      }
      // finalEducationRecommendations and finalOfferRecommendations already have template rationales
    }
  }

  // Build comprehensive recommendations object
  const recommendations = {
    user_id: userId,
    user_name: user.name,
    assigned_persona: persona,
    persona_rationale: personaAssignment.rationale,
    decision_trace: personaAssignment.decision_trace,
    recommendations: {
      education: finalEducationRecommendations,
      partner_offers: finalOfferRecommendations
    },
    summary: {
      total_recommendations: finalEducationRecommendations.length + finalOfferRecommendations.length,
      education_count: finalEducationRecommendations.length,
      partner_offers_count: finalOfferRecommendations.length,
      ai_rationales_available: hasAIConsent(userId) && (finalEducationRecommendations.some(r => r.ai_rationale) || finalOfferRecommendations.some(r => r.ai_rationale))
    },
    behavioral_signals: behavioralSignals,
    timestamp: new Date().toISOString(),
    disclaimer: "This is educational content, not financial advice. Please consult with a qualified financial advisor for personalized advice."
  };

  // Cache the result (10 minutes TTL for recommendations)
  cache.set(cacheKey, recommendations, 600000);

  return recommendations;
}

/**
 * Extract credit score from credit analysis
 * @param {Object} creditAnalysis - Credit analysis results
 * @returns {number|null} Estimated credit score or null
 */
function extractCreditScore(creditAnalysis) {
  // In a real system, this would come from credit bureau data
  // For now, estimate based on utilization and payment behavior
  if (!creditAnalysis || !creditAnalysis.short_term) {
    return null;
  }

  const shortTerm = creditAnalysis.short_term;
  
  // Rough estimation based on utilization and behavior
  if (shortTerm.has_overdue) {
    return 600; // Low score for overdue
  }
  
  if (shortTerm.has_high_utilization) {
    return 650; // Medium-low for high utilization
  }
  
  if (shortTerm.has_medium_utilization) {
    return 680; // Medium for medium utilization
  }
  
  if (shortTerm.has_low_utilization) {
    return 720; // Good for low utilization
  }
  
  return null;
}

/**
 * Extract annual income from income analysis
 * @param {Object} incomeAnalysis - Income analysis results
 * @returns {number|null} Estimated annual income or null
 */
function extractAnnualIncome(incomeAnalysis) {
  if (!incomeAnalysis || !incomeAnalysis.short_term) {
    return null;
  }

  const shortTerm = incomeAnalysis.short_term;
  
  if (shortTerm.avg_monthly_income) {
    return shortTerm.avg_monthly_income * 12;
  }
  
  if (shortTerm.total_payroll_income) {
    // Estimate annual from recent payroll
    const days = 30; // 30-day window
    return (shortTerm.total_payroll_income / days) * 365;
  }
  
  return null;
}

/**
 * Extract monthly income from income analysis
 * @param {Object} incomeAnalysis - Income analysis results
 * @returns {number|null} Estimated monthly income or null
 */
function extractMonthlyIncome(incomeAnalysis) {
  if (!incomeAnalysis || !incomeAnalysis.short_term) {
    return null;
  }

  const shortTerm = incomeAnalysis.short_term;
  
  if (shortTerm.avg_monthly_income) {
    return shortTerm.avg_monthly_income;
  }
  
  return null;
}

/**
 * Extract maximum credit utilization from credit analysis
 * @param {Object} creditAnalysis - Credit analysis results
 * @returns {number} Maximum utilization (0-1)
 */
function extractMaxUtilization(creditAnalysis) {
  if (!creditAnalysis || !creditAnalysis.short_term || !creditAnalysis.short_term.cards) {
    return 0;
  }

  const cards = creditAnalysis.short_term.cards;
  if (cards.length === 0) {
    return 0;
  }

  return Math.max(...cards.map(card => card.utilization || 0));
}

/**
 * Clear cache for a user (called when user data changes)
 * @param {number} userId - User ID
 */
function clearUserCache(userId) {
  // Clear all cache entries for this user by prefix
  // This handles variations like recommendations:userId:3:5:1:3
  const prefixes = [
    `recommendations:${userId}`,
    `user:${userId}`,
    `accounts:${userId}`,
    `persona:${userId}`
  ];
  
  let totalCleared = 0;
  prefixes.forEach(prefix => {
    const cleared = cache.deleteByPrefix(prefix);
    totalCleared += cleared;
  });
  
  if (totalCleared > 0 && process.env.NODE_ENV !== 'test') {
    console.log(`[Cache] Cleared ${totalCleared} cache entries for user ${userId}`);
  }
}

module.exports = {
  generateRecommendations,
  extractCreditScore,
  extractAnnualIncome,
  extractMonthlyIncome,
  extractMaxUtilization,
  clearUserCache,
  measurePerformance
};

