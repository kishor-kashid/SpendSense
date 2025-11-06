/**
 * OpenAI Client Configuration
 * Initializes and provides OpenAI SDK client instance
 */

const OpenAI = require('openai');

let openaiClient = null;

/**
 * Initialize OpenAI client
 * @returns {OpenAI} OpenAI client instance
 */
function getOpenAIClient() {
  if (openaiClient) {
    return openaiClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set. Please configure your OpenAI API key.');
  }

  openaiClient = new OpenAI({
    apiKey: apiKey
  });

  return openaiClient;
}

/**
 * Check if OpenAI is configured
 * @returns {boolean} True if API key is set
 */
function isConfigured() {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Reset client (useful for testing)
 */
function resetClient() {
  openaiClient = null;
}

module.exports = {
  getOpenAIClient,
  isConfigured,
  resetClient
};

