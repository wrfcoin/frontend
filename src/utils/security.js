/**
 * Utility functions for security features in Wrfcoin Core
 */

/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} input - User input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = input => {
  if (!input) return '';

  if (typeof input !== 'string') {
    try {
      input = String(input);
    } catch (e) {
      return '';
    }
  }

  // Replace characters that could be part of HTML tags or scripts
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\\/g, '&#x5C;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitizes an object's string values recursively
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
export const sanitizeObject = obj => {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
};

/**
 * Validates and sanitizes blockchain addresses
 * @param {string} address - Address to validate and sanitize
 * @returns {string|null} - Sanitized address or null if invalid
 */
export const validateAddress = address => {
  if (!address || typeof address !== 'string') return null;

  // Basic validation for Wrfcoin addresses
  // Addresses should start with "WRF" and be alphanumeric
  if (!/^WRF[a-zA-Z0-9]{10,45}$/.test(address)) {
    return null;
  }

  // If valid, return the sanitized input
  return sanitizeInput(address);
};

/**
 * Safely parses JSON with sanitization
 * @param {string} jsonString - JSON string to parse
 * @returns {Object|null} - Parsed and sanitized object or null if invalid
 */
export const safeJsonParse = jsonString => {
  try {
    const parsed = JSON.parse(jsonString);
    return sanitizeObject(parsed);
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return null;
  }
};
