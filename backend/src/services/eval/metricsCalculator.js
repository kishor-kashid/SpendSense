/**
 * Metrics Calculator Service
 * Calculates evaluation metrics for the SpendSense system
 */

const { assignPersonaToUser } = require('../personas/personaAssigner');
const { generateRecommendations } = require('../recommend/recommendationEngine');
const User = require('../../models/User');
const RecommendationReview = require('../../models/RecommendationReview');

/**
 * Count the number of behavioral signals detected for a user
 * @param {Object} behavioralSignals - Behavioral signals object
 * @returns {number} Number of detected behaviors
 */
function countDetectedBehaviors(behavioralSignals) {
  if (!behavioralSignals) return 0;
  
  let count = 0;
  
  // Helper to get data from either short_term or analysis_30d (for backward compatibility)
  const getObject = (signal) => {
    return signal?.short_term || signal?.analysis_30d || null;
  };
  
  // Check subscriptions: recurring merchants detected
  const subscriptionData = getObject(behavioralSignals.subscriptions);
  if (subscriptionData && 
      subscriptionData.recurring_merchants &&
      subscriptionData.recurring_merchants.length > 0) {
    count++;
  }
  
  // Check savings: meets threshold
  const savingsData = getObject(behavioralSignals.savings);
  if (savingsData && savingsData.meets_threshold) {
    count++;
  }
  
  // Check credit: high utilization, interest charges, or overdue
  const creditData = getObject(behavioralSignals.credit);
  if (creditData) {
    if (creditData.utilization_level === 'high' || 
        creditData.has_interest_charges || 
        creditData.has_overdue) {
      count++;
    }
  }
  
  // Check income: variable income pattern
  const incomeData = getObject(behavioralSignals.income);
  if (incomeData && incomeData.has_variable_income) {
    count++;
  }
  
  return count;
}

/**
 * Calculate coverage metric: % of users with assigned persona and ≥3 behaviors
 * @param {Array<number>} userIds - Array of user IDs to evaluate (optional, defaults to all users)
 * @returns {Object} Coverage metric results
 */
function calculateCoverage(userIds = null) {
  const allUsers = User.findAll();
  const usersToEvaluate = userIds 
    ? allUsers.filter(u => userIds.includes(u.user_id))
    : allUsers;
  
  let totalUsers = 0;
  let usersWithPersona = 0;
  let usersWithPersonaAndBehaviors = 0;
  const userDetails = [];
  
  for (const user of usersToEvaluate) {
    // Only count users with consent (they can have profiles)
    if (user.consent_status !== 'granted') {
      continue;
    }
    
    totalUsers++;
    
    try {
      const profile = assignPersonaToUser(user.user_id);
      
      if (profile && profile.assigned_persona) {
        usersWithPersona++;
        
        const behaviorCount = countDetectedBehaviors(profile.behavioral_signals);
        
        if (behaviorCount >= 3) {
          usersWithPersonaAndBehaviors++;
        }
        
        userDetails.push({
          user_id: user.user_id,
          user_name: user.name,
          has_persona: true,
          persona_id: profile.assigned_persona.id,
          behavior_count: behaviorCount,
          meets_threshold: behaviorCount >= 3
        });
      } else {
        userDetails.push({
          user_id: user.user_id,
          user_name: user.name,
          has_persona: false,
          persona_id: null,
          behavior_count: 0,
          meets_threshold: false
        });
      }
    } catch (error) {
      // User doesn't have consent or profile can't be generated
      userDetails.push({
        user_id: user.user_id,
        user_name: user.name,
        has_persona: false,
        persona_id: null,
        behavior_count: 0,
        meets_threshold: false,
        error: error.message
      });
    }
  }
  
  const coveragePercentage = totalUsers > 0 
    ? (usersWithPersonaAndBehaviors / totalUsers) * 100 
    : 0;
  
  return {
    metric: 'coverage',
    description: 'Percentage of users with assigned persona and ≥3 detected behaviors',
    total_users: totalUsers,
    users_with_persona: usersWithPersona,
    users_with_persona_and_behaviors: usersWithPersonaAndBehaviors,
    coverage_percentage: parseFloat(coveragePercentage.toFixed(2)),
    target: 100,
    meets_target: coveragePercentage >= 100,
    user_details: userDetails
  };
}

/**
 * Calculate explainability metric: % of recommendations with rationales
 * @param {Array<number>} userIds - Array of user IDs to evaluate (optional, defaults to all users)
 * @returns {Object} Explainability metric results
 */
async function calculateExplainability(userIds = null) {
  const allUsers = User.findAll();
  const usersToEvaluate = userIds 
    ? allUsers.filter(u => userIds.includes(u.user_id))
    : allUsers.filter(u => u.consent_status === 'granted');
  
  let totalRecommendations = 0;
  let recommendationsWithRationales = 0;
  const recommendationDetails = [];
  
  for (const user of usersToEvaluate) {
    try {
      const recommendations = await generateRecommendations(user.user_id);
      
      // Check education recommendations
      if (recommendations.recommendations.education) {
        for (const rec of recommendations.recommendations.education) {
          totalRecommendations++;
          if (rec.rationale && rec.rationale.trim().length > 0) {
            recommendationsWithRationales++;
          }
          recommendationDetails.push({
            user_id: user.user_id,
            type: 'education',
            item_id: rec.item.id,
            has_rationale: !!rec.rationale && rec.rationale.trim().length > 0
          });
        }
      }
      
      // Check partner offer recommendations
      if (recommendations.recommendations.partner_offers) {
        for (const rec of recommendations.recommendations.partner_offers) {
          totalRecommendations++;
          if (rec.rationale && rec.rationale.trim().length > 0) {
            recommendationsWithRationales++;
          }
          recommendationDetails.push({
            user_id: user.user_id,
            type: 'offer',
            item_id: rec.item.id,
            has_rationale: !!rec.rationale && rec.rationale.trim().length > 0
          });
        }
      }
    } catch (error) {
      // User doesn't have consent or recommendations can't be generated
      continue;
    }
  }
  
  const explainabilityPercentage = totalRecommendations > 0
    ? (recommendationsWithRationales / totalRecommendations) * 100
    : 0;
  
  return {
    metric: 'explainability',
    description: 'Percentage of recommendations with plain-language rationales',
    total_recommendations: totalRecommendations,
    recommendations_with_rationales: recommendationsWithRationales,
    explainability_percentage: parseFloat(explainabilityPercentage.toFixed(2)),
    target: 100,
    meets_target: explainabilityPercentage >= 100,
    recommendation_details: recommendationDetails
  };
}

/**
 * Calculate latency metric: average time to generate recommendations
 * @param {Array<number>} userIds - Array of user IDs to evaluate (optional, defaults to all users)
 * @param {number} sampleSize - Number of users to sample (optional, for performance)
 * @returns {Object} Latency metric results
 */
async function calculateLatency(userIds = null, sampleSize = null) {
  const allUsers = User.findAll();
  let usersToEvaluate = userIds 
    ? allUsers.filter(u => userIds.includes(u.user_id))
    : allUsers.filter(u => u.consent_status === 'granted');
  
  // Sample users if sampleSize is specified
  if (sampleSize && usersToEvaluate.length > sampleSize) {
    usersToEvaluate = usersToEvaluate.slice(0, sampleSize);
  }
  
  const latencies = [];
  const latencyDetails = [];
  
  for (const user of usersToEvaluate) {
    try {
      const startTime = Date.now();
      // Force refresh to measure actual generation time, not cache retrieval
      await generateRecommendations(user.user_id, { forceRefresh: true });
      const endTime = Date.now();
      
      const latency = endTime - startTime;
      latencies.push(latency);
      
      latencyDetails.push({
        user_id: user.user_id,
        latency_ms: latency,
        latency_seconds: parseFloat((latency / 1000).toFixed(3))
      });
    } catch (error) {
      // User doesn't have consent or recommendations can't be generated
      continue;
    }
  }
  
  if (latencies.length === 0) {
    return {
      metric: 'latency',
      description: 'Average time to generate recommendations',
      sample_size: 0,
      average_latency_ms: 0,
      average_latency_seconds: 0,
      min_latency_ms: 0,
      max_latency_ms: 0,
      target_ms: 5000,
      target_seconds: 5,
      meets_target: false,
      latency_details: []
    };
  }
  
  const averageLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const minLatency = Math.min(...latencies);
  const maxLatency = Math.max(...latencies);
  
  return {
    metric: 'latency',
    description: 'Average time to generate recommendations',
    sample_size: latencies.length,
    average_latency_ms: Math.round(averageLatency),
    average_latency_seconds: parseFloat((averageLatency / 1000).toFixed(3)),
    min_latency_ms: minLatency,
    max_latency_ms: maxLatency,
    target_ms: 5000,
    target_seconds: 5,
    meets_target: averageLatency < 5000,
    latency_details: latencyDetails
  };
}

/**
 * Calculate auditability metric: % of recommendations with decision traces
 * @param {Array<number>} userIds - Array of user IDs to evaluate (optional, defaults to all users)
 * @returns {Object} Auditability metric results
 */
function calculateAuditability(userIds = null) {
  // Check recommendation reviews for decision traces
  const allReviews = RecommendationReview.findAll();
  const reviewsToEvaluate = userIds
    ? allReviews.filter(r => userIds.includes(r.user_id))
    : allReviews;
  
  let totalRecommendations = 0;
  let recommendationsWithTraces = 0;
  const traceDetails = [];
  
  for (const review of reviewsToEvaluate) {
    if (review.recommendation_data && review.recommendation_data.recommendations) {
      // Count education recommendations
      if (review.recommendation_data.recommendations.education) {
        for (const rec of review.recommendation_data.recommendations.education) {
          totalRecommendations++;
          const hasTrace = !!(review.decision_trace || review.recommendation_data.decision_trace);
          if (hasTrace) {
            recommendationsWithTraces++;
          }
          traceDetails.push({
            review_id: review.review_id,
            user_id: review.user_id,
            type: 'education',
            item_id: rec.item.id,
            has_decision_trace: hasTrace
          });
        }
      }
      
      // Count partner offer recommendations
      if (review.recommendation_data.recommendations.partner_offers) {
        for (const rec of review.recommendation_data.recommendations.partner_offers) {
          totalRecommendations++;
          const hasTrace = !!(review.decision_trace || review.recommendation_data.decision_trace);
          if (hasTrace) {
            recommendationsWithTraces++;
          }
          traceDetails.push({
            review_id: review.review_id,
            user_id: review.user_id,
            type: 'offer',
            item_id: rec.item.id,
            has_decision_trace: hasTrace
          });
        }
      }
    }
  }
  
  // If no reviews, check by generating recommendations directly
  if (totalRecommendations === 0) {
    const allUsers = User.findAll();
    const usersToEvaluate = userIds 
      ? allUsers.filter(u => userIds.includes(u.user_id))
      : allUsers.filter(u => u.consent_status === 'granted');
    
    for (const user of usersToEvaluate) {
      try {
        const recommendations = await generateRecommendations(user.user_id);
        totalRecommendations += recommendations.recommendations.education.length;
        totalRecommendations += recommendations.recommendations.partner_offers.length;
        
        const hasTrace = !!(recommendations.decision_trace);
        if (hasTrace) {
          recommendationsWithTraces += recommendations.recommendations.education.length;
          recommendationsWithTraces += recommendations.recommendations.partner_offers.length;
        }
      } catch (error) {
        continue;
      }
    }
  }
  
  const auditabilityPercentage = totalRecommendations > 0
    ? (recommendationsWithTraces / totalRecommendations) * 100
    : 0;
  
  return {
    metric: 'auditability',
    description: 'Percentage of recommendations with decision traces',
    total_recommendations: totalRecommendations,
    recommendations_with_traces: recommendationsWithTraces,
    auditability_percentage: parseFloat(auditabilityPercentage.toFixed(2)),
    target: 100,
    meets_target: auditabilityPercentage >= 100,
    trace_details: traceDetails
  };
}

/**
 * Calculate all metrics
 * @param {Object} options - Options for metrics calculation
 * @param {Array<number>} options.userIds - Array of user IDs to evaluate (optional)
 * @param {number} options.latencySampleSize - Sample size for latency calculation (optional)
 * @returns {Promise<Object>} All metrics results
 */
async function calculateAllMetrics(options = {}) {
  const { userIds = null, latencySampleSize = null } = options;
  
  const startTime = Date.now();
  
  const coverage = calculateCoverage(userIds);
  const explainability = await calculateExplainability(userIds);
  const latency = await calculateLatency(userIds, latencySampleSize);
  const auditability = calculateAuditability(userIds);
  
  const endTime = Date.now();
  const calculationTime = endTime - startTime;
  
  const overallMeetsTarget = coverage.meets_target && 
                             explainability.meets_target && 
                             latency.meets_target && 
                             auditability.meets_target;
  
  return {
    timestamp: new Date().toISOString(),
    calculation_time_ms: calculationTime,
    metrics: {
      coverage,
      explainability,
      latency,
      auditability
    },
    overall_meets_target: overallMeetsTarget,
    summary: {
      coverage_percentage: coverage.coverage_percentage,
      explainability_percentage: explainability.explainability_percentage,
      average_latency_seconds: latency.average_latency_seconds,
      auditability_percentage: auditability.auditability_percentage
    }
  };
}

module.exports = {
  calculateCoverage,
  calculateExplainability,
  calculateLatency,
  calculateAuditability,
  calculateAllMetrics,
  countDetectedBehaviors
};

