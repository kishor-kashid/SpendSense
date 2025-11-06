/**
 * AI Rationale Generator Service
 * Generates AI-powered personalized rationales for recommendations
 * This is an ADDITIONAL feature - template-based rationales remain unchanged
 */

const { getOpenAIClient, isConfigured } = require('./openaiClient');
const { getRationalePrompt } = require('./promptTemplates');
const { getCachedOrGenerate, sanitizeDataForAI, handleAIError } = require('./utils');
const { requireAIConsent } = require('../guardrails/aiConsentChecker');
const { validateContent } = require('../guardrails/toneValidator');

/**
 * Generate AI rationale for a recommendation
 * @param {Object} params - Parameters for rationale generation
 * @param {Object} params.item - Recommendation item (education or offer)
 * @param {string} params.type - 'education' or 'offer'
 * @param {Object} params.persona - Assigned persona
 * @param {Object} params.behavioralSignals - Behavioral analysis results
 * @param {Object} params.userData - User data and accounts
 * @param {number} params.userId - User ID (for consent checking and caching)
 * @returns {Promise<string|null>} AI-generated rationale or null if generation fails
 */
async function generateAIRationale(params) {
  const { item, type, persona, behavioralSignals, userData, userId } = params;

  // Check if OpenAI is configured
  if (!isConfigured()) {
    return null;
  }

  // Check AI consent (will throw if not granted)
  try {
    requireAIConsent(userId);
  } catch (error) {
    // No AI consent - return null (template rationale will be used)
    return null;
  }

  // Create cache key
  const cacheKey = `ai_rationale:${userId}:${type}:${item.id}:${persona.type}`;

  // Try to get from cache or generate
  try {
    const rationale = await getCachedOrGenerate(
      cacheKey,
      async () => {
        // Sanitize user data for AI
        const sanitizedData = sanitizeDataForAI({
          ...userData,
          behavioral_signals: behavioralSignals
        });

        // Get prompt template
        const prompt = getRationalePrompt({
          item,
          persona,
          behavioralSignals: behavioralSignals,
          userData: sanitizedData
        });

        // Get OpenAI client
        const openai = getOpenAIClient();

        // Call OpenAI API with GPT-4 for better quality
        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user }
          ],
          temperature: 0.7,
          max_tokens: 150,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        });

        // Extract rationale from response
        const generatedRationale = response.choices[0]?.message?.content?.trim();

        if (!generatedRationale) {
          return null;
        }

        // Validate rationale
        const validation = validateAIRationale(generatedRationale, item);

        if (!validation.isValid) {
          // If validation fails, return null (fallback to template)
          return null;
        }

        return generatedRationale;
      },
      300000 // 5 minutes cache TTL
    );

    return rationale;
  } catch (error) {
    // Handle AI errors gracefully
    const handledError = handleAIError(error);
    
    // Log error for debugging (but don't expose to user)
    if (process.env.NODE_ENV === 'development') {
      console.warn('AI rationale generation failed:', handledError.code, handledError.message);
    }

    // Return null - template rationale will be used
    return null;
  }
}

/**
 * Validate AI-generated rationale
 * @param {string} rationale - Generated rationale text
 * @param {Object} item - Recommendation item
 * @returns {Object} Validation result with isValid flag and issues
 */
function validateAIRationale(rationale, item) {
  if (!rationale || typeof rationale !== 'string') {
    return {
      isValid: false,
      issues: ['Rationale is empty or invalid']
    };
  }

  // Check length (should be under 100 words, approximately 500 characters)
  if (rationale.length > 500) {
    return {
      isValid: false,
      issues: ['Rationale is too long (exceeds 100 words)']
    };
  }

  if (rationale.length < 20) {
    return {
      isValid: false,
      issues: ['Rationale is too short']
    };
  }

  // Validate tone using existing tone validator
  const toneValidation = validateContent({
    title: item.title,
    description: item.description || '',
    rationale: rationale
  });

  if (!toneValidation.isValid) {
    return {
      isValid: false,
      issues: toneValidation.issues || ['Tone validation failed']
    };
  }

  // Check for basic quality indicators
  const hasSpecificData = /\$\d+|\d+%|\d+ (month|card|subscription|account)/i.test(rationale);
  if (!hasSpecificData) {
    // Warning but not invalid - some rationales might not need specific numbers
    // Just log for improvement
  }

  return {
    isValid: true,
    issues: []
  };
}

/**
 * Generate AI rationales for multiple recommendations in batch
 * @param {Array} recommendations - Array of recommendation objects with rationale generation params
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of recommendations with ai_rationale field added
 */
async function generateAIRationalesForRecommendations(recommendations, userId) {
  // Generate rationales in parallel (with rate limiting consideration)
  const promises = recommendations.map(async (rec) => {
    try {
      const aiRationale = await generateAIRationale({
        item: rec.item,
        type: rec.type,
        persona: rec.persona,
        behavioralSignals: rec.behavioralSignals,
        userData: rec.userData,
        userId: userId
      });

      return {
        ...rec,
        ai_rationale: aiRationale || null
      };
    } catch (error) {
      // If AI rationale generation fails, just continue without it
      return {
        ...rec,
        ai_rationale: null
      };
    }
  });

  return Promise.all(promises);
}

module.exports = {
  generateAIRationale,
  validateAIRationale,
  generateAIRationalesForRecommendations
};

