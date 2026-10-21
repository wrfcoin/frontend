/**
 * Akash Network Service
 *
 * Client-side service for interacting with the Akash Network integration.
 * Provides methods for deploying and managing containerized applications
 * on the decentralized Akash cloud computing marketplace.
 */

import { apiRequest } from './api';

/**
 * Get Akash Network status
 * @returns {Promise<Object>} Network status information
 */
export const getAkashNetworkStatus = async () => {
  try {
    const response = await apiRequest('/akash/status');
    return response;
  } catch (error) {
    console.error('Error fetching Akash Network status:', error);
    throw error;
  }
};

/**
 * Get available Akash providers
 * @returns {Promise<Object>} List of available providers
 */
export const getAkashProviders = async () => {
  try {
    const response = await apiRequest('/akash/providers');
    return response;
  } catch (error) {
    console.error('Error fetching Akash providers:', error);
    throw error;
  }
};

/**
 * Estimate deployment cost
 * @param {Object} resources Resource requirements
 * @returns {Promise<Object>} Cost estimate
 */
export const estimateDeploymentCost = async resources => {
  try {
    const response = await apiRequest('/akash/estimate-cost', {
      method: 'POST',
      body: JSON.stringify(resources),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error) {
    console.error('Error estimating Akash deployment cost:', error);
    throw error;
  }
};

/**
 * Generate a deployment manifest
 * @param {Object} options Deployment options
 * @returns {Promise<Object>} Deployment manifest
 */
export const generateDeploymentManifest = async options => {
  try {
    const response = await apiRequest('/akash/generate-manifest', {
      method: 'POST',
      body: JSON.stringify(options),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error) {
    console.error('Error generating Akash deployment manifest:', error);
    throw error;
  }
};

/**
 * Deploy an application to Akash Network
 * @param {Object} deploymentOptions Deployment configuration
 * @returns {Promise<Object>} Deployment result
 */
export const deployApplication = async deploymentOptions => {
  try {
    const response = await apiRequest('/akash/deploy', {
      method: 'POST',
      body: JSON.stringify(deploymentOptions),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error) {
    console.error('Error deploying to Akash Network:', error);
    throw error;
  }
};

/**
 * Get deployment status
 * @param {string} deploymentId Deployment ID
 * @returns {Promise<Object>} Deployment status
 */
export const getDeploymentStatus = async deploymentId => {
  try {
    const response = await apiRequest(`/akash/deployments/${deploymentId}`);
    return response;
  } catch (error) {
    console.error('Error fetching deployment status:', error);
    throw error;
  }
};

/**
 * Get deployment logs
 * @param {string} deploymentId Deployment ID
 * @param {Object} options Log retrieval options
 * @returns {Promise<Object>} Deployment logs
 */
export const getDeploymentLogs = async (deploymentId, options = {}) => {
  try {
    const { lines = 100, follow = false } = options;
    const queryParams = new URLSearchParams({
      lines,
      follow: follow.toString(),
    }).toString();

    const response = await apiRequest(
      `/akash/deployments/${deploymentId}/logs?${queryParams}`,
    );
    return response;
  } catch (error) {
    console.error('Error fetching deployment logs:', error);
    throw error;
  }
};

/**
 * Close a deployment
 * @param {string} deploymentId Deployment ID
 * @returns {Promise<Object>} Close operation result
 */
export const closeDeployment = async deploymentId => {
  try {
    const response = await apiRequest(`/akash/deployments/${deploymentId}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Error closing Akash deployment:', error);
    throw error;
  }
};

export default {
  getAkashNetworkStatus,
  getAkashProviders,
  estimateDeploymentCost,
  generateDeploymentManifest,
  deployApplication,
  getDeploymentStatus,
  getDeploymentLogs,
  closeDeployment,
};
