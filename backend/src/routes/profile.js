/**
 * Profile Routes
 * Handles behavioral profile and persona assignment endpoints
 */

const express = require('express');
const router = express.Router();
const { assignPersonaToUser } = require('../services/personas/personaAssigner');
const { hasConsent } = require('../services/guardrails/consentChecker');
const User = require('../models/User');

/**
 * GET /profile/:user_id
 * Get behavioral profile for a user
 * Returns: Detected signals, persona assignment, and decision trace
 */
router.get('/:user_id', (req, res, next) => {
  try {
    // Validate user_id parameter
    const userIdParam = req.params.user_id;
    if (!userIdParam || isNaN(parseInt(userIdParam, 10)) || parseInt(userIdParam, 10) <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid user_id: ${userIdParam}. Must be a positive integer.`,
          code: 'INVALID_USER_ID'
        }
      });
    }
    
    const userId = parseInt(userIdParam, 10);
    
    // Check if user exists
    const user = User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: `User with ID ${userId} not found`,
          code: 'USER_NOT_FOUND'
        }
      });
    }
    
    // IMPORTANT: Check consent FIRST before attempting to generate profile
    // This ensures we return 403 immediately if consent is not granted
    // Use hasConsent() which checks the consent table (authoritative source)
    if (!hasConsent(userId)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'User consent is required to access behavioral profile',
          code: 'CONSENT_REQUIRED'
        }
      });
    }
    
    // Get behavioral profile (this includes persona assignment and all feature analyses)
    const profile = assignPersonaToUser(userId);
    
    res.json({
      success: true,
      profile: {
        user_id: profile.user_id,
        user_name: profile.user_name,
        assigned_persona: profile.assigned_persona,
        persona_rationale: profile.rationale,
        decision_trace: profile.decision_trace,
        behavioral_signals: profile.behavioral_signals,
        all_matching_personas: profile.all_matching_personas,
        timestamp: profile.timestamp
      }
    });
  } catch (error) {
    // Handle consent errors specifically
    if (error.message && error.message.includes('consent')) {
      return res.status(403).json({
        success: false,
        error: {
          message: error.message,
          code: 'CONSENT_REQUIRED'
        }
      });
    }
    
    next(error);
  }
});

module.exports = router;

