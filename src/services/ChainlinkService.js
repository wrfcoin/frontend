/**
 * Chainlink Integration Service
 *
 * This service provides client-side access to Chainlink functionality
 * including data feeds, VRF, and automation services.
 */

import { apiRequest } from './api';

class ChainlinkService {
  /**
   * Get the status of all Chainlink services
   * @returns {Promise<Object>} Status information for all Chainlink services
   */
  async getStatus() {
    try {
      const response = await apiRequest('/api/integrations/chainlink/status');
      return response;
    } catch (error) {
      console.error('Error fetching Chainlink status:', error);
      throw error;
    }
  }

  /**
   * Get available data feeds
   * @returns {Promise<Array>} List of available data feeds
   */
  async getDataFeeds() {
    try {
      const response = await apiRequest(
        '/api/integrations/chainlink/data-feeds',
      );
      return response;
    } catch (error) {
      console.error('Error fetching data feeds:', error);
      throw error;
    }
  }

  /**
   * Get the latest price from a data feed
   * @param {string} feedId - The feed identifier (e.g., 'ETH-USD')
   * @returns {Promise<Object>} Price data
   */
  async getLatestPrice(feedId) {
    try {
      const response = await apiRequest(
        `/api/integrations/chainlink/data-feeds/${feedId}/latest`,
      );
      return response;
    } catch (error) {
      console.error(`Error fetching price for ${feedId}:`, error);
      throw error;
    }
  }

  /**
   * Request a random number from the VRF service
   * @param {Object} options - Options for the random number request
   * @param {number} [options.numWords=1] - Number of random values to generate
   * @param {number} [options.min] - Minimum value (if requesting in a range)
   * @param {number} [options.max] - Maximum value (if requesting in a range)
   * @returns {Promise<Object>} The request information including requestId
   */
  async requestRandomness(options = {}) {
    try {
      const response = await apiRequest(
        '/api/integrations/chainlink/vrf/request',
        {
          method: 'POST',
          body: JSON.stringify(options),
        },
      );
      return response;
    } catch (error) {
      console.error('Error requesting randomness:', error);
      throw error;
    }
  }

  /**
   * Get the status of a VRF request
   * @param {string} requestId - The request ID
   * @returns {Promise<Object>} Request status information
   */
  async getRandomnessRequestStatus(requestId) {
    try {
      const response = await apiRequest(
        `/api/integrations/chainlink/vrf/requests/${requestId}`,
      );
      return response;
    } catch (error) {
      console.error(`Error getting status for request ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Register a new upkeep with the Automation service
   * @param {Object} params - Registration parameters
   * @returns {Promise<Object>} Registration result
   */
  async registerUpkeep(params) {
    try {
      const response = await apiRequest(
        '/api/integrations/chainlink/automation/register',
        {
          method: 'POST',
          body: JSON.stringify(params),
        },
      );
      return response;
    } catch (error) {
      console.error('Error registering upkeep:', error);
      throw error;
    }
  }

  /**
   * List all registered upkeeps
   * @returns {Promise<Array>} List of registered upkeeps
   */
  async listUpkeeps() {
    try {
      const response = await apiRequest(
        '/api/integrations/chainlink/automation/upkeeps',
      );
      return response;
    } catch (error) {
      console.error('Error listing upkeeps:', error);
      throw error;
    }
  }

  /**
   * Get details about a registered upkeep
   * @param {string} upkeepId - ID of the upkeep to retrieve
   * @returns {Promise<Object>} Upkeep details
   */
  async getUpkeep(upkeepId) {
    try {
      const response = await apiRequest(
        `/api/integrations/chainlink/automation/upkeeps/${upkeepId}`,
      );
      return response;
    } catch (error) {
      console.error(`Error getting upkeep ${upkeepId}:`, error);
      throw error;
    }
  }

  /**
   * Update the status of an upkeep (pause/resume)
   * @param {string} upkeepId - ID of the upkeep to update
   * @param {string} action - Action to perform ('pause' or 'resume')
   * @returns {Promise<Object>} Update result
   */
  async updateUpkeepStatus(upkeepId, action) {
    try {
      const response = await apiRequest(
        `/api/integrations/chainlink/automation/upkeeps/${upkeepId}/${action}`,
        {
          method: 'POST',
        },
      );
      return response;
    } catch (error) {
      console.error(`Error ${action}ing upkeep ${upkeepId}:`, error);
      throw error;
    }
  }
}

export default new ChainlinkService();
