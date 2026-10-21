/**
 * Proof of Publishing (PoP) Service
 *
 * This service provides methods for interacting with the Proof of Publishing
 * consensus mechanism of the Wrfcoin blockchain.
 *
 * PoP enables users to submit environmental data, validate submissions,
 * and earn rewards for accurate and valuable data contributions.
 */

import { blockchainAPI as api } from './api';
import { getWebSocketClient } from './websocketService';
import { devLog } from '../utils/logger';

class PopService {
  constructor() {
    this.baseUrl = '/api/pop';
    this.ws = getWebSocketClient();
    this.initWebSocket();
  }

  /**
   * Initialize WebSocket connection for real-time PoP updates
   */
  initWebSocket() {
    this.ws.subscribe('pop', message => {
      // Handle incoming PoP-related WebSocket messages
      devLog('PoP WebSocket message received:', message);
    });
  }

  /**
   * Submit environmental data to the blockchain
   * @param {Object} data - Environmental data to submit
   * @returns {Promise} - Promise with submission result
   */
  async submitEnvironmentalData(data) {
    try {
      const url = `${this.baseUrl}/submit`;
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error submitting environmental data:', error);
      throw error;
    }
  }

  /**
   * Get submission by ID
   * @param {string} submissionId - The ID of the submission to retrieve
   * @returns {Promise} - Promise with submission data
   */
  async getSubmission(submissionId) {
    try {
      const url = `${this.baseUrl}/submissions/${submissionId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error retrieving submission:', error);
      throw error;
    }
  }

  /**
   * Get recent environmental data submissions
   * @param {number} limit - Maximum number of submissions to retrieve
   * @param {string} dataType - Optional filter by data type
   * @returns {Promise} - Promise with array of submissions
   */
  async getRecentSubmissions(limit = 10, dataType = null) {
    try {
      let url = `${this.baseUrl}/submissions/recent?limit=${limit}`;
      if (dataType) {
        url += `&dataType=${dataType}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error retrieving recent submissions:', error);
      throw error;
    }
  }

  /**
   * Submit attestation/validation for an environmental data submission
   * @param {Object} attestation - Attestation data
   * @returns {Promise} - Promise with attestation result
   */
  async submitAttestation(attestation) {
    try {
      const url = `${this.baseUrl}/attest`;
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attestation),
      };
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error submitting attestation:', error);
      throw error;
    }
  }

  /**
   * Get attestations for a specific submission
   * @param {string} submissionId - The ID of the submission
   * @returns {Promise} - Promise with array of attestations
   */
  async getAttestationsForSubmission(submissionId) {
    try {
      const url = `${this.baseUrl}/submissions/${submissionId}/attestations`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error retrieving attestations:', error);
      throw error;
    }
  }

  /**
   * Get rewards earned for a specific submission
   * @param {string} submissionId - The ID of the submission
   * @returns {Promise} - Promise with array of rewards
   */
  async getRewardsForSubmission(submissionId) {
    try {
      const url = `${this.baseUrl}/submissions/${submissionId}/rewards`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error retrieving rewards:', error);
      throw error;
    }
  }

  /**
   * Get user's PoP statistics and participation metrics
   * @param {string} userId - The user ID to get statistics for
   * @returns {Promise} - Promise with user statistics
   */
  async getUserPopStatistics(userId) {
    try {
      const url = `${this.baseUrl}/users/${userId}/statistics`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error retrieving user PoP statistics:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const popService = new PopService();

// Export both as default and named export for backward compatibility
export default popService;
export { popService };
