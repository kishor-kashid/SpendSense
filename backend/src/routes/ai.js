/**
 * AI Features Routes
 * Handles all AI-powered feature endpoints
 * Requires AI consent only (independent of data processing consent)
 */

const express = require('express');
const router = express.Router();
const { hasAIConsent } = require('../services/guardrails/aiConsentChecker');
const { generatePredictiveInsights, generateMultiHorizonPredictions } = require('../services/ai/predictiveInsights');
const { generateBudget, generateGoals } = require('../services/ai/budgetGenerator');
const { analyzeSubscriptions, generateCancellationSuggestions } = require('../services/ai/subscriptionAnalyzer');
const User = require('../models/User');

/**
 * Middleware to check AI consent only (AI features are independent of data processing consent)
 */
const checkAIFeatureConsent = (req, res, next) => {
  const userId = parseInt(req.params.user_id, 10);
  
  if (!hasAIConsent(userId)) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'AI consent is required for AI-powered features',
        code: 'AI_CONSENT_REQUIRED'
      }
    });
  }
  
  next();
};

/**
 * GET /ai/predictions/:user_id
 * Get predictive financial insights for a user
 * Query params: horizon (optional, default: 30, options: 7, 30, 90)
 * Returns: Predictive insights for specified horizon
 */
router.get('/predictions/:user_id', async (req, res, next) => {
  try {
    // Validate user_id FIRST (before checking consent)
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
    
    // Check AI consent AFTER validation
    if (!hasAIConsent(userId)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'AI consent is required for AI-powered features',
          code: 'AI_CONSENT_REQUIRED'
        }
      });
    }
    
    // Get horizon from query params (default: 30 days)
    const horizon = req.query.horizon ? parseInt(req.query.horizon, 10) : 30;
    const validHorizons = [7, 30, 90];
    
    if (!validHorizons.includes(horizon)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid horizon: ${horizon}. Must be one of: ${validHorizons.join(', ')}`,
          code: 'INVALID_HORIZON'
        }
      });
    }
    
    // Generate predictions
    const predictions = await generatePredictiveInsights(userId, horizon);
    
    res.json({
      success: true,
      predictions
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /ai/predictions/:user_id/all
 * Get predictive insights for all horizons (7, 30, 90 days)
 * Returns: Predictions for all time horizons
 */
router.get('/predictions/:user_id/all', async (req, res, next) => {
  try {
    // Validate user_id FIRST (before checking consent)
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
    
    // Check AI consent AFTER validation
    if (!hasAIConsent(userId)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'AI consent is required for AI-powered features',
          code: 'AI_CONSENT_REQUIRED'
        }
      });
    }
    
    // Generate predictions for all horizons
    const predictions = await generateMultiHorizonPredictions(userId, [7, 30, 90]);
    
    res.json({
      success: true,
      predictions
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /ai/budgets/:user_id/generate
 * Generate AI-powered budget recommendations
 * Returns: Budget with category limits and rationale
 */
router.get('/budgets/:user_id/generate', async (req, res, next) => {
  try {
    // Validate user_id FIRST (before checking consent)
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
    
    // Check AI consent AFTER validation
    if (!hasAIConsent(userId)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'AI consent is required for AI-powered features',
          code: 'AI_CONSENT_REQUIRED'
        }
      });
    }
    
    // Generate budget
    const budget = await generateBudget(userId);
    
    // Check if budget generation failed
    if (!budget.success && budget.error === 'insufficient_data') {
      return res.status(200).json({
        success: false,
        error: {
          message: budget.message,
          code: 'INSUFFICIENT_DATA',
          recommendations: budget.recommendations
        }
      });
    }
    
    res.json({
      success: true,
      budget
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /ai/goals/:user_id/generate
 * Generate AI-powered savings goals
 * Returns: Personalized savings goals with rationale
 */
router.get('/goals/:user_id/generate', async (req, res, next) => {
  try {
    // Validate user_id FIRST (before checking consent)
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
    
    // Check AI consent AFTER validation
    if (!hasAIConsent(userId)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'AI consent is required for AI-powered features',
          code: 'AI_CONSENT_REQUIRED'
        }
      });
    }
    
    // Generate goals
    const goals = await generateGoals(userId);
    
    // Check if goal generation failed
    if (!goals.success && goals.error === 'insufficient_data') {
      return res.status(200).json({
        success: false,
        error: {
          message: goals.message,
          code: 'INSUFFICIENT_DATA',
          recommendations: goals.recommendations
        }
      });
    }
    
    res.json({
      success: true,
      goals
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /ai/subscriptions/:user_id/analyze
 * Analyze user subscriptions with value metrics
 * Returns: Subscription analysis with usage patterns and value scores
 */
router.get('/subscriptions/:user_id/analyze', async (req, res, next) => {
  try {
    // Validate user_id FIRST (before checking consent)
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
    
    // Check AI consent AFTER validation
    if (!hasAIConsent(userId)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'AI consent is required for AI-powered features',
          code: 'AI_CONSENT_REQUIRED'
        }
      });
    }
    
    // Analyze subscriptions
    const analysis = analyzeSubscriptions(userId);
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /ai/subscriptions/:user_id/suggestions
 * Generate AI-powered subscription cancellation suggestions
 * Returns: Cancellation suggestions with rationale and potential savings
 */
router.get('/subscriptions/:user_id/suggestions', async (req, res, next) => {
  try {
    // Validate user_id FIRST (before checking consent)
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
    
    // Check AI consent AFTER validation
    if (!hasAIConsent(userId)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'AI consent is required for AI-powered features',
          code: 'AI_CONSENT_REQUIRED'
        }
      });
    }
    
    // Generate cancellation suggestions
    const suggestions = await generateCancellationSuggestions(userId);
    
    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

