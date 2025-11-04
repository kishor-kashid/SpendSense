/**
 * Consent Checker Service
 * Ensures no data processing happens without user consent
 */

const Consent = require('../../models/Consent');

/**
 * Check if user has granted consent
 * @param {number} userId - User ID
 * @returns {boolean} True if user has consented
 */
function hasConsent(userId) {
  return Consent.hasConsent(userId);
}

/**
 * Require consent - throws error if user has not consented
 * Use this to block processing operations
 * @param {number} userId - User ID
 * @throws {Error} If user has not consented
 */
function requireConsent(userId) {
  if (!hasConsent(userId)) {
    throw new Error(`User ${userId} has not granted consent for data processing. Please opt-in before proceeding.`);
  }
}

/**
 * Get consent status for a user
 * @param {number} userId - User ID
 * @returns {Object} Consent status object
 */
function getConsentStatus(userId) {
  const consent = Consent.findByUserId(userId);
  
  if (!consent) {
    return {
      user_id: userId,
      has_consent: false,
      status: 'no_consent',
      message: 'No consent record found. User has not opted in.',
      timestamp: null
    };
  }

  return {
    user_id: userId,
    has_consent: consent.opted_in === 1,
    status: consent.opted_in === 1 ? 'granted' : 'revoked',
    message: consent.opted_in === 1 
      ? 'User has granted consent for data processing.'
      : 'User has revoked consent. Data processing is blocked.',
    timestamp: consent.timestamp,
    consent_id: consent.consent_id
  };
}

/**
 * Grant consent (opt-in) for a user
 * @param {number} userId - User ID
 * @returns {Object} Consent record with status
 */
function grantConsent(userId) {
  const consent = Consent.grant(userId);
  
  if (!consent) {
    throw new Error(`Failed to grant consent for user ${userId}`);
  }

  return {
    user_id: userId,
    has_consent: true,
    status: 'granted',
    message: 'Consent granted successfully.',
    timestamp: consent.timestamp,
    consent_id: consent.consent_id
  };
}

/**
 * Revoke consent (opt-out) for a user
 * @param {number} userId - User ID
 * @returns {Object} Consent record with status
 */
function revokeConsent(userId) {
  const consent = Consent.revoke(userId);
  
  if (!consent) {
    throw new Error(`Failed to revoke consent for user ${userId}`);
  }

  return {
    user_id: userId,
    has_consent: false,
    status: 'revoked',
    message: 'Consent revoked successfully. Data processing is now blocked.',
    timestamp: consent.timestamp,
    consent_id: consent.consent_id
  };
}

/**
 * Check consent and return result object instead of throwing
 * Useful for conditional logic
 * @param {number} userId - User ID
 * @returns {Object} { allowed: boolean, error: string|null }
 */
function checkConsent(userId) {
  const hasConsented = hasConsent(userId);
  
  return {
    allowed: hasConsented,
    error: hasConsented ? null : `User ${userId} has not granted consent for data processing.`
  };
}

/**
 * Get consent history for a user
 * @param {number} userId - User ID
 * @returns {Object|null} Latest consent record
 */
function getConsentHistory(userId) {
  return Consent.getHistory(userId);
}

module.exports = {
  hasConsent,
  requireConsent,
  getConsentStatus,
  grantConsent,
  revokeConsent,
  checkConsent,
  getConsentHistory
};

