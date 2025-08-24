/**
 * Number utility functions for safe formatting and calculations
 */

/**
 * Safely format a number as currency
 * @param {number|string} value - The value to format
 * @param {string} currency - Currency symbol (default: ₹)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = '₹') => {
  const num = parseFloat(value);
  if (isNaN(num)) return `${currency}0`;
  return `${currency}${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

/**
 * Safely format a number with locale formatting
 * @param {number|string} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, decimals = 0) => {
  const num = parseFloat(value);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-IN', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  });
};

/**
 * Safely parse a number from string or return default
 * @param {any} value - The value to parse
 * @param {number} defaultValue - Default value if parsing fails (default: 0)
 * @returns {number} Parsed number or default
 */
export const safeParseNumber = (value, defaultValue = 0) => {
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Safely parse an integer from string or return default
 * @param {any} value - The value to parse
 * @param {number} defaultValue - Default value if parsing fails (default: 0)
 * @returns {number} Parsed integer or default
 */
export const safeParseInt = (value, defaultValue = 0) => {
  const num = parseInt(value);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Calculate percentage safely
 * @param {number} value - The value (if total provided) or percentage value
 * @param {number} total - The total (optional)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, total = null, decimals = 1) => {
  const val = safeParseNumber(value);
  
  if (total === null) {
    // Direct percentage formatting
    return `${val.toFixed(decimals)}%`;
  }
  
  const tot = safeParseNumber(total);
  if (tot === 0) return '0%';
  
  const percentage = (val / tot) * 100;
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Format date safely
 * @param {Date|string} date - The date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = { year: 'numeric', month: 'short', day: 'numeric' }) => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    return dateObj.toLocaleDateString('en-US', options);
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Round number to specified decimal places
 * @param {number} value - The value to round
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Rounded number
 */
export const roundNumber = (value, decimals = 2) => {
  const num = safeParseNumber(value);
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
};

/**
 * Check if a value is a valid number
 * @param {any} value - The value to check
 * @returns {boolean} True if valid number
 */
export const isValidNumber = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * Clamp a number between min and max values
 * @param {number} value - The value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export const clampNumber = (value, min, max) => {
  const num = safeParseNumber(value);
  return Math.min(Math.max(num, min), max);
};

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  const num = safeParseNumber(bytes);
  if (num === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  
  return `${parseFloat((num / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Calculate GST amount
 * @param {number} amount - Base amount
 * @param {number} gstRate - GST rate percentage
 * @returns {object} Object with base, gst, and total amounts
 */
export const calculateGST = (amount, gstRate) => {
  const baseAmount = safeParseNumber(amount);
  const rate = safeParseNumber(gstRate);
  
  const gstAmount = (baseAmount * rate) / 100;
  const totalAmount = baseAmount + gstAmount;
  
  return {
    base: roundNumber(baseAmount),
    gst: roundNumber(gstAmount),
    total: roundNumber(totalAmount),
    rate: rate
  };
};

/**
 * Calculate discount amount
 * @param {number} amount - Original amount
 * @param {number} discountPercent - Discount percentage
 * @returns {object} Object with original, discount, and final amounts
 */
export const calculateDiscount = (amount, discountPercent) => {
  const originalAmount = safeParseNumber(amount);
  const discount = safeParseNumber(discountPercent);
  
  const discountAmount = (originalAmount * discount) / 100;
  const finalAmount = originalAmount - discountAmount;
  
  return {
    original: roundNumber(originalAmount),
    discount: roundNumber(discountAmount),
    final: roundNumber(finalAmount),
    percent: discount
  };
};
