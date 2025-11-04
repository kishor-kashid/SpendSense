/**
 * Recommendations Routes
 * Handles recommendation generation endpoints
 */

const express = require('express');
const router = express.Router();
const { generateRecommendations } = require('../services/recommend/recommendationEngine');
const { validateContent, requireValidTone } = require('../services/guardrails/toneValidator');
const RecommendationReview = require('../models/RecommendationReview');
const User = require('../models/User');

/**
 * GET /recommendations/:user_id
 * Get recommendations for a user
 * Returns: 3-5 education items + 1-3 partner offers with rationales
 * All guardrails applied: consent, eligibility, tone
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
    
    // Generate recommendations (this already checks consent and applies eligibility filter)
    const recommendations = generateRecommendations(userId);
    
    // Apply tone validation to all recommendation content
    const validatedRecommendations = {
      ...recommendations,
      recommendations: {
        education: recommendations.recommendations.education.map(rec => {
          // Validate tone for education item
          const content = {
            title: rec.item.title,
            description: rec.item.description,
            rationale: rec.rationale
          };
          
          const toneValidation = validateContent(content);
          if (!toneValidation.isValid) {
            // Filter out items with tone violations
            return null;
          }
          
          return rec;
        }).filter(rec => rec !== null), // Remove null items (tone violations)
        
        partner_offers: recommendations.recommendations.partner_offers.map(rec => {
          // Validate tone for partner offer
          const content = {
            title: rec.item.title,
            description: rec.item.description,
            rationale: rec.rationale
          };
          
          const toneValidation = validateContent(content);
          if (!toneValidation.isValid) {
            // Filter out offers with tone violations
            return null;
          }
          
          return rec;
        }).filter(rec => rec !== null) // Remove null items (tone violations)
      }
    };
    
    // Update summary with filtered counts
    validatedRecommendations.summary = {
      total_recommendations: validatedRecommendations.recommendations.education.length + 
                             validatedRecommendations.recommendations.partner_offers.length,
      education_count: validatedRecommendations.recommendations.education.length,
      partner_offers_count: validatedRecommendations.recommendations.partner_offers.length
    };
    
    // Store recommendation in review queue as pending (for operator oversight)
    try {
      RecommendationReview.create({
        user_id: userId,
        recommendation_data: validatedRecommendations,
        decision_trace: recommendations.decision_trace,
        status: 'pending'
      });
    } catch (error) {
      // Log but don't fail the request if review storage fails
      console.error('Failed to store recommendation for review:', error);
    }
    
    res.json({
      success: true,
      recommendations: validatedRecommendations
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

