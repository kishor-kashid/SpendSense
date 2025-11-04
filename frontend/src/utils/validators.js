/**
 * Validate email address
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate user ID
 * @param {string|number} userId - User ID to validate
 * @returns {boolean} True if valid user ID
 */
export const isValidUserId = (userId) => {
  if (userId === null || userId === undefined) return false;
  
  const id = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  return Number.isInteger(id) && id > 0;
};

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @returns {boolean} True if value is not empty
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  
  return true;
};

/**
 * Validate number range
 * @param {number} value - Number to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if value is in range
 */
export const isInRange = (value, min, max) => {
  if (value === null || value === undefined || isNaN(value)) {
    return false;
  }
  
  return value >= min && value <= max;
};

/**
 * Validate positive number
 * @param {number} value - Number to validate
 * @returns {boolean} True if value is positive
 */
export const isPositive = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return false;
  }
  
  return value > 0;
};

/**
 * Validate non-negative number
 * @param {number} value - Number to validate
 * @returns {boolean} True if value is non-negative
 */
export const isNonNegative = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return false;
  }
  
  return value >= 0;
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate phone number (basic US format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone number
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  
  const phoneRegex = /^[\d\s\-\(\)]+$/;
  const digits = phone.replace(/\D/g, '');
  
  return phoneRegex.test(phone) && digits.length >= 10 && digits.length <= 15;
};

