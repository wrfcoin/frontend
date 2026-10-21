/**
 * Validator Service
 *
 * This service provides functions for interacting with the validator API endpoints.
 * It handles fetching validator data, statistics, and slashing events.
 */

const API_BASE_URL = '/api';

/**
 * Fetch all validators
 * @returns {Promise<Array>} Array of validators
 */
export const fetchValidators = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/validators`);
    if (!response.ok) {
      throw new Error(`Failed to fetch validators: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching validators:', error);
    throw error;
  }
};

/**
 * Fetch a validator by ID
 * @param {string|number} id Validator ID
 * @returns {Promise<Object>} Validator details
 */
export const fetchValidatorById = async id => {
  try {
    const response = await fetch(`${API_BASE_URL}/validators/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch validator: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching validator ${id}:`, error);
    throw error;
  }
};

/**
 * Fetch validator statistics overview
 * @returns {Promise<Object>} Validator statistics
 */
export const fetchValidatorStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/validators/stats/overview`);
    if (!response.ok) {
      throw new Error(`Failed to fetch validator stats: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching validator stats:', error);
    throw error;
  }
};

/**
 * Fetch validator rewards by validator ID
 * @param {string|number} id Validator ID
 * @returns {Promise<Array>} Validator rewards
 */
export const fetchValidatorRewards = async id => {
  try {
    const response = await fetch(`${API_BASE_URL}/validators/${id}/rewards`);
    if (!response.ok) {
      throw new Error(`Failed to fetch validator rewards: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching rewards for validator ${id}:`, error);
    throw error;
  }
};

/**
 * Fetch validator activity by validator ID
 * @param {string|number} id Validator ID
 * @returns {Promise<Array>} Validator activity
 */
export const fetchValidatorActivity = async id => {
  try {
    const response = await fetch(`${API_BASE_URL}/validators/${id}/activity`);
    if (!response.ok) {
      throw new Error(`Failed to fetch validator activity: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching activity for validator ${id}:`, error);
    throw error;
  }
};

/**
 * Fetch slashing events
 * @returns {Promise<Array>} Slashing events
 */
export const fetchSlashingEvents = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/validators/slashing/events`);
    if (!response.ok) {
      throw new Error(`Failed to fetch slashing events: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching slashing events:', error);
    throw error;
  }
};
