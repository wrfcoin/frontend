/**
 * Bridge Service - TypeScript Implementation
 * Handles cross-chain bridge functionality
 *
 * Real API integration - no mock fallbacks
 */

import { API_BASE_URL } from './config';

/**
 * Custom error class for bridge operations
 */
export class BridgeError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'BridgeError';
  }
}

// Types
interface SupportedChain {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  type: 'native' | 'evm' | 'solana' | 'cosmos';
  rpc_url: string;
  explorer_url: string;
}

interface SupportedToken {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  isNative: boolean;
  isStablecoin: boolean;
  icon: string;
  chains?: string[];
}

interface BridgeTransaction {
  id: string;
  from_chain: string;
  to_chain: string;
  sender_address: string;
  recipient_address: string;
  amount: string;
  asset: string;
  status: 'pending' | 'confirmed' | 'failed' | 'initiated';
  timestamp: number;
  tx_hash?: string;
  external_tx_hash?: string;
  fee?: string;
  provider?: string;
  estimated_time?: string;
}

interface CreateTransactionParams {
  wrfAddress: string;
  externalAddress: string;
  amount: string;
  chain: string;
  asset?: string;
  provider?: string;
  fee?: string;
  externalTxHash?: string;
}

interface TransactionQueryOptions {
  limit?: number;
  fromChain?: string;
  toChain?: string;
}

interface VerifyMessageParams {
  message: string;
  signature: string;
  chain: string;
}

interface BridgeResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  tx_id?: string;
  status?: string;
  estimated_time?: string;
  provider?: string;
}

export type CapabilityMode =
  | 'unavailable'
  | 'simulated'
  | 'local-manager'
  | 'production-verified'
  | 'degraded';

export interface CapabilityReadiness {
  capabilityId: string;
  mode: CapabilityMode;
  reason: string;
  reasonCode: string;
  updatedAt: string;
  signals: Record<string, unknown>;
}

export interface BridgeCapabilityReadinessResponse {
  success: boolean;
  generatedAt: string;
  overallMode: CapabilityMode;
  modes: CapabilityMode[];
  capabilities: Record<string, CapabilityReadiness>;
}

/**
 * Available bridge chains
 */
export const BRIDGE_CHAINS = {
  WRFCOIN: 'wrfcoin',
  ETHEREUM: 'ethereum',
  POLYGON: 'polygon',
  AVALANCHE: 'avalanche',
  BNBCHAIN: 'bnbchain',
  ARBITRUM: 'arbitrum',
  OPTIMISM: 'optimism',
  BASE: 'base',
  ZKSYNC: 'zksync',
  SUI: 'sui',
  SOLANA: 'solana',
  CELESTIA: 'celestia',
  APTOS: 'aptos',
  COSMOS: 'cosmos',
  POLKADOT: 'polkadot',
} as const;

/**
 * Supported tokens information
 */
export const SUPPORTED_TOKENS: Record<string, SupportedToken> = {
  WRF: {
    id: 'WRF',
    name: 'Wrfcoin',
    symbol: 'WRF',
    decimals: 18,
    isNative: true,
    isStablecoin: false,
    icon: '⚡',
  },
  USDT: {
    id: 'USDT',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    isNative: false,
    isStablecoin: true,
    icon: '💵',
    chains: Object.values(BRIDGE_CHAINS),
  },
  USDC: {
    id: 'USDC',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    isNative: false,
    isStablecoin: true,
    icon: '💵',
    chains: Object.values(BRIDGE_CHAINS),
  },
};

/**
 * Bridge Service class
 * Provides cross-chain bridge functionality with real API integration
 */
class BridgeService {
  private get apiBaseUrl(): string {
    // Use cross-chain API endpoint - either from config or relative path
    return `${API_BASE_URL.replace('/api', '')}/api/cross-chain`;
  }

  /**
   * Get supported chains
   */
  async getSupportedChains(): Promise<SupportedChain[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/networks`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn(
        '[BridgeService] Failed to fetch chains from API, using default configuration:',
        error,
      );

      // Default fallback chains if API is unavailable
      // This allows the UI to render while backend services start up
      return [
        {
          id: BRIDGE_CHAINS.WRFCOIN,
          name: 'Wrfcoin',
          status: 'active',
          type: 'native',
          rpc_url: 'https://rpc.wrfcoin.network',
          explorer_url: 'https://explorer.wrfcoin.network',
        },
        {
          id: BRIDGE_CHAINS.ETHEREUM,
          name: 'Ethereum',
          status: 'active',
          type: 'evm',
          rpc_url: 'https://ethereum.rpc.wrfcoin.network',
          explorer_url: 'https://etherscan.io',
        },
        {
          id: BRIDGE_CHAINS.POLYGON,
          name: 'Polygon',
          status: 'active',
          type: 'evm',
          rpc_url: 'https://polygon.rpc.wrfcoin.network',
          explorer_url: 'https://polygonscan.com',
        },
        {
          id: BRIDGE_CHAINS.SOLANA,
          name: 'Solana',
          status: 'active',
          type: 'solana',
          rpc_url: 'https://solana.rpc.wrfcoin.network',
          explorer_url: 'https://explorer.solana.com',
        },
        {
          id: BRIDGE_CHAINS.AVALANCHE,
          name: 'Avalanche',
          status: 'active',
          type: 'evm',
          rpc_url: 'https://avalanche.rpc.wrfcoin.network',
          explorer_url: 'https://snowtrace.io',
        },
        {
          id: BRIDGE_CHAINS.BNBCHAIN,
          name: 'BNB Chain',
          status: 'active',
          type: 'evm',
          rpc_url: 'https://bnb.rpc.wrfcoin.network',
          explorer_url: 'https://bscscan.com',
        },
        {
          id: BRIDGE_CHAINS.BASE,
          name: 'Base',
          status: 'active',
          type: 'evm',
          rpc_url: 'https://base.rpc.wrfcoin.network',
          explorer_url: 'https://basescan.org',
        },
      ];
    }
  }

  /**
   * Get supported tokens
   */
  getSupportedTokens(): SupportedToken[] {
    return Object.values(SUPPORTED_TOKENS);
  }

  /**
   * Get recent bridge transactions
   */
  async getRecentTransactions(
    options: TransactionQueryOptions = {},
  ): Promise<BridgeTransaction[]> {
    const { limit = 10, fromChain, toChain } = options;

    try {
      let url = `${this.apiBaseUrl}/transactions?limit=${limit}`;
      if (fromChain) url += `&fromChain=${fromChain}`;
      if (toChain) url += `&toChain=${toChain}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching bridge transactions:', error);
      return [];
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(txId: string): Promise<BridgeTransaction> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/transactions/${txId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching transaction ${txId}:`, error);
      throw error;
    }
  }

  /**
   * Create outbound transaction (from Wrfcoin to external chain)
   */
  async createOutboundTransaction(
    params: CreateTransactionParams,
  ): Promise<BridgeResponse> {
    const {
      wrfAddress,
      externalAddress,
      amount,
      chain,
      asset = 'WRF',
      provider,
      fee,
    } = params;

    try {
      const response = await fetch(`${this.apiBaseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_chain: 'wrfcoin',
          to_chain: chain,
          sender_address: wrfAddress,
          recipient_address: externalAddress,
          amount: amount,
          asset: asset,
          provider: provider,
          fee: fee,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();
      return {
        success: true,
        ...data,
      };
    } catch (error) {
      console.error('Error creating outbound transaction:', error);
      throw new BridgeError(
        error instanceof Error
          ? error.message
          : 'Failed to create outbound transaction',
        undefined,
        'OUTBOUND_TX_FAILED',
      );
    }
  }

  /**
   * Create inbound transaction (from external chain to Wrfcoin)
   */
  async createInboundTransaction(
    params: CreateTransactionParams,
  ): Promise<BridgeResponse> {
    const {
      wrfAddress,
      externalAddress,
      amount,
      chain,
      externalTxHash,
      asset = 'WRF',
      provider,
      fee,
    } = params;

    try {
      const response = await fetch(`${this.apiBaseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_chain: chain,
          to_chain: 'wrfcoin',
          sender_address: externalAddress,
          recipient_address: wrfAddress,
          amount: amount,
          external_tx_hash: externalTxHash,
          asset: asset,
          provider: provider,
          fee: fee,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();
      return {
        success: true,
        ...data,
      };
    } catch (error) {
      console.error('Error creating inbound transaction:', error);
      throw new BridgeError(
        error instanceof Error
          ? error.message
          : 'Failed to create inbound transaction',
        undefined,
        'INBOUND_TX_FAILED',
      );
    }
  }

  /**
   * Verify message (for cross-chain message verification)
   */
  async verifyMessage(params: VerifyMessageParams): Promise<any> {
    const { message, signature, chain } = params;

    try {
      const response = await fetch(`${this.apiBaseUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          signature,
          chain,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error verifying message:', error);
      throw error;
    }
  }

  /**
   * Get network map data in SVG format
   */
  async getNetworkMapSvg(): Promise<string | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/map/svg`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const svgText = await response.text();
      return svgText;
    } catch (error) {
      console.error('Error fetching network map:', error);
      return null;
    }
  }

  /**
   * Get runtime bridge capability readiness and trust modes
   */
  async getCapabilityReadiness(): Promise<BridgeCapabilityReadinessResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/bridges/capabilities/readiness`,
      );
      if (!response.ok) {
        throw new BridgeError(
          `HTTP error! status: ${response.status}`,
          response.status,
          'CAPABILITY_READINESS_FETCH_FAILED',
        );
      }

      const data: BridgeCapabilityReadinessResponse = await response.json();
      if (!data.success) {
        throw new BridgeError(
          'Capability readiness request failed',
          response.status,
          'CAPABILITY_READINESS_UNSUCCESSFUL',
        );
      }

      return data;
    } catch (error) {
      if (error instanceof BridgeError) {
        throw error;
      }
      throw new BridgeError(
        error instanceof Error
          ? error.message
          : 'Failed to fetch bridge capability readiness',
        undefined,
        'CAPABILITY_READINESS_ERROR',
      );
    }
  }
}

// Export a singleton instance
const bridgeService = new BridgeService();
export default bridgeService;
