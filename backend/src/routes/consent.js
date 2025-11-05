/**
 * Consent Routes
 * Handles consent-related API endpoints
 */

const express = require('express');
const router = express.Router();
const { validateUserId } = require('../middleware/validator');
const { validateRequiredFields } = require('../middleware/validator');
const {
  grantConsent,
  revokeConsent,
  getConsentStatus
} = require('../services/guardrails/consentChecker');
const { clearUserCache } = require('../services/recommend/recommendationEngine');
const User = require('../models/User');

/**
 * POST /consent
 * Record user opt-in (grant consent)
 * Body: { user_id: number }
 * Returns: Consent record with status
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
    
    // Grant consent
    const result = grantConsent(userId);
    
    // Clear cache when consent changes (old recommendations are invalid)
    clearUserCache(userId);
    
    res.status(201).json({
      success: true,
      message: 'Consent granted successfully',
      consent: {
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
 * GET /consent/:user_id
 * Get consent status for a user
 * Returns: Current consent status with timestamp
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
    
    // Get consent status
    const consentStatus = getConsentStatus(userId);
    
    res.json({
      success: true,
      consent: {
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
 * DELETE /consent/:user_id
 * Revoke consent (opt-out) for a user
 * Returns: Updated consent record with status
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
    
    // Revoke consent
    const result = revokeConsent(userId);
    
    // Clear cache when consent is revoked (recommendations should no longer be accessible)
    clearUserCache(userId);
    
    res.json({
      success: true,
      message: 'Consent revoked successfully',
      consent: {
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

