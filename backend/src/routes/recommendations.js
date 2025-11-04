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
    
    // First check if there's an approved review for this user
    // Users can ONLY see approved recommendations - pending ones are not visible
    const approvedReview = RecommendationReview.findApprovedByUserId(userId);
    if (approvedReview && approvedReview.recommendation_data) {
      const recData = approvedReview.recommendation_data;
      
      // Transform approved recommendations for frontend
      // IMPORTANT: Only include eligible partner offers (filter out ineligible ones)
      const allPartnerOffers = recData.recommendations?.partner_offers || recData.partner_offers || [];
      const eligiblePartnerOffers = allPartnerOffers
        .filter(rec => {
          // Check eligibility from either eligibility_check or eligibility field
          const eligibility = rec.eligibility_check || rec.eligibility;
          return eligibility && (eligibility.isEligible === true || eligibility.eligible === true);
        })
        .map(rec => ({
          ...rec.item,
          rationale: rec.rationale,
          eligibility: {
            eligible: true,
            reasons: (rec.eligibility_check || rec.eligibility)?.reasons || [],
            disqualifiers: []
          }
        }));
      
      const transformedRecommendations = {
        ...recData,
        education_items: recData.recommendations?.education?.map(rec => ({
          ...rec.item,
          rationale: rec.rationale
        })) || recData.education_items || [],
        partner_offers: eligiblePartnerOffers,
        status: 'approved',
        approved_at: approvedReview.reviewed_at
      };
      
      return res.json({
        success: true,
        recommendations: transformedRecommendations
      });
    }
    
    // Check if there's a pending review - if so, return empty recommendations
    // Users should NOT see pending recommendations until approved
    const pendingReview = RecommendationReview.findPendingByUserId(userId);
    if (pendingReview) {
      // Return empty recommendations with pending status (but don't show the actual recommendations)
      return res.json({
        success: true,
        recommendations: {
          education_items: [],
          partner_offers: [],
          status: 'pending',
          pending_message: 'Your recommendations are pending operator approval. Please check back later.'
        }
      });
    }
    
    // No approved or pending review - generate new recommendations
    // This already checks consent and applies eligibility filter
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
    
    // Store or update recommendation in review queue as pending (for operator oversight)
    // If a pending review already exists for this user, update it instead of creating a duplicate
    try {
      const review = RecommendationReview.createOrUpdatePending({
        user_id: userId,
        recommendation_data: validatedRecommendations,
        decision_trace: recommendations.decision_trace,
        status: 'pending'
      });
      console.log(`✓ Created/updated pending review (ID: ${review.review_id}) for user ${userId}`);
    } catch (error) {
      // Log but don't fail the request if review storage fails
      console.error(`✗ Failed to store recommendation for review (user ${userId}):`, error);
      console.error('Error details:', error.message, error.stack);
    }
    
    // Transform recommendations structure for frontend compatibility
    // Frontend expects education_items and partner_offers at top level
    // IMPORTANT: Only include eligible partner offers (filter out ineligible ones)
    const transformedRecommendations = {
      ...validatedRecommendations,
      education_items: validatedRecommendations.recommendations.education.map(rec => ({
        ...rec.item,
        rationale: rec.rationale
      })),
      partner_offers: validatedRecommendations.recommendations.partner_offers
        .filter(rec => {
          // Only include offers that are eligible
          // Double-check eligibility even though filterEligibleOffers should have filtered them
          const eligibility = rec.eligibility_check;
          return eligibility && eligibility.isEligible === true;
        })
        .map(rec => ({
          ...rec.item,
          rationale: rec.rationale,
          eligibility: {
            eligible: true,
            reasons: rec.eligibility_check?.reasons || [],
            disqualifiers: []
          }
        }))
    };
    
    res.json({
      success: true,
      recommendations: transformedRecommendations
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

