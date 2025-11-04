/**
 * Consent Checker Service
 * Ensures no data processing happens without user consent
 */

const Consent = require('../../models/Consent');
const User = require('../../models/User');

/**
 * Check if user has granted consent
 * Checks consent table first, then falls back to users.consent_status
 * @param {number} userId - User ID
 * @returns {boolean} True if user has consented
 */
function hasConsent(userId) {
  // Check consent table first (authoritative source)
  if (Consent.hasConsent(userId)) {
    return true;
  }
  
  // Fallback: Check users table consent_status field
  // This handles cases where users were loaded with consent_status but no consent record was created
  const user = User.findById(userId);
  return user && user.consent_status === 'granted';
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
 * Checks consent table first, then falls back to users.consent_status
 * @param {number} userId - User ID
 * @returns {Object} Consent status object
 */
function getConsentStatus(userId) {
  const consent = Consent.findByUserId(userId);
  
  // If consent record exists in consent table, use it (this is the authoritative source)
  if (consent) {
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

  // Fallback: Check users table consent_status field
  // This handles cases where users were loaded with consent_status but no consent record was created
  const user = User.findById(userId);
  if (user) {
    if (user.consent_status === 'granted') {
      return {
        user_id: userId,
        has_consent: true,
        status: 'granted',
        message: 'User has granted consent for data processing.',
        timestamp: null, // No explicit consent record timestamp
        consent_id: null
      };
    } else if (user.consent_status === 'revoked') {
      return {
        user_id: userId,
        has_consent: false,
        status: 'revoked',
        message: 'User has revoked consent. Data processing is blocked.',
        timestamp: null,
        consent_id: null
      };
    }
    // If consent_status is null or any other value, treat as no_consent
  }

  // No consent found and user doesn't exist or has no consent_status
  return {
    user_id: userId,
    has_consent: false,
    status: 'no_consent',
    message: 'No consent record found. User has not opted in.',
    timestamp: null
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

