/**
 * Validation Middleware
 * Provides input validation for API endpoints
 */

/**
 * Validate user ID parameter
 * Checks if user_id is a valid integer
 */
function validateUserId(req, res, next) {
  const userId = req.params.id;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'User ID is required',
        code: 'MISSING_USER_ID'
      }
    });
  }
  
  const parsedId = parseInt(userId, 10);
  
  if (isNaN(parsedId) || parsedId <= 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: `Invalid user ID: ${userId}. Must be a positive integer.`,
        code: 'INVALID_USER_ID'
      }
    });
  }
  
  // Store parsed ID in request for use in route handlers
  req.params.id = parsedId;
  next();
}

/**
 * Validate request body has required fields
 * @param {Array<string>} requiredFields - Array of required field names
 */
function validateRequiredFields(requiredFields) {
  return (req, res, next) => {
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Missing required fields: ${missingFields.join(', ')}`,
          code: 'MISSING_REQUIRED_FIELDS',
          missingFields: missingFields
        }
      });
    }
    
    next();
  };
}

/**
 * Validate request body field types
 * @param {Object} fieldTypes - Object mapping field names to expected types ('string', 'number', 'boolean', etc.)
 */
function validateFieldTypes(fieldTypes) {
  return (req, res, next) => {
    const invalidFields = [];
    
    for (const [field, expectedType] of Object.entries(fieldTypes)) {
      if (req.body[field] !== undefined) {
        const actualType = typeof req.body[field];
        
        // Handle special cases
        if (expectedType === 'integer' && actualType === 'number' && Number.isInteger(req.body[field])) {
          continue; // Valid integer
        }
        
        if (actualType !== expectedType) {
          invalidFields.push({
            field: field,
            expected: expectedType,
            actual: actualType
          });
        }
      }
    }
    
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid field types',
          code: 'INVALID_FIELD_TYPES',
          invalidFields: invalidFields
        }
      });
    }
    
    next();
  };
}

/**
 * Validate query parameters
 * @param {Object} querySchema - Object mapping query param names to validation functions
 */
function validateQueryParams(querySchema) {
  return (req, res, next) => {
    const invalidParams = [];
    
    for (const [param, validator] of Object.entries(querySchema)) {
      if (req.query[param] !== undefined) {
        const isValid = validator(req.query[param]);
        if (!isValid) {
          invalidParams.push(param);
        }
      }
    }
    
    if (invalidParams.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid query parameters: ${invalidParams.join(', ')}`,
          code: 'INVALID_QUERY_PARAMS',
          invalidParams: invalidParams
        }
      });
    }
    
    next();
  };
}

module.exports = {
  validateUserId,
  validateRequiredFields,
  validateFieldTypes,
  validateQueryParams
};

