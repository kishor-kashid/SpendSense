/**
 * Persona Assigner Service
 * Main service that orchestrates persona assignment for users
 */

const { analyzeCreditForUser } = require('../features/creditAnalyzer');
const { analyzeIncomeForUser } = require('../features/incomeAnalyzer');
const { analyzeSubscriptionsForUser } = require('../features/subscriptionDetector');
const { analyzeSavingsForUser } = require('../features/savingsAnalyzer');
const { assignPersona } = require('./personaPrioritizer');
const Account = require('../../models/Account');
const User = require('../../models/User');

/**
 * Assign persona to a user based on behavioral signals
 * Runs all feature analyses and assigns the most appropriate persona
 * 
 * @param {number} userId - User ID
 * @param {Object} options - Options for analysis
 * @param {boolean} options.useShortTerm - Use short-term (30d) analysis (default: true)
 * @param {boolean} options.useLongTerm - Use long-term (180d) analysis (default: true)
 * @returns {Object} Persona assignment result with all analysis data
 */
function assignPersonaToUser(userId, options = {}) {
  const { useShortTerm = true, useLongTerm = true } = options;

  // Get user data
  const user = User.findById(userId);
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  // Get account data
  const accounts = Account.findByUserId(userId);
  const accountData = {
    account_count: accounts.length,
    accounts: accounts
  };

  // Run all feature analyses
  const featureAnalyses = {
    creditAnalysis: analyzeCreditForUser(userId),
    incomeAnalysis: analyzeIncomeForUser(userId),
    subscriptionAnalysis: analyzeSubscriptionsForUser(userId),
    savingsAnalysis: analyzeSavingsForUser(userId)
  };

  // Assign persona
  const assignment = assignPersona(user, featureAnalyses, accountData);

  // Build comprehensive result
  return {
    user_id: userId,
    user_name: user.name,
    assigned_persona: {
      id: assignment.assignedPersona.id,
      name: assignment.assignedPersona.name,
      description: assignment.assignedPersona.description,
      educational_focus: assignment.assignedPersona.educationalFocus,
      recommendation_types: assignment.assignedPersona.recommendationTypes
    },
    rationale: assignment.rationale,
    decision_trace: assignment.decisionTrace,
    behavioral_signals: {
      credit: {
        has_credit_cards: featureAnalyses.creditAnalysis.has_credit_cards,
        meets_threshold: featureAnalyses.creditAnalysis.meets_credit_threshold,
        short_term: featureAnalyses.creditAnalysis.short_term,
        long_term: featureAnalyses.creditAnalysis.long_term
      },
      income: {
        has_payroll_income: featureAnalyses.incomeAnalysis.has_payroll_income,
        meets_threshold: featureAnalyses.incomeAnalysis.meets_income_threshold,
        short_term: featureAnalyses.incomeAnalysis.short_term,
        long_term: featureAnalyses.incomeAnalysis.long_term
      },
      subscriptions: {
        has_recurring_subscriptions: featureAnalyses.subscriptionAnalysis.has_recurring_subscriptions,
        meets_threshold: featureAnalyses.subscriptionAnalysis.meets_subscription_threshold,
        short_term: featureAnalyses.subscriptionAnalysis.short_term,
        long_term: featureAnalyses.subscriptionAnalysis.long_term
      },
      savings: {
        has_savings_accounts: featureAnalyses.savingsAnalysis.has_savings_accounts,
        meets_threshold: featureAnalyses.savingsAnalysis.meets_savings_threshold,
        short_term: featureAnalyses.savingsAnalysis.short_term,
        long_term: featureAnalyses.savingsAnalysis.long_term
      }
    },
    all_matching_personas: assignment.matchingPersonas.map(p => ({
      id: p.id,
      name: p.name,
      priority: p.priority
    })),
    timestamp: new Date().toISOString()
  };
}

/**
 * Assign personas for multiple users
 * Useful for batch processing or evaluation
 * 
 * @param {Array<number>} userIds - Array of user IDs
 * @param {Object} options - Options for analysis
 * @returns {Array} Array of persona assignment results
 */
function assignPersonasToUsers(userIds, options = {}) {
  return userIds.map(userId => {
    try {
      return assignPersonaToUser(userId, options);
    } catch (error) {
      console.error(`Error assigning persona to user ${userId}:`, error);
      return {
        user_id: userId,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  });
}

module.exports = {
  assignPersonaToUser,
  assignPersonasToUsers
};

