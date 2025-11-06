/**
 * Persona Prioritizer
 * Handles logic for prioritizing personas when multiple match
 */

const { PERSONA_PRIORITY } = require('../../config/constants');
const { getAllPersonas } = require('./personaDefinitions');

/**
 * Prioritize matching personas by priority
 * Higher priority number = higher priority (assigned first)
 * 
 * @param {Array} matchingPersonas - Array of persona objects that matched
 * @returns {Object|null} Highest priority persona or null
 */
function prioritizePersonas(matchingPersonas) {
  if (!matchingPersonas || matchingPersonas.length === 0) {
    return null;
  }

  if (matchingPersonas.length === 1) {
    return matchingPersonas[0];
  }

  // Sort by priority (descending - higher priority first)
  const sorted = matchingPersonas.sort((a, b) => {
    const priorityA = a.persona.priority || 0;
    const priorityB = b.persona.priority || 0;
    return priorityB - priorityA;
  });

  // Return highest priority persona
  return sorted[0];
}

/**
 * Check which personas match for a user
 * Returns all matching personas with their match details
 * 
 * @param {Object} userData - User data from database
 * @param {Object} featureAnalyses - All feature analysis results
 * @param {Object} accountData - Account data (count, etc.)
 * @returns {Array} Array of matching personas with match details
 */
function findMatchingPersonas(userData, featureAnalyses, accountData) {
  const {
    creditAnalysis,
    incomeAnalysis,
    subscriptionAnalysis,
    savingsAnalysis
  } = featureAnalyses;

  const allPersonas = getAllPersonas();
  const matchingPersonas = [];

  // Helper function to check persona match and get rationale
  const checkPersonaMatch = (persona, ...args) => {
    try {
      const matches = persona.matches(...args);
      if (matches) {
        return { matches, rationale: persona.getRationale(...args) };
      }
      return { matches: false, rationale: null };
    } catch (error) {
      // If persona check fails, skip it
      return { matches: false, rationale: null };
    }
  };

  // Check each persona
  for (const [key, persona] of Object.entries(allPersonas)) {
    let matchResult;

    switch (persona.id) {
      case 'high_utilization':
        matchResult = checkPersonaMatch(persona, creditAnalysis);
        break;
      case 'variable_income':
        matchResult = checkPersonaMatch(persona, incomeAnalysis);
        break;
      case 'subscription_heavy':
        matchResult = checkPersonaMatch(persona, subscriptionAnalysis);
        break;
      case 'savings_builder':
        matchResult = checkPersonaMatch(persona, savingsAnalysis, creditAnalysis);
        break;
      case 'new_user':
        matchResult = checkPersonaMatch(persona, userData, creditAnalysis, accountData);
        break;
      default:
        matchResult = { matches: false, rationale: null };
    }

    if (matchResult.matches) {
      matchingPersonas.push({
        persona,
        rationale: matchResult.rationale,
        priority: persona.priority
      });
    }
  }

  return matchingPersonas;
}

/**
 * Assign persona to user based on matching personas
 * Uses prioritization logic to select the best match
 * 
 * @param {Object} userData - User data from database
 * @param {Object} featureAnalyses - All feature analysis results
 * @param {Object} accountData - Account data
 * @returns {Object} Persona assignment result with decision trace
 */
function assignPersona(userData, featureAnalyses, accountData) {
  // Find all matching personas
  const matchingPersonas = findMatchingPersonas(userData, featureAnalyses, accountData);

  // If no personas match, assign New User as fallback
  if (matchingPersonas.length === 0) {
    const newUserPersona = getAllPersonas().NEW_USER;
    return {
      assignedPersona: newUserPersona,
      rationale: newUserPersona.getRationale(userData) || 'No specific patterns detected. Welcome!',
      matchingPersonas: [],
      decisionTrace: {
        timestamp: new Date().toISOString(),
        allMatches: [],
        selectedPersona: 'new_user',
        selectionReason: 'No personas matched - using default fallback',
        priorityOrder: []
      }
    };
  }

  // Prioritize and select highest priority persona
  const selectedMatch = prioritizePersonas(matchingPersonas);

  // Build decision trace
  const decisionTrace = {
    timestamp: new Date().toISOString(),
    allMatches: matchingPersonas.map(m => ({
      personaId: m.persona.id,
      personaName: m.persona.name,
      priority: m.persona.priority,
      rationale: m.rationale
    })),
    selectedPersona: selectedMatch.persona.id,
    selectedPersonaName: selectedMatch.persona.name,
    selectionReason: `Selected highest priority persona (priority: ${selectedMatch.persona.priority})`,
    priorityOrder: matchingPersonas
      .sort((a, b) => b.priority - a.priority)
      .map(m => m.persona.id)
  };

  return {
    assignedPersona: selectedMatch.persona,
    rationale: selectedMatch.rationale || `You match the ${selectedMatch.persona.name} persona.`,
    matchingPersonas: matchingPersonas.map(m => m.persona),
    decisionTrace
  };
}

module.exports = {
  prioritizePersonas,
  findMatchingPersonas,
  assignPersona
};

