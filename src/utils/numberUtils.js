/**
 * Utility functions for number formatting
 */

/**
 * Formats a number with commas for thousands
 * @param {number} number - The number to format
 * @returns {string} Formatted number
 */
export const formatNumber = number => {
  if (number === undefined || number === null) return '0';
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Formats a number to a specific number of decimal places
 * @param {number} number - The number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
export const formatDecimals = (number, decimals = 2) => {
  if (number === undefined || number === null) return '0';
  return number.toFixed(decimals);
};

/**
 * Formats a number as a file size (KB, MB, GB, etc)
 * @param {number} bytes - The size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = bytes => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
