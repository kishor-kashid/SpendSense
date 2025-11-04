/**
 * Error Handler Middleware
 * Centralized error handling for API endpoints
 */

/**
 * Create error response object
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {boolean} includeStack - Whether to include stack trace
 * @returns {Object} Error response object
 */
function createErrorResponse(error, req, includeStack = false) {
  const response = {
    success: false,
    error: {
      message: error.message || 'Internal server error',
      code: error.code || 'INTERNAL_ERROR'
    }
  };
  
  // Add stack trace in development mode
  if (includeStack && error.stack) {
    response.error.stack = error.stack;
  }
  
  // Add additional error details if available
  if (error.details) {
    response.error.details = error.details;
  }
  
  return response;
}

/**
 * Get HTTP status code from error
 * @param {Error} error - Error object
 * @returns {number} HTTP status code
 */
function getStatusCode(error) {
  // Check if error has status property
  if (error.status) {
    return error.status;
  }
  
  // Check error code for common patterns
  if (error.code) {
    if (error.code.includes('NOT_FOUND')) {
      return 404;
    }
    if (error.code.includes('VALIDATION') || error.code.includes('INVALID') || error.code.includes('MISSING')) {
      return 400;
    }
    if (error.code.includes('UNAUTHORIZED') || error.code.includes('FORBIDDEN')) {
      return 403;
    }
    if (error.code.includes('CONFLICT')) {
      return 409;
    }
  }
  
  // Default to 500 for unknown errors
  return 500;
}

/**
 * Express error handling middleware
 * Should be added after all routes
 */
function errorHandler(err, req, res, next) {
  // Log error for debugging
  console.error('API Error:', {
    message: err.message,
    code: err.code,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Determine if we should include stack trace
  const includeStack = process.env.NODE_ENV === 'development';
  
  // Get status code
  const statusCode = getStatusCode(err);
  
  // Create error response
  const errorResponse = createErrorResponse(err, req, includeStack);
  
  // Send response
  res.status(statusCode).json(errorResponse);
}

/**
 * Async handler wrapper
 * Wraps async route handlers to catch errors and pass them to error handler
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create custom error with status code and code
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {string} code - Error code
 * @returns {Error} Custom error object
 */
function createError(message, status = 500, code = 'INTERNAL_ERROR') {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

module.exports = {
  errorHandler,
  asyncHandler,
  createError,
  createErrorResponse,
  getStatusCode
};

