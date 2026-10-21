/**
 * Service for interacting with the consensus mechanism API - TypeScript Implementation
 */

// Types
interface ConsensusSettings {
  mechanism: string;
  parameters: ConsensusParameters;
  /** Only ever shown when the API itself sends it (frontend#354). */
  blockTime?: unknown;
}

interface ConsensusParameters {
  minPublishers?: number;
  dataValidityThreshold?: number;
  reviewPeriod?: number;
  [key: string]: any;
}

interface ConsensusStatistics {
  totalSubmissions: number;
  validatedSubmissions: number;
  rejectedSubmissions: number;
  pendingSubmissions: number;
  averageValidationTime: number;
  activeValidators: number;
}

interface SwitchResponse {
  success: boolean;
  message: string;
  newMechanism: string;
}

interface UpdateResponse {
  success: boolean;
  message: string;
  updatedParameters: ConsensusParameters;
}

class ConsensusService {
  /**
   * Get current consensus settings from the API
   */
  async getCurrentConsensusSettings(): Promise<ConsensusSettings> {
    try {
      const response = await fetch('/api/consensus/settings');
      if (!response.ok) {
        throw new Error(
          `Failed to fetch consensus settings: ${response.status}`,
        );
      }
      return await response.json();
    } catch (error) {
      // frontend#354: surface the failure; never invent PoP settings.
      console.error('Error fetching consensus settings:', error);
      throw error;
    }
  }

  /**
   * Switch the active consensus mechanism
   */
  async switchConsensusMechanism(mechanism: string): Promise<SwitchResponse> {
    try {
      const response = await fetch('/api/consensus/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mechanism }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to switch consensus mechanism: ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error switching consensus mechanism:', error);
      throw error;
    }
  }

  /**
   * Update consensus parameters
   */
  async updateConsensusParameters(
    mechanism: string,
    parameters: ConsensusParameters,
  ): Promise<UpdateResponse> {
    try {
      const response = await fetch('/api/consensus/parameters', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mechanism, parameters }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to update consensus parameters: ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating consensus parameters:', error);
      throw error;
    }
  }

  /**
   * Get consensus statistics
   */
  async getConsensusStatistics(): Promise<ConsensusStatistics> {
    try {
      const response = await fetch('/api/consensus/statistics');
      if (!response.ok) {
        throw new Error(
          `Failed to fetch consensus statistics: ${response.status}`,
        );
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching consensus statistics:', error);

      // Return mock statistics if API fails
      return {
        totalSubmissions: 0,
        validatedSubmissions: 0,
        rejectedSubmissions: 0,
        pendingSubmissions: 0,
        averageValidationTime: 0,
        activeValidators: 0,
      };
    }
  }
}

export const consensusService = new ConsensusService();
export type {
  ConsensusSettings,
  ConsensusParameters,
  ConsensusStatistics,
};
export default consensusService;
