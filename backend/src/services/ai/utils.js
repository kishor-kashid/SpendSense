/**
 * AI Service Utilities
 * Common utilities for AI features (caching, rate limiting, error handling)
 */

const cache = require('../../utils/cache');

/**
 * Rate limiting for AI API calls
 * Simple in-memory rate limiter (for production, use Redis or similar)
 */
const rateLimiter = new Map();

/**
 * Check rate limit for a user
 * @param {number} userId - User ID
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} { allowed: boolean, remaining: number, resetTime: number }
 */
function checkRateLimit(userId, maxRequests = 100, windowMs = 60000) {
  const now = Date.now();
  const key = `rate_limit_${userId}`;
  
  const userLimit = rateLimiter.get(key) || { count: 0, resetTime: now + windowMs };
  
  // Reset if window expired
  if (now > userLimit.resetTime) {
    userLimit.count = 0;
    userLimit.resetTime = now + windowMs;
  }
  
  // Check if limit exceeded
  if (userLimit.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: userLimit.resetTime
    };
  }
  
  // Increment count
  userLimit.count++;
  rateLimiter.set(key, userLimit);
  
  return {
    allowed: true,
    remaining: maxRequests - userLimit.count,
    resetTime: userLimit.resetTime
  };
}

/**
 * Get cached AI response or generate new one
 * @param {string} cacheKey - Cache key
 * @param {Function} generateFn - Function to generate response if not cached
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 * @returns {Promise<any>} Cached or generated response
 */
async function getCachedOrGenerate(cacheKey, generateFn, ttl = 300000) {
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached !== null) {
    return cached;
  }
  
  // Generate new response
  const result = await generateFn();
  
  // Cache the result
  cache.set(cacheKey, result, ttl);
  
  return result;
}

/**
 * Sanitize user data for AI prompts
 * Removes sensitive information and formats data appropriately
 * @param {Object} userData - User data object
 * @returns {Object} Sanitized data safe for AI prompts
 */
function sanitizeDataForAI(userData) {
  const sanitized = { ...userData };
  
  // Remove or mask sensitive fields
  if (sanitized.accounts) {
    sanitized.accounts = sanitized.accounts.map(acc => ({
      type: acc.type,
      subtype: acc.subtype,
      balance: acc.current_balance,
      // Mask account ID (only show last 4 digits)
      account_id_masked: acc.account_id ? `****${acc.account_id.slice(-4)}` : null
    }));
  }
  
  // Summarize transactions instead of sending full list
  if (sanitized.transactions) {
    const transactionCount = sanitized.transactions.length;
    const totalSpending = sanitized.transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalIncome = sanitized.transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    sanitized.transaction_summary = {
      count: transactionCount,
      total_spending: totalSpending,
      total_income: totalIncome,
      net_flow: totalIncome - totalSpending
    };
    delete sanitized.transactions;
  }
  
  // Remove user_id, password, etc.
  delete sanitized.password;
  delete sanitized.user_id;
  
  return sanitized;
}

/**
 * Handle AI API errors gracefully
 * @param {Error} error - Error from OpenAI API
 * @returns {Object} Error object with user-friendly message
 */
function handleAIError(error) {
  if (error.status === 429) {
    return {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'AI service is temporarily unavailable due to rate limits. Please try again later.',
      retryAfter: error.response?.headers?.['retry-after'] || 60
    };
  }
  
  if (error.status === 401) {
    return {
      code: 'INVALID_API_KEY',
      message: 'AI service configuration error. Please contact support.',
      internal: 'Invalid OpenAI API key'
    };
  }
  
  if (error.status >= 500) {
    return {
      code: 'AI_SERVICE_ERROR',
      message: 'AI service is temporarily unavailable. Please try again later.',
      retryAfter: 60
    };
  }
  
  return {
    code: 'AI_ERROR',
    message: 'An error occurred while processing your request. Please try again.',
    internal: error.message
  };
}

/**
 * Clear AI-related cache for a user
 * @param {number} userId - User ID
 */
function clearAICache(userId) {
  // Clear all cache entries related to this user
  const keysToClear = [
    `user_${userId}_ai_rationale`,
    `user_${userId}_ai_predictions`,
    `user_${userId}_ai_budget`,
    `user_${userId}_ai_report`,
    `user_${userId}_ai_subscriptions`
  ];
  
  keysToClear.forEach(key => cache.delete(key));
}

module.exports = {
  checkRateLimit,
  getCachedOrGenerate,
  sanitizeDataForAI,
  handleAIError,
  clearAICache
};

