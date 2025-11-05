/**
 * Format currency amount
 * @param {number} amount - Amount in cents or dollars
 * @param {string} currency - Currency code (default: 'USD')
 * @param {boolean} inCents - Whether amount is in cents (default: false)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD', inCents = false) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00';
  }
  
  const amountInDollars = inCents ? amount / 100 : amount;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amountInDollars);
};

/**
 * Format percentage
 * @param {number} value - Percentage value (0-100)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format date
 * @param {string|Date} date - Date string or Date object
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
};

/**
 * Format relative time (e.g., "2 days ago")
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
};

/**
 * Format account number (show last 4 digits)
 * @param {string} accountNumber - Full account number
 * @returns {string} Masked account number
 */
export const formatAccountNumber = (accountNumber) => {
  if (!accountNumber) return '';
  
  const str = String(accountNumber);
  if (str.length <= 4) {
    return str;
  }
  
  return `****${str.slice(-4)}`;
};

/**
 * Format large numbers with abbreviations (e.g., 1.5K, 2.3M)
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export const formatLargeNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  }
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  
  return num.toString();
};

