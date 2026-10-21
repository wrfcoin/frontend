/**
 * Cross-Chain Service
 *
 * Provides methods for interacting with cross-chain functionality,
 * including bridging, multi-chain operations, and network management.
 */

const API_BASE_URL = '/api';

// Types
interface Network {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  symbol: string;
  explorer: string;
  isTestnet: boolean;
}

interface Bridge {
  id: string;
  name: string;
  sourceChain: string;
  targetChain: string;
  supportedTokens: string[];
  fees: {
    fixed: number;
    percentage: number;
  };
  minAmount: number;
  maxAmount: number;
  estimatedTime: string;
}

interface CrossChainTransaction {
  id: string;
  sourceChain: string;
  targetChain: string;
  sourceHash: string;
  targetHash?: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'COMPLETED';
  amount: string;
  token: string;
  sender: string;
  recipient: string;
  timestamp: string;
  fee: string;
  estimatedCompletion?: string;
}

interface TransferParams {
  sourceChain: string;
  targetChain: string;
  token: string;
  amount: string;
  recipient: string;
  sender: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Cross-Chain Service Class
 */
class CrossChainService {
  /**
   * Get all supported networks
   */
  async getSupportedNetworks(): Promise<Network[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/cross-chain/networks`);
      const data: ApiResponse<Network[]> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch networks');
      }

      return data.data || [];
    } catch (error) {
      console.error('Error fetching supported networks:', error);
      throw error;
    }
  }

  /**
   * Get available bridges between networks
   */
  async getAvailableBridges(
    sourceChain?: string,
    targetChain?: string,
  ): Promise<Bridge[]> {
    try {
      const params = new URLSearchParams();
      if (sourceChain) params.append('source', sourceChain);
      if (targetChain) params.append('target', targetChain);

      const response = await fetch(
        `${API_BASE_URL}/cross-chain/bridges?${params}`,
      );
      const data: ApiResponse<Bridge[]> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch bridges');
      }

      return data.data || [];
    } catch (error) {
      console.error('Error fetching available bridges:', error);
      throw error;
    }
  }

  /**
   * Initiate a cross-chain transfer
   */
  async initiateTransfer(
    params: TransferParams,
  ): Promise<CrossChainTransaction> {
    try {
      const response = await fetch(`${API_BASE_URL}/cross-chain/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data: ApiResponse<CrossChainTransaction> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to initiate transfer');
      }

      return data.data!;
    } catch (error) {
      console.error('Error initiating cross-chain transfer:', error);
      throw error;
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(
    transactionId: string,
  ): Promise<CrossChainTransaction> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/cross-chain/transactions/${transactionId}`,
      );
      const data: ApiResponse<CrossChainTransaction> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch transaction status');
      }

      return data.data!;
    } catch (error) {
      console.error(
        `Error fetching transaction status for ${transactionId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get user's cross-chain transaction history
   */
  async getTransactionHistory(
    userAddress: string,
    limit: number = 50,
  ): Promise<CrossChainTransaction[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/cross-chain/transactions/history/${userAddress}?limit=${limit}`,
      );
      const data: ApiResponse<CrossChainTransaction[]> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch transaction history');
      }

      return data.data || [];
    } catch (error) {
      console.error(
        `Error fetching transaction history for ${userAddress}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get estimated fees for a cross-chain transfer
   */
  async getEstimatedFees(
    params: Omit<TransferParams, 'sender'>,
  ): Promise<{ fees: number; gasEstimate: number }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/cross-chain/estimate-fees`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        },
      );

      const data: ApiResponse<{ fees: number; gasEstimate: number }> =
        await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to estimate fees');
      }

      return data.data!;
    } catch (error) {
      console.error('Error estimating cross-chain fees:', error);
      throw error;
    }
  }

  /**
   * Get supported tokens for a network
   */
  async getSupportedTokens(networkId: string): Promise<string[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/cross-chain/networks/${networkId}/tokens`,
      );
      const data: ApiResponse<string[]> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch supported tokens');
      }

      return data.data || [];
    } catch (error) {
      console.error(`Error fetching supported tokens for ${networkId}:`, error);
      throw error;
    }
  }

  /**
   * Validate a cross-chain transfer before execution
   */
  async validateTransfer(
    params: TransferParams,
  ): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/cross-chain/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data: ApiResponse<{ valid: boolean; errors: string[] }> =
        await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to validate transfer');
      }

      return data.data!;
    } catch (error) {
      console.error('Error validating cross-chain transfer:', error);
      throw error;
    }
  }

  /**
   * Get network statistics
   */
  async getNetworkStats(): Promise<Record<string, any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/cross-chain/stats`);
      const data: ApiResponse<Record<string, any>> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch network stats');
      }

      return data.data || {};
    } catch (error) {
      console.error('Error fetching network statistics:', error);
      throw error;
    }
  }

  /**
   * Get bridge health status
   */
  async getBridgeHealth(): Promise<
    Record<string, 'healthy' | 'degraded' | 'offline'>
    > {
    try {
      const response = await fetch(`${API_BASE_URL}/cross-chain/bridge-health`);
      const data: ApiResponse<
        Record<string, 'healthy' | 'degraded' | 'offline'>
      > = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch bridge health');
      }

      return data.data || {};
    } catch (error) {
      console.error('Error fetching bridge health:', error);
      throw error;
    }
  }
}

export const crossChainService = new CrossChainService();

export type {
  Network,
  Bridge,
  CrossChainTransaction,
  TransferParams,
  ApiResponse,
};
