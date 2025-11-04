/**
 * Feedback Routes
 * Handles user feedback on recommendations
 */

const express = require('express');
const router = express.Router();
const { validateRequiredFields } = require('../middleware/validator');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

/**
 * POST /feedback
 * Record user feedback on a recommendation
 * Body: { user_id: number, recommendation_id?: string, recommendation_type?: string, rating?: number, comment?: string, helpful?: boolean }
 * Returns: Created feedback record
 */
router.post('/', validateRequiredFields(['user_id']), (req, res, next) => {
  try {
    const userId = parseInt(req.body.user_id, 10);
    
    // Validate user_id
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
    
    // Validate optional fields
    if (req.body.rating !== undefined && (req.body.rating < 1 || req.body.rating > 5)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Rating must be between 1 and 5',
          code: 'INVALID_RATING'
        }
      });
    }
    
    if (req.body.recommendation_type !== undefined && 
        !['education', 'offer'].includes(req.body.recommendation_type)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'recommendation_type must be "education" or "offer"',
          code: 'INVALID_RECOMMENDATION_TYPE'
        }
      });
    }
    
    // Create feedback record
    const feedback = Feedback.create({
      user_id: userId,
      recommendation_id: req.body.recommendation_id || null,
      recommendation_type: req.body.recommendation_type || null,
      rating: req.body.rating || null,
      comment: req.body.comment || null,
      helpful: req.body.helpful || null
    });
    
    res.status(201).json({
      success: true,
      message: 'Feedback recorded successfully',
      feedback: {
        feedback_id: feedback.feedback_id,
        user_id: feedback.user_id,
        recommendation_id: feedback.recommendation_id,
        recommendation_type: feedback.recommendation_type,
        rating: feedback.rating,
        comment: feedback.comment,
        helpful: feedback.helpful,
        created_at: feedback.created_at
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

