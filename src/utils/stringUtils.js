/**
 * Utility functions for string manipulation
 */

/**
 * Truncates an address or long string for display
 * @param {string} address - The address to truncate
 * @param {number} start - Number of characters to keep at start
 * @param {number} end - Number of characters to keep at end
 * @returns {string} Truncated address
 */
export const truncateAddress = (address, start = 6, end = 4) => {
  if (!address) return '';
  if (address.length <= start + end) return address;
  return `${address.substring(0, start)}...${address.substring(address.length - end)}`;
};

/**
 * Formats a date string to a readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatDate = dateString => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Converts a string to title case
 * @param {string} str - Input string
 * @returns {string} Title cased string
 */
export const toTitleCase = str => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
