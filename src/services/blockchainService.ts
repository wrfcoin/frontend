/**
 * Blockchain Service
 *
 * Provides methods for interacting with the Wrfcoin blockchain,
 * including sharding and cross-chain operations.
 *
 * Uses standardized error handling with ApiError class.
 */

import { API_BASE_URL } from './config';
import { ApiError } from '../utils/apiError';

// Types
export interface BlockchainStatus {
  height: number;
  difficulty: number;
  hashrate: number;
  version: string;
  peers: number;
  pendingTransactions: number;
}

export interface Shard {
  id: number;
  status: string;
  nodeCount: number;
  blockHeight: number;
  hashrate: number;
}

export interface ShardMetrics {
  totalShards: number;
  activeShards: number;
  totalNodes: number;
  avgLatency: number;
  crossShardTPS: number;
  rebalanceEvents: number;
}

export interface VerificationStatus {
  totalVerified: number;
  pendingVerification: number;
  failedVerification: number;
  verificationRate: number;
}

export interface PrivacyStatus {
  zeroKnowledgeProofs: boolean;
  bulletproofs: boolean;
  ringSignatures: boolean;
  confidentialTransactions: boolean;
  stealthAddresses: boolean;
}

export interface WalletInfo {
  address: string;
  balance: number;
  transactions: unknown[];
}

export interface DashboardData {
  blockHeight: number;
  transactions: number;
  hashrate: number;
  avgBlockTime: number;
  difficulty: number;
  activeNodes: number;
}

export interface HierarchicalStructure {
  levels: unknown[];
  checkpoints: unknown[];
  structure: Record<string, unknown>;
}

export interface ShardBlock {
  hash: string;
  height: number;
  timestamp: string;
  transactions: number;
}

export interface ShardNode {
  id: string;
  address: string;
  status: string;
  latency: number;
}

export interface CrossShardTransaction {
  id: string;
  sourceShard: number;
  targetShard: number;
  amount: string;
  status: string;
  timestamp: string;
}

export interface QueryParams {
  limit?: number;
  status?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Helper function to handle API responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw await ApiError.fromResponse(response);
  }
  return await response.json();
}

/**
 * Get blockchain status information
 */
async function getBlockchainStatus(): Promise<BlockchainStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/blockchain/status`);
    return await handleResponse<BlockchainStatus>(response);
  } catch (error) {
    console.error('Error fetching blockchain status:', error);
    throw ApiError.fromError(error, 'Failed to fetch blockchain status');
  }
}

/**
 * Get information about shards
 */
async function getShards(): Promise<Shard[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/sharding/shards`);
    return await handleResponse<Shard[]>(response);
  } catch (error) {
    console.error('Error fetching shards:', error);
    throw ApiError.fromError(error, 'Failed to fetch shards');
  }
}

/**
 * Get detailed information about a specific shard
 */
async function getShardById(shardId: number): Promise<Shard> {
  try {
    const response = await fetch(`${API_BASE_URL}/sharding/shards/${shardId}`);
    return await handleResponse<Shard>(response);
  } catch (error) {
    console.error(`Error fetching shard ${shardId}:`, error);
    throw ApiError.fromError(error, `Failed to fetch shard ${shardId}`);
  }
}

/**
 * Get cross-shard transactions
 */
async function getCrossShardTransactions(
  params: QueryParams = {},
): Promise<CrossShardTransaction[]> {
  try {
    const filteredParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        filteredParams[key] = String(value);
      }
    }
    const queryParams = new URLSearchParams(filteredParams).toString();
    const url = queryParams
      ? `${API_BASE_URL}/sharding/transactions?${queryParams}`
      : `${API_BASE_URL}/sharding/transactions`;

    const response = await fetch(url);
    return await handleResponse<CrossShardTransaction[]>(response);
  } catch (error) {
    console.error('Error fetching cross-shard transactions:', error);
    throw ApiError.fromError(error, 'Failed to fetch cross-shard transactions');
  }
}

/**
 * Get shard metrics
 */
async function getShardMetrics(): Promise<ShardMetrics> {
  try {
    const response = await fetch(`${API_BASE_URL}/sharding/metrics`);
    return await handleResponse<ShardMetrics>(response);
  } catch (error) {
    console.error('Error fetching shard metrics:', error);
    throw ApiError.fromError(error, 'Failed to fetch shard metrics');
  }
}

/**
 * Get verification status of cross-shard transactions
 */
async function getVerificationStatus(): Promise<VerificationStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/sharding/verification`);
    return await handleResponse<VerificationStatus>(response);
  } catch (error) {
    console.error('Error fetching verification status:', error);
    throw ApiError.fromError(error, 'Failed to fetch verification status');
  }
}

/**
 * Get blocks from a specific shard
 */
async function getShardBlocks(
  shardId: number,
  params: QueryParams = {},
): Promise<ShardBlock[]> {
  try {
    const filteredParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        filteredParams[key] = String(value);
      }
    }
    const queryParams = new URLSearchParams(filteredParams).toString();
    const url = queryParams
      ? `${API_BASE_URL}/sharding/shards/${shardId}/blocks?${queryParams}`
      : `${API_BASE_URL}/sharding/shards/${shardId}/blocks`;

    const response = await fetch(url);
    return await handleResponse<ShardBlock[]>(response);
  } catch (error) {
    console.error(`Error fetching blocks for shard ${shardId}:`, error);
    throw ApiError.fromError(error, `Failed to fetch blocks for shard ${shardId}`);
  }
}

/**
 * Get nodes in a specific shard
 */
async function getShardNodes(shardId: number): Promise<ShardNode[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/sharding/shards/${shardId}/nodes`,
    );
    return await handleResponse<ShardNode[]>(response);
  } catch (error) {
    console.error(`Error fetching nodes for shard ${shardId}:`, error);
    throw ApiError.fromError(error, `Failed to fetch nodes for shard ${shardId}`);
  }
}

/**
 * Get privacy features status
 */
async function getPrivacyStatus(): Promise<PrivacyStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/privacy/status`);
    return await handleResponse<PrivacyStatus>(response);
  } catch (error) {
    console.error('Error fetching privacy status:', error);
    throw ApiError.fromError(error, 'Failed to fetch privacy status');
  }
}

/**
 * Get current wallet information
 */
async function getWallet(address: string): Promise<WalletInfo> {
  try {
    const response = await fetch(`${API_BASE_URL}/wallet/${address}`);
    return await handleResponse<WalletInfo>(response);
  } catch (error) {
    console.error(`Error fetching wallet ${address}:`, error);
    throw ApiError.fromError(error, `Failed to fetch wallet ${address}`);
  }
}

/**
 * Get dashboard data including blockchain metrics
 */
async function getDashboardData(): Promise<DashboardData> {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard`);
    return await handleResponse<DashboardData>(response);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw ApiError.fromError(error, 'Failed to fetch dashboard data');
  }
}

/**
 * Get information about hierarchical blockchain structure
 */
async function getHierarchicalStructure(): Promise<HierarchicalStructure> {
  try {
    const response = await fetch(`${API_BASE_URL}/blockchain/hierarchical`);
    return await handleResponse<HierarchicalStructure>(response);
  } catch (error) {
    console.error('Error fetching hierarchical structure:', error);
    throw ApiError.fromError(error, 'Failed to fetch hierarchical structure');
  }
}

export default {
  getBlockchainStatus,
  getShards,
  getShardById,
  getCrossShardTransactions,
  getShardMetrics,
  getVerificationStatus,
  getShardBlocks,
  getShardNodes,
  getPrivacyStatus,
  getWallet,
  getDashboardData,
  getHierarchicalStructure,
};
