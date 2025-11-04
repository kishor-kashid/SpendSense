/**
 * Tone Validator Service
 * Ensures all recommendations use empowering, educational, and supportive language
 * Blocks shaming, judgmental, or negative language
 */

const fs = require('fs');
const path = require('path');

// Path: backend/src/services/guardrails -> backend/data/content/prohibited_phrases.json
const PROHIBITED_PHRASES_PATH = path.join(__dirname, '../../../data/content/prohibited_phrases.json');

/**
 * Load prohibited phrases from JSON file
 * @returns {Object} Object with arrays of prohibited phrases by category
 */
function loadProhibitedPhrases() {
  try {
    const content = fs.readFileSync(PROHIBITED_PHRASES_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading prohibited phrases:', error);
    // Return default empty structure if file doesn't exist
    return {
      shaming_phrases: [],
      judgmental_terms: [],
      negative_framing: [],
      comparison_phrases: [],
      pressure_phrases: []
    };
  }
}

/**
 * Get all prohibited phrases as a flat array
 * @returns {Array<string>} Array of all prohibited phrases
 */
function getAllProhibitedPhrases() {
  const phrases = loadProhibitedPhrases();
  const allPhrases = [];
  
  // Combine all categories into a single array
  Object.values(phrases).forEach(category => {
    if (Array.isArray(category)) {
      allPhrases.push(...category);
    }
  });
  
  return allPhrases;
}

/**
 * Check if text contains prohibited phrases
 * @param {string} text - Text to validate
 * @param {Object} options - Options for validation
 * @param {boolean} options.caseSensitive - Case sensitive matching (default: false)
 * @param {boolean} options.partialMatch - Allow partial word matches (default: true)
 * @returns {Object} Validation result with found phrases
 */
function checkProhibitedPhrases(text, options = {}) {
  const { caseSensitive = false, partialMatch = true } = options;
  
  if (!text || typeof text !== 'string') {
    return {
      isValid: true,
      foundPhrases: [],
      violations: []
    };
  }
  
  const phrases = getAllProhibitedPhrases();
  const foundPhrases = [];
  const violations = [];
  
  const normalizedText = caseSensitive ? text : text.toLowerCase();
  
  phrases.forEach(phrase => {
    const normalizedPhrase = caseSensitive ? phrase : phrase.toLowerCase();
    
    // Check for exact phrase match
    if (normalizedText.includes(normalizedPhrase)) {
      foundPhrases.push(phrase);
      
      // Determine violation category
      const phraseData = loadProhibitedPhrases();
      let category = 'unknown';
      
      if (phraseData.shaming_phrases.includes(phrase)) {
        category = 'shaming';
      } else if (phraseData.judgmental_terms.includes(phrase)) {
        category = 'judgmental';
      } else if (phraseData.negative_framing.includes(phrase)) {
        category = 'negative_framing';
      } else if (phraseData.comparison_phrases.includes(phrase)) {
        category = 'comparison';
      } else if (phraseData.pressure_phrases.includes(phrase)) {
        category = 'pressure';
      }
      
      violations.push({
        phrase: phrase,
        category: category,
        severity: category === 'shaming' || category === 'judgmental' ? 'high' : 'medium'
      });
    }
  });
  
  return {
    isValid: foundPhrases.length === 0,
    foundPhrases: foundPhrases,
    violations: violations
  };
}

/**
 * Validate text tone
 * @param {string} text - Text to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateTone(text, options = {}) {
  const phraseCheck = checkProhibitedPhrases(text, options);
  
  return {
    isValid: phraseCheck.isValid,
    violations: phraseCheck.violations,
    foundPhrases: phraseCheck.foundPhrases,
    message: phraseCheck.isValid 
      ? 'Text passes tone validation'
      : `Text contains ${phraseCheck.foundPhrases.length} prohibited phrase(s)`
  };
}

/**
 * Validate multiple text fields (e.g., title, description, rationale)
 * @param {Object} content - Object with text fields to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result for all fields
 */
function validateContent(content, options = {}) {
  if (!content || typeof content !== 'object') {
    return {
      isValid: true,
      fields: {},
      message: 'No content to validate'
    };
  }
  
  const fields = {};
  let allValid = true;
  const allViolations = [];
  
  // Validate each field that contains text
  Object.keys(content).forEach(key => {
    const value = content[key];
    
    // Only validate string fields
    if (typeof value === 'string') {
      const validation = validateTone(value, options);
      fields[key] = validation;
      
      if (!validation.isValid) {
        allValid = false;
        allViolations.push(...validation.violations.map(v => ({ ...v, field: key })));
      }
    }
  });
  
  return {
    isValid: allValid,
    fields: fields,
    violations: allViolations,
    message: allValid 
      ? 'All content passes tone validation'
      : `Content contains ${allViolations.length} tone violation(s) across ${Object.keys(fields).length} field(s)`
  };
}

/**
 * Require valid tone - throws error if text contains prohibited phrases
 * Use this as a guardrail to block content with poor tone
 * @param {string|Object} content - Text or content object to validate
 * @param {Object} options - Validation options
 * @throws {Error} If content fails tone validation
 */
function requireValidTone(content, options = {}) {
  let validation;
  
  if (typeof content === 'string') {
    validation = validateTone(content, options);
  } else {
    validation = validateContent(content, options);
  }
  
  if (!validation.isValid) {
    const violations = validation.violations || [];
    const violationDetails = violations.map(v => {
      const fieldInfo = v.field ? ` (field: ${v.field})` : '';
      return `"${v.phrase}" [${v.category}]${fieldInfo}`;
    }).join('; ');
    
    throw new Error(
      `Content failed tone validation: ${validation.message}. ` +
      `Found violations: ${violationDetails}`
    );
  }
}

/**
 * Check tone and return result object instead of throwing
 * Useful for conditional logic
 * @param {string|Object} content - Text or content object to validate
 * @param {Object} options - Validation options
 * @returns {Object} { allowed: boolean, error: string|null, validation: Object }
 */
function checkTone(content, options = {}) {
  try {
    let validation;
    
    if (typeof content === 'string') {
      validation = validateTone(content, options);
    } else {
      validation = validateContent(content, options);
    }
    
    return {
      allowed: validation.isValid,
      error: validation.isValid ? null : validation.message,
      validation: validation
    };
  } catch (error) {
    return {
      allowed: false,
      error: `Error validating tone: ${error.message}`,
      validation: null
    };
  }
}

/**
 * Get tone validation summary
 * @param {string|Object} content - Text or content object
 * @returns {Object} Summary of tone validation
 */
function getToneSummary(content) {
  let validation;
  
  if (typeof content === 'string') {
    validation = validateTone(content);
  } else {
    validation = validateContent(content);
  }
  
  return {
    isValid: validation.isValid,
    violationCount: validation.violations ? validation.violations.length : 0,
    categories: validation.violations 
      ? [...new Set(validation.violations.map(v => v.category))] 
      : [],
    message: validation.message
  };
}

module.exports = {
  loadProhibitedPhrases,
  getAllProhibitedPhrases,
  checkProhibitedPhrases,
  validateTone,
  validateContent,
  requireValidTone,
  checkTone,
  getToneSummary
};

