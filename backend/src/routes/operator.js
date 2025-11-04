/**
 * Operator Routes
 * Handles operator oversight and review endpoints
 */

const express = require('express');
const router = express.Router();
const { validateRequiredFields } = require('../middleware/validator');
const RecommendationReview = require('../models/RecommendationReview');
const { generateRecommendations } = require('../services/recommend/recommendationEngine');
const { assignPersonaToUser } = require('../services/personas/personaAssigner');
const User = require('../models/User');

/**
 * GET /operator/review
 * Get approval queue (pending recommendations)
 * Returns: Array of pending recommendation reviews
 */
router.get('/review', (req, res, next) => {
  try {
    const pendingReviews = RecommendationReview.findPending();
    
    res.json({
      success: true,
      count: pendingReviews.length,
      reviews: pendingReviews.map(review => ({
        review_id: review.review_id,
        user_id: review.user_id,
        recommendation_data: review.recommendation_data,
        decision_trace: review.decision_trace,
        status: review.status,
        created_at: review.created_at
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /operator/approve
 * Approve a recommendation
 * Body: { review_id: number, operator_notes?: string, reviewed_by?: string }
 * Returns: Updated review record
 */
router.post('/approve', validateRequiredFields(['review_id']), (req, res, next) => {
  try {
    const reviewId = parseInt(req.body.review_id, 10);
    
    if (isNaN(reviewId) || reviewId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid review_id: ${req.body.review_id}. Must be a positive integer.`,
          code: 'INVALID_REVIEW_ID'
        }
      });
    }
    
    // Check if review exists
    const existingReview = RecommendationReview.findById(reviewId);
    if (!existingReview) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Review with ID ${reviewId} not found`,
          code: 'REVIEW_NOT_FOUND'
        }
      });
    }
    
    // Update review status to approved
    const updatedReview = RecommendationReview.updateStatus(
      reviewId,
      'approved',
      req.body.operator_notes || null,
      req.body.reviewed_by || 'operator'
    );
    
    res.json({
      success: true,
      message: 'Recommendation approved successfully',
      review: {
        review_id: updatedReview.review_id,
        user_id: updatedReview.user_id,
        status: updatedReview.status,
        operator_notes: updatedReview.operator_notes,
        reviewed_at: updatedReview.reviewed_at,
        reviewed_by: updatedReview.reviewed_by
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /operator/override
 * Override a recommendation (reject or modify)
 * Body: { review_id: number, operator_notes?: string, reviewed_by?: string }
 * Returns: Updated review record
 */
router.post('/override', validateRequiredFields(['review_id']), (req, res, next) => {
  try {
    const reviewId = parseInt(req.body.review_id, 10);
    
    if (isNaN(reviewId) || reviewId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid review_id: ${req.body.review_id}. Must be a positive integer.`,
          code: 'INVALID_REVIEW_ID'
        }
      });
    }
    
    // Check if review exists
    const existingReview = RecommendationReview.findById(reviewId);
    if (!existingReview) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Review with ID ${reviewId} not found`,
          code: 'REVIEW_NOT_FOUND'
        }
      });
    }
    
    // Update review status to overridden
    const updatedReview = RecommendationReview.updateStatus(
      reviewId,
      'overridden',
      req.body.operator_notes || null,
      req.body.reviewed_by || 'operator'
    );
    
    res.json({
      success: true,
      message: 'Recommendation overridden successfully',
      review: {
        review_id: updatedReview.review_id,
        user_id: updatedReview.user_id,
        status: updatedReview.status,
        operator_notes: updatedReview.operator_notes,
        reviewed_at: updatedReview.reviewed_at,
        reviewed_by: updatedReview.reviewed_by
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /operator/users
 * Get all users with persona info and signals
 * Returns: Array of users with their behavioral profiles
 */
router.get('/users', (req, res, next) => {
  try {
    const allUsers = User.findAll();
    
    // Get profile for each user (only if they have consent)
    const usersWithProfiles = allUsers.map(user => {
      try {
        // Try to get profile (will fail if no consent)
        const profile = assignPersonaToUser(user.user_id);
        
        return {
          user_id: user.user_id,
          name: user.name,
          consent_status: user.consent_status,
          assigned_persona: profile.assigned_persona,
          behavioral_signals: {
            credit: profile.behavioral_signals.credit,
            income: profile.behavioral_signals.income,
            subscriptions: profile.behavioral_signals.subscriptions,
            savings: profile.behavioral_signals.savings
          },
          has_profile: true
        };
      } catch (error) {
        // User doesn't have consent or profile can't be generated
        return {
          user_id: user.user_id,
          name: user.name,
          consent_status: user.consent_status,
          assigned_persona: null,
          behavioral_signals: null,
          has_profile: false,
          error: error.message
        };
      }
    });
    
    res.json({
      success: true,
      count: usersWithProfiles.length,
      users: usersWithProfiles
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

