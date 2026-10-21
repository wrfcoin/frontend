/**
 * Wrfcoin Security Utilities
 *
 * This module provides utilities for input validation, sanitization, and
 * other security-related functions to prevent common web vulnerabilities.
 */

import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param {string} html - HTML content to sanitize
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHtml = html => {
  if (typeof html !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(html);
};

/**
 * Alternative name for sanitizeHtml for consistency
 * @param {string} html - HTML content to sanitize
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHTML = sanitizeHtml;

/**
 * Sanitizes a URL parameter to prevent XSS and injection attacks
 * @param {string} param - URL parameter to sanitize
 * @param {number} maxLength - Maximum allowed length (default: 100)
 * @returns {string} - Sanitized parameter
 */
export const sanitizeUrlParam = (param, maxLength = 100) => {
  if (typeof param !== 'string') {
    return '';
  }
  // Trim, limit length, and remove dangerous characters
  return param
    .trim()
    .substring(0, maxLength)
    .replace(/[<>'"\\]/g, '');
};

/**
 * Sanitizes an ID to be used in URLs or API calls
 * Only allows alphanumeric characters, hyphens and underscores
 * @param {string|number} id - ID to sanitize
 * @returns {string} - Sanitized ID
 */
export const sanitizeId = id => {
  if (id === undefined || id === null) {
    return '';
  }
  return String(id).replace(/[^a-zA-Z0-9_-]/g, '');
};

/**
 * Validates that a value is a positive integer within bounds
 * @param {any} value - Value to validate
 * @param {number} min - Minimum allowed value (default: 0)
 * @param {number} max - Maximum allowed value (default: Number.MAX_SAFE_INTEGER)
 * @returns {number} - Validated integer or default value
 */
export const validateInteger = (
  value,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  defaultValue = min,
) => {
  const num = parseInt(value, 10);
  if (isNaN(num) || num < min || num > max) {
    return defaultValue;
  }
  return num;
};

/**
 * Validates and bounds a numeric input
 * @param {any} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {number} defaultValue - Default value if invalid
 * @returns {number} - Validated and bounded number
 */
export const validateNumber = (value, min, max, defaultValue) => {
  const num = Number(value);
  if (isNaN(num)) {
    return defaultValue;
  }
  return Math.min(Math.max(num, min), max);
};

/**
 * Validates a URL to ensure it's properly formatted and safe
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether the URL is valid and safe
 */
export const isUrlSafe = url => {
  if (typeof url !== 'string' || url.trim() === '') {
    return false;
  }

  try {
    const parsedUrl = new URL(url);

    // Check protocol is http or https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Converts a string to be safe for inclusion in HTML content
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
export const escapeHtml = str => {
  if (typeof str !== 'string') {
    return '';
  }

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
