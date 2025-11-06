/**
 * Recommendations Routes
 * Handles recommendation generation endpoints
 */

const express = require('express');
const router = express.Router();
const { generateRecommendations } = require('../services/recommend/recommendationEngine');
const { validateContent, requireValidTone } = require('../services/guardrails/toneValidator');
const { hasConsent } = require('../services/guardrails/consentChecker');
const RecommendationReview = require('../models/RecommendationReview');
const User = require('../models/User');

/**
 * GET /recommendations/:user_id
 * Get recommendations for a user
 * Returns: 3-5 education items + 1-3 partner offers with rationales
 * All guardrails applied: consent, eligibility, tone
 */
router.get('/:user_id', async (req, res, next) => {
  const startTime = Date.now();
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
    
    // IMPORTANT: Check consent FIRST before checking reviews
    // Consent check is done inside generateRecommendations, but we need to check it early
    // to avoid returning pending reviews when consent is revoked
    // Use hasConsent() which checks the consent table (authoritative source)
    if (!hasConsent(userId)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'User consent is required to generate recommendations',
          code: 'CONSENT_REQUIRED'
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
    // Performance is logged by recommendationEngine's measurePerformance function
    const recommendations = await generateRecommendations(userId);
    
    // Helper function to validate tone for a recommendation
    const validateRecommendationTone = (rec) => {
      // Validate template rationale (always present)
      const content = {
        title: rec.item.title,
        description: rec.item.description,
        rationale: rec.rationale
      };
      const toneValidation = validateContent(content);
      if (!toneValidation.isValid) {
        return null;
      }
      
      // If AI rationale exists, validate it too
      if (rec.ai_rationale) {
        const aiContent = {
          title: rec.item.title,
          description: rec.item.description,
          rationale: rec.ai_rationale
        };
        const aiToneValidation = validateContent(aiContent);
        if (!aiToneValidation.isValid) {
          // Remove AI rationale if it fails tone validation, but keep recommendation
          return {
            ...rec,
            ai_rationale: null
          };
        }
      }
      
      return rec;
    };

    // Apply tone validation to all recommendation content
    const validatedRecommendations = {
      ...recommendations,
      recommendations: {
        education: recommendations.recommendations.education
          .map(validateRecommendationTone)
          .filter(rec => rec !== null),
        partner_offers: recommendations.recommendations.partner_offers
          .map(validateRecommendationTone)
          .filter(rec => rec !== null)
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
      RecommendationReview.createOrUpdatePending({
        user_id: userId,
        recommendation_data: validatedRecommendations,
        decision_trace: recommendations.decision_trace,
        status: 'pending'
      });
      
      // After storing as pending, return empty recommendations to the user
      // Users should NOT see pending recommendations until approved
      return res.json({
        success: true,
        recommendations: {
          education_items: [],
          partner_offers: [],
          status: 'pending',
          pending_message: 'Your recommendations are pending operator approval. Please check back later.'
        }
      });
    } catch (error) {
      // Don't fail the request if review storage fails
      // In this case, we'll still return the recommendations (edge case)
      // Error is already logged by error handler middleware
    }
    
    // Transform recommendations structure for frontend compatibility
    // Frontend expects education_items and partner_offers at top level
    // IMPORTANT: Only include eligible partner offers (filter out ineligible ones)
    // NOTE: This code path is only reached if review storage failed
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
        })),
      // New recommendations are pending approval
      status: 'pending',
      pending_message: 'Your recommendations are pending operator approval. Please check back later.'
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

