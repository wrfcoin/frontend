/**
 * Formatting Utilities
 *
 * This module provides helper functions for formatting various data types
 * consistently throughout the application.
 */

/**
 * Format a number as currency (WRF tokens)
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show the WRF symbol
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, showSymbol = true) => {
  if (amount === undefined || amount === null) {
    return showSymbol ? 'WRF 0.00' : '0.00';
  }

  // Format the number with 2 decimal places
  const formattedAmount = Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Return with or without the WRF symbol
  return showSymbol ? `WRF ${formattedAmount}` : formattedAmount;
};

/**
 * Format a date/timestamp consistently
 * @param {string|number|Date} timestamp - The timestamp to format
 * @param {boolean} includeTime - Whether to include the time
 * @returns {string} - Formatted date string
 */
export const formatDate = (timestamp, includeTime = true) => {
  if (!timestamp) {
    return 'N/A';
  }

  const date = new Date(timestamp);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
  };

  return date.toLocaleDateString('en-US', options);
};

/**
 * Format a large number with appropriate suffixes (K, M, B, etc.)
 * @param {number} num - The number to format
 * @param {number} digits - Number of decimal places
 * @returns {string} - Formatted number string
 */
export const formatNumber = (num, digits = 1) => {
  if (num === undefined || num === null) {
    return '0';
  }

  const absNum = Math.abs(num);

  if (absNum < 1000) {
    return num.toFixed(digits);
  }

  const si = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'K' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'B' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'P' },
    { value: 1e18, symbol: 'E' },
  ];

  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  let i;

  for (i = si.length - 1; i > 0; i--) {
    if (absNum >= si[i].value) {
      break;
    }
  }

  return (num / si[i].value).toFixed(digits).replace(rx, '$1') + si[i].symbol;
};

/**
 * Shorten an address/hash for display
 * @param {string} address - The address to shorten
 * @param {number} startChars - Number of characters to show at start
 * @param {number} endChars - Number of characters to show at end
 * @returns {string} - Shortened address
 */
export const shortenAddress = (address, startChars = 6, endChars = 4) => {
  if (!address) {
    return '';
  }

  if (address.length <= startChars + endChars) {
    return address;
  }

  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
};

/**
 * Format a percentage value
 * @param {number} value - The percentage value (0-100 or 0-1)
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted percentage string
 */
export const formatPercent = (value, decimals = 2) => {
  if (value === undefined || value === null) {
    return '0%';
  }

  // If the value is between 0 and 1, multiply by 100
  if (value >= 0 && value <= 1) {
    value = value * 100;
  }

  return `${value.toFixed(decimals)}%`;
};

/**
 * Format a file size in bytes to human-readable format
 * @param {number} bytes - The file size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted file size string
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};
