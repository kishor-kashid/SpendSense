/**
 * AI Consent Checker Service
 * Ensures no AI features are used without explicit user consent
 * Separate from data processing consent - AI features require both consents
 */

const AIConsent = require('../../models/AIConsent');
const User = require('../../models/User');

/**
 * Check if user has granted AI consent
 * @param {number} userId - User ID
 * @returns {boolean} True if user has consented to AI features
 */
function hasAIConsent(userId) {
  // Check AI consent table (authoritative source)
  if (AIConsent.hasConsent(userId)) {
    return true;
  }
  
  // No AI consent found
  return false;
}

/**
 * Require AI consent - throws error if user has not consented
 * Use this to block AI feature operations
 * @param {number} userId - User ID
 * @throws {Error} If user has not consented to AI features
 */
function requireAIConsent(userId) {
  if (!hasAIConsent(userId)) {
    throw new Error(`User ${userId} has not granted consent for AI-powered features. Please opt-in to AI features before proceeding.`);
  }
}

/**
 * Get AI consent status for a user
 * @param {number} userId - User ID
 * @returns {Object} AI consent status object
 */
function getAIConsentStatus(userId) {
  const consent = AIConsent.findByUserId(userId);
  
  // If AI consent record exists, use it
  if (consent) {
    return {
      user_id: userId,
      has_consent: consent.opted_in === 1,
      status: consent.opted_in === 1 ? 'granted' : 'revoked',
      message: consent.opted_in === 1 
        ? 'User has granted consent for AI-powered features.'
        : 'User has revoked AI consent. AI features are disabled.',
      timestamp: consent.timestamp,
      ai_consent_id: consent.ai_consent_id
    };
  }

  // No AI consent found
  return {
    user_id: userId,
    has_consent: false,
    status: 'no_consent',
    message: 'No AI consent record found. User has not opted in to AI features.',
    timestamp: null,
    ai_consent_id: null
  };
}

/**
 * Grant AI consent (opt-in) for a user
 * @param {number} userId - User ID
 * @returns {Object} AI consent record with status
 */
function grantAIConsent(userId) {
  // Check if user exists
  const user = User.findById(userId);
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  const consent = AIConsent.grant(userId);
  const status = getAIConsentStatus(userId);
  
  return {
    user_id: userId,
    has_consent: status.has_consent,
    status: status.status,
    message: status.message,
    timestamp: status.timestamp,
    ai_consent_id: status.ai_consent_id
  };
}

/**
 * Revoke AI consent (opt-out) for a user
 * @param {number} userId - User ID
 * @returns {Object} AI consent record with status
 */
function revokeAIConsent(userId) {
  // Check if user exists
  const user = User.findById(userId);
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  const consent = AIConsent.revoke(userId);
  const status = getAIConsentStatus(userId);
  
  return {
    user_id: userId,
    has_consent: status.has_consent,
    status: status.status,
    message: status.message,
    timestamp: status.timestamp,
    ai_consent_id: status.ai_consent_id
  };
}

/**
 * Check AI consent conditionally (returns object instead of throwing)
 * @param {number} userId - User ID
 * @returns {Object} Check result with hasConsent and message
 */
function checkAIConsent(userId) {
  const hasConsent = hasAIConsent(userId);
  return {
    hasConsent,
    message: hasConsent 
      ? 'User has granted AI consent.'
      : 'User has not granted AI consent.'
  };
}

module.exports = {
  hasAIConsent,
  requireAIConsent,
  getAIConsentStatus,
  grantAIConsent,
  revokeAIConsent,
  checkAIConsent
};

