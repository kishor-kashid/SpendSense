/**
 * AI Consent Routes
 * Handles AI consent-related API endpoints
 * Separate from data processing consent
 */

const express = require('express');
const router = express.Router();
const { validateRequiredFields } = require('../middleware/validator');
const {
  grantAIConsent,
  revokeAIConsent,
  getAIConsentStatus
} = require('../services/guardrails/aiConsentChecker');
const User = require('../models/User');

/**
 * POST /ai-consent
 * Record user opt-in for AI features (grant AI consent)
 * Body: { user_id: number }
 * Returns: AI consent record with status
 */
router.post('/', validateRequiredFields(['user_id']), (req, res, next) => {
  try {
    const userId = parseInt(req.body.user_id, 10);
    
    // Validate user_id is a positive integer
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid user_id: ${req.body.user_id}. Must be a positive integer.`,
          code: 'INVALID_USER_ID'
        }
      });
    }
    
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
    
    // Grant AI consent
    const result = grantAIConsent(userId);
    
    res.status(201).json({
      success: true,
      message: 'AI consent granted successfully',
      ai_consent: {
        user_id: result.user_id,
        has_consent: result.has_consent,
        status: result.status,
        timestamp: result.timestamp
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /ai-consent/:user_id
 * Get AI consent status for a user
 * Returns: Current AI consent status with timestamp
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
    
    // Get AI consent status
    const consentStatus = getAIConsentStatus(userId);
    
    res.json({
      success: true,
      ai_consent: {
        user_id: consentStatus.user_id,
        has_consent: consentStatus.has_consent,
        status: consentStatus.status,
        message: consentStatus.message,
        timestamp: consentStatus.timestamp
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /ai-consent/:user_id
 * Revoke AI consent (opt-out) for a user
 * Returns: Updated AI consent record with status
 */
router.delete('/:user_id', (req, res, next) => {
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
    
    // Revoke AI consent
    const result = revokeAIConsent(userId);
    
    res.json({
      success: true,
      message: 'AI consent revoked successfully',
      ai_consent: {
        user_id: result.user_id,
        has_consent: result.has_consent,
        status: result.status,
        timestamp: result.timestamp
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

