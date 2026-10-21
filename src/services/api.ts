/**
 * Optimized API Service - TypeScript Implementation
 *
 * This module provides functions for interacting with the Wrfcoin API
 * with smart caching, exponential backoff, and circuit breaker patterns.
 */

import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { API_BASE_URL, WEATHER_EARNINGS_API_URL } from './config';
import { createLogger } from '../utils/logger';

const log = createLogger('api');

// Types
interface APIResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
}

interface BlockchainStatus {
  // The production backend handler (server/routes/blockchain-routes.js:67)
  // emits `blockHeight`, not `height` — this type previously said `height`
  // and both consumers (FeeMarketDashboard, WeatherContributorHome) silently
  // read `undefined` for it in production. Caught by cross-provider review
  // on frontend#282.
  blockHeight: number;
  difficulty: string;
  totalSupply: string;
  circulating: string;
  networkHashRate: string;
  lastBlockTime: number;
}

interface Block {
  height: number;
  hash: string;
  previousHash: string;
  timestamp: number;
  transactions: Transaction[];
  merkleRoot: string;
  nonce: number;
}

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: string;
  fee: string;
  timestamp: number;
  confirmations: number;
  type: 'transfer' | 'reward' | 'contract';
}

interface WalletInfo {
  address: string;
  balance: string;
  transactions: number;
  nfts: number;
  stakingRewards: string;
}

interface MiningStats {
  hashRate: string;
  difficulty: string;
  blocksFound: number;
  efficiency: number;
  uptime: number;
  earnings: string;
}

interface PoolInfo {
  totalHashRate: string;
  miners: number;
  lastBlock: number;
  payout: string;
  fee: number;
}

interface MiningConfig {
  threads?: number;
  intensity?: number;
  pools?: string[];
}

interface NFTData {
  id: string;
  name: string;
  description: string;
  image?: string;
  attributes: Record<string, any>;
  computationalType: string;
  complexity: number;
  creator: string;
}

interface CacheItem<T> {
  data: T;
  expiry: number;
  isError: boolean;
}

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number | null;
}

// IoT Sensor types
export interface SensorPlatform {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'maintenance';
  coverage: string;
  specialization: string;
  data_types: string[];
  devices?: number;
  sensors?: number;
  hotspots?: number;
  stations?: number;
  gateways?: number;
  total_devices?: number;
}

export interface SensorData {
  id: string;
  platform: string;
  deviceId: string;
  timestamp: number;
  location: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  measurements: {
    [key: string]: {
      value: number;
      unit: string;
      quality?: number;
    };
  };
  metadata?: {
    [key: string]: any;
  };
}

export interface AggregatedSensorData {
  platform: string;
  location: string;
  timeRange: string;
  dataPoints: number;
  averages: {
    [key: string]: number;
  };
  trends: {
    [key: string]: 'up' | 'down' | 'stable';
  };
  lastUpdate: number;
}

export interface DeviceRegistration {
  deviceId: string;
  platform: string;
  deviceType: string;
  location: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  capabilities: string[];
  attestation?: {
    signature: string;
    publicKey: string;
    timestamp: number;
  };
  owner: string;
  status: 'pending' | 'verified' | 'rejected';
}

export interface IoTMetrics {
  totalNetworks: number;
  activeNetworks: number;
  totalDevices: number;
  globalCoverage: boolean;
  networkUptime: string;
  avgLatency: string;
}

// Weather Earnings types
export interface WeatherStation {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    timezone: string;
  };
  owner: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  hardwareType: string;
  registrationDate: number;
  lastDataUpdate: number;
  totalDataPoints: number;
  accuracyScore: number;
  reliabilityScore: number;
  earnings: {
    total: string;
    totalUSD: string;
    monthly: string;
    monthlyUSD: string;
    weekly: string;
    weeklyUSD: string;
    daily: string;
    dailyUSD: string;
  };
  performance: {
    uptime: number;
    dataQuality: number;
    responseTime: number;
    calibrationStatus: 'calibrated' | 'needs_calibration' | 'overdue';
    lastCalibration: number;
  };
  sensors: {
    temperature: boolean;
    humidity: boolean;
    pressure: boolean;
    windSpeed: boolean;
    windDirection: boolean;
    rainfall: boolean;
    solarRadiation: boolean;
    uvIndex: boolean;
    visibility: boolean;
    airQuality: boolean;
  };
}

interface EarningsData {
  stationId: string;
  timestamp: number;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  baseReward: string;
  accuracyBonus: string;
  uptimeBonus: string;
  dataQualityBonus: string;
  totalEarned: string;
  totalEarnedUSD: string;
  dataPointsSubmitted: number;
  accuracyScore: number;
  rewardRate: string;
  transactionHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
}

interface RewardTransaction {
  id: string;
  stationId: string;
  stationName: string;
  type:
    | 'base_reward'
    | 'accuracy_bonus'
    | 'uptime_bonus'
    | 'quality_bonus'
    | 'penalty';
  amount: string;
  amountUSD: string;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  description: string;
  metadata?: {
    period?: string;
    accuracyScore?: number;
    dataPoints?: number;
    uptime?: number;
  };
}

interface PayoutRequest {
  stationId: string;
  amount: string;
  destinationAddress: string;
  preferredToken: 'WRF' | 'USDC' | 'ETH';
  minimumAmount?: string;
  schedule?: 'immediate' | 'daily' | 'weekly' | 'monthly';
  gasPreference?: 'economy' | 'standard' | 'fast';
}

interface PayoutHistory {
  id: string;
  stationId: string;
  amount: string;
  amountUSD: string;
  token: string;
  destinationAddress: string;
  transactionHash: string;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  gasUsed?: string;
  gasPrice?: string;
  networkFee?: string;
  conversionRate?: string;
}

export interface EarningsOverview {
  totalStations: number;
  activeStations: number;
  totalEarnings: string;
  totalEarningsUSD: string;
  monthlyEarnings: string;
  monthlyEarningsUSD: string;
  weeklyEarnings: string;
  weeklyEarningsUSD: string;
  dailyEarnings: string;
  dailyEarningsUSD: string;
  pendingRewards: string;
  pendingRewardsUSD: string;
  averageAccuracy: number;
  averageUptime: number;
  topPerformingStation: {
    id: string;
    name: string;
    earnings: string;
    accuracyScore: number;
  };
  recentPayouts: PayoutHistory[];
  projectedMonthlyEarnings: string;
  projectedMonthlyEarningsUSD: string;
}

// Performance Dashboard API (port 4000 - main server)
const getProtocol = (): string =>
  typeof window !== 'undefined' ? window.location.protocol : 'http:';

const getPerformanceURL = (): string => {
  const protocol = getProtocol();
  const host =
    typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  if (host.includes('replit.dev')) {
    return `${protocol}//${host}/api`;
  }

  return `${protocol}//${host}:4000/api`;
};

// Fix for HTTP 426 Upgrade Required errors
const defaultHeaders = {
  Connection: 'keep-alive',
  'User-Agent': 'Wrfcoin-Dashboard/1.0',
  Accept: 'application/json, text/plain, */*',
  'Cache-Control': 'no-cache',
};

// Simple and reliable API base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Performance Dashboard API client (port 4002)
const performanceApi = axios.create({
  baseURL: getPerformanceURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cache implementation
class APICache {
  private cache = new Map<string, CacheItem<any>>();
  private maxAge = 30000; // 30 seconds default cache
  private shortCache = 5000; // 5 seconds for failed requests

  set<T>(key: string, data: T, isError = false): void {
    const expiry = Date.now() + (isError ? this.shortCache : this.maxAge);
    this.cache.set(key, { data, expiry, isError });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Circuit breaker implementation
class CircuitBreaker {
  private failureThreshold: number;
  private timeout: number;
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(threshold = 5, timeout = 60000) {
    this.failureThreshold = threshold;
    this.timeout = timeout;
  }

  async call<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (
        this.lastFailureTime &&
        Date.now() - this.lastFailureTime > this.timeout
      ) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

// Global instances
const cache = new APICache();
const circuitBreaker = new CircuitBreaker();

// Enhanced request wrapper with caching and retry logic
const makeRequest = async <T>(
  url: string,
  options: AxiosRequestConfig = {},
  cacheKey: string | null = null,
): Promise<T> => {
  // Check cache first
  if (cacheKey) {
    const cached = cache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  try {
    const result = await circuitBreaker.call(async () => {
      const response: AxiosResponse<T> = await api.request({ url, ...options });
      return response.data;
    });

    // Cache successful responses
    if (cacheKey) {
      cache.set(cacheKey, result, false);
    }

    return result;
  } catch (error: any) {
    // Cache error for short period to prevent immediate retries
    if (cacheKey && error.response?.status === 404) {
      cache.set(cacheKey, null, true);
    }

    // Don't log 404s excessively
    if (error.response?.status !== 404) {
      log.error(`API Error for ${url}:`, error.message);
    }

    throw error;
  }
};

// Blockchain API namespace
export const blockchainAPI = {
  /**
   * Get blockchain info
   */
  getInfo: async (): Promise<BlockchainStatus> => {
    return await makeRequest<BlockchainStatus>(
      '/blockchain/status',
      { method: 'GET' },
      'blockchain-status',
    );
  },

  /**
   * Get block by height or hash
   */
  getBlock: async (blockId: string | number): Promise<Block> => {
    try {
      const response = await api.get<Block>(`/blockchain/block/${blockId}`);
      return response.data;
    } catch (error) {
      log.error(`Error fetching block ${blockId}:`, error);
      throw error;
    }
  },

  /**
   * Get recent transactions
   */
  getRecentTransactions: async (
    options: Record<string, any> = {},
  ): Promise<Transaction[]> => {
    try {
      const response = await api.get<Transaction[]>(
        '/blockchain/transactions',
        { params: options },
      );
      return response.data;
    } catch (error) {
      log.error('Error fetching recent transactions:', error);
      throw error;
    }
  },
};

// Wallet API namespace
export const walletAPI = {
  /**
   * Get wallet information
   */
  getWallet: async (address: string): Promise<WalletInfo> => {
    try {
      const response = await api.get<WalletInfo>(`/wallet/${address}`);
      return response.data;
    } catch (error) {
      log.error(`Error fetching wallet info for ${address}:`, error);
      throw error;
    }
  },

  /**
   * Get wallet transactions
   */
  getTransactions: async (
    address: string,
    options: Record<string, any> = {},
  ): Promise<Transaction[]> => {
    try {
      const response = await api.get<Transaction[]>(
        `/wallet/${address}/transactions`,
        { params: options },
      );
      return response.data;
    } catch (error) {
      log.error(`Error fetching transactions for ${address}:`, error);
      throw error;
    }
  },
};

// Mining API namespace
export const miningAPI = {
  /**
   * Get mining node statistics
   */
  getNodeStats: async (): Promise<MiningStats> => {
    try {
      const response = await api.get<MiningStats>('/mining/node-stats');
      return response.data;
    } catch (error) {
      log.error('Error fetching mining stats:', error);
      throw error;
    }
  },

  /**
   * Get mining pool information
   */
  getPoolInfo: async (): Promise<PoolInfo> => {
    try {
      const response = await api.get<PoolInfo>('/mining/pool-info');
      return response.data;
    } catch (error) {
      log.error('Error fetching pool info:', error);
      throw error;
    }
  },

  /**
   * Start mining operation
   */
  startMining: async (config: MiningConfig): Promise<APIResponse> => {
    try {
      const response = await api.post<APIResponse>('/mining/start', config);
      return response.data;
    } catch (error) {
      log.error('Error starting mining operation:', error);
      throw error;
    }
  },

  /**
   * Stop mining operation
   */
  stopMining: async (): Promise<APIResponse> => {
    try {
      const response = await api.post<APIResponse>('/mining/stop');
      return response.data;
    } catch (error) {
      log.error('Error stopping mining operation:', error);
      throw error;
    }
  },

  /**
   * Get miner achievements
   */
  getAchievements: async (minerId: string | null = null): Promise<any[]> => {
    try {
      const url = minerId
        ? `/mining/achievements/${minerId}`
        : '/mining/achievements';
      const response = await api.get<any[]>(url);
      return response.data;
    } catch (error) {
      log.error('Error fetching miner achievements:', error);
      throw error;
    }
  },

  /**
   * Get cross-chain rewards information
   */
  getCrossChainRewards: async (minerId: string | null = null): Promise<any> => {
    const url = minerId
      ? `/mining/cross-chain-rewards/${minerId}`
      : '/mining/cross-chain-rewards';
    const cacheKey = `cross-chain-rewards-${minerId || 'default'}`;
    return await makeRequest(url, { method: 'GET' }, cacheKey);
  },

  /**
   * Get mining hardware information
   */
  getHardwareInfo: async (): Promise<any> => {
    try {
      const response = await api.get('/mining/hardware');
      return response.data;
    } catch (error) {
      log.error('Error fetching mining hardware info:', error);
      throw error;
    }
  },
};

// NFT API namespace
export const nftAPI = {
  /**
   * Create a new computational NFT
   */
  createNFT: async (nftData: Partial<NFTData>): Promise<NFTData> => {
    try {
      const response = await api.post<NFTData>('/nft/create', nftData);
      return response.data;
    } catch (error) {
      log.error('Error creating NFT:', error);
      throw error;
    }
  },

  /**
   * Get all NFTs in the marketplace
   */
  getMarketplace: async (): Promise<NFTData[]> => {
    try {
      const response = await api.get<NFTData[]>('/nft/marketplace');
      return response.data;
    } catch (error) {
      log.error('Error fetching NFT marketplace:', error);
      throw error;
    }
  },

  /**
   * Get NFTs owned by a user
   */
  getUserNFTs: async (address: string): Promise<NFTData[]> => {
    try {
      const response = await api.get<NFTData[]>(`/nft/user/${address}`);
      return response.data;
    } catch (error) {
      log.error(`Error fetching NFTs for user ${address}:`, error);
      throw error;
    }
  },

  /**
   * Get NFT details by ID
   */
  getNFTById: async (nftId: string): Promise<NFTData> => {
    try {
      const response = await api.get<NFTData>(`/nft/${nftId}`);
      return response.data;
    } catch (error) {
      log.error(`Error fetching NFT ${nftId}:`, error);
      throw error;
    }
  },

  /**
   * Execute NFT computational workflow
   */
  executeWorkflow: async (
    nftId: string,
    params: Record<string, any>,
  ): Promise<any> => {
    try {
      const response = await api.post(`/nft/${nftId}/execute`, params);
      return response.data;
    } catch (error) {
      log.error(`Error executing NFT workflow ${nftId}:`, error);
      throw error;
    }
  },
};

// Documentation API namespace
export const documentationAPI = {
  /**
   * Get list of available documentation
   */
  getList: async (): Promise<any[]> => {
    return await makeRequest(
      '/documentation/list',
      { method: 'GET' },
      'documentation-list',
    );
  },

  /**
   * Get documentation by ID
   */
  getById: async (docId: string): Promise<any> => {
    return await makeRequest(
      `/documentation/${docId}`,
      { method: 'GET' },
      `documentation-${docId}`,
    );
  },
};

// Legacy support for direct function exports
export const getBlockchainStatus = blockchainAPI.getInfo;
export const getWalletInfo = walletAPI.getWallet;
export const getTransactions = walletAPI.getTransactions;
export const getMiningStats = miningAPI.getNodeStats;
export const getPoolInfo = miningAPI.getPoolInfo;
export const startMining = miningAPI.startMining;
export const stopMining = miningAPI.stopMining;
export const getMinerAchievements = miningAPI.getAchievements;
export const getCrossChainRewards = miningAPI.getCrossChainRewards;
export const getMiningHardware = miningAPI.getHardwareInfo;

// Export fetchAPI for backward compatibility
export const fetchAPI = async (
  endpoint: string,
  options: AxiosRequestConfig = {},
): Promise<any> => {
  const cacheKey = `${endpoint}-${JSON.stringify(options)}`;
  return await makeRequest(endpoint, options, cacheKey);
};

// Sensor API namespace
export const sensorAPI = {
  /**
   * Get all IoT sensor platforms
   */
  getPlatforms: async (): Promise<SensorPlatform[]> => {
    try {
      const response = await api.get<{ networks: SensorPlatform[] }>(
        '/iot/networks',
      );
      return response.data.networks || [];
    } catch (error) {
      log.error('Error fetching sensor platforms:', error);
      throw error;
    }
  },

  /**
   * Get specific platform information
   */
  getPlatform: async (platformId: string): Promise<SensorPlatform> => {
    try {
      const response = await api.get<{ success: boolean; network: SensorPlatform }>(
        `/iot/networks/${platformId}`,
      );
      return response.data.network;
    } catch (error) {
      log.error(`Error fetching platform ${platformId}:`, error);
      throw error;
    }
  },

  /**
   * Get IoT metrics overview
   */
  getMetrics: async (): Promise<IoTMetrics> => {
    try {
      const response = await api.get<{
        success: boolean;
        metrics: {
          total_networks: number;
          active_networks: number;
          total_devices: number;
          global_coverage: boolean;
          network_uptime: string;
          avg_latency: string;
        };
      }>('/iot/metrics');
      const m = response.data.metrics;
      return {
        totalNetworks: m.total_networks,
        activeNetworks: m.active_networks,
        totalDevices: m.total_devices,
        globalCoverage: m.global_coverage,
        networkUptime: m.network_uptime,
        avgLatency: m.avg_latency,
      };
    } catch (error) {
      log.error('Error fetching IoT metrics:', error);
      throw error;
    }
  },

  /**
   * Get sensor data stream for a location
   */
  getDataStream: async (location: string): Promise<SensorData[]> => {
    try {
      const response = await api.get<SensorData[]>(
        `/sensors/stream/${location}`,
      );
      return response.data;
    } catch (error) {
      log.error(`Error fetching data stream for ${location}:`, error);
      throw error;
    }
  },

  /**
   * Aggregate sensor data
   */
  aggregateData: async (params: {
    platforms?: string[];
    location?: string;
    timeRange?: string;
    dataTypes?: string[];
  }): Promise<AggregatedSensorData[]> => {
    try {
      const response = await api.post<AggregatedSensorData[]>(
        '/sensors/aggregate-data',
        params,
      );
      return response.data;
    } catch (error) {
      log.error('Error aggregating sensor data:', error);
      throw error;
    }
  },

  /**
   * Register a new IoT device
   */
  registerDevice: async (
    deviceData: Omit<DeviceRegistration, 'status'>,
  ): Promise<DeviceRegistration> => {
    try {
      const response = await api.post<DeviceRegistration>(
        '/sensors/register-device',
        deviceData,
      );
      return response.data;
    } catch (error) {
      log.error('Error registering device:', error);
      throw error;
    }
  },

  /**
   * Submit IoTeX sensor data
   */
  submitIoTeXData: async (data: {
    deviceId: string;
    measurements: any;
    location: { latitude: number; longitude: number };
    timestamp?: number;
  }): Promise<APIResponse> => {
    try {
      const response = await api.post<APIResponse>(
        '/sensors/iotex/submit',
        data,
      );
      return response.data;
    } catch (error) {
      log.error('Error submitting IoTeX data:', error);
      throw error;
    }
  },

  /**
   * Register Helium device
   */
  registerHeliumDevice: async (deviceData: {
    deviceId: string;
    hotspotId: string;
    location: { latitude: number; longitude: number };
    deviceType: string;
  }): Promise<APIResponse> => {
    try {
      const response = await api.post<APIResponse>(
        '/sensors/helium/register',
        deviceData,
      );
      return response.data;
    } catch (error) {
      log.error('Error registering Helium device:', error);
      throw error;
    }
  },
};

// Weather Earnings API namespace (proxy-aware dedicated route)
export const weatherEarningsAPI = {
  /**
   * Get weather earnings API base URL
   */
  getBaseURL: (): string => {
    return WEATHER_EARNINGS_API_URL;
  },

  /**
   * Create weather earnings API client
   */
  createClient: () => {
    return axios.create({
      baseURL: weatherEarningsAPI.getBaseURL(),
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  /**
   * Get earnings overview for all stations
   */
  getEarningsOverview: async (): Promise<EarningsOverview> => {
    try {
      const client = weatherEarningsAPI.createClient();
      const response = await client.get<EarningsOverview>('/earnings/overview');
      return response.data;
    } catch (error) {
      log.error('Error fetching earnings overview:', error);
      throw error;
    }
  },

  /**
   * Get all weather stations for a user
   */
  getWeatherStations: async (
    ownerAddress?: string,
  ): Promise<WeatherStation[]> => {
    try {
      const client = weatherEarningsAPI.createClient();
      const url = ownerAddress
        ? `/stations?owner=${ownerAddress}`
        : '/stations';
      const response = await client.get<WeatherStation[]>(url);
      return response.data;
    } catch (error) {
      log.error('Error fetching weather stations:', error);
      throw error;
    }
  },

  /**
   * Get specific weather station details
   */
  getWeatherStation: async (stationId: string): Promise<WeatherStation> => {
    try {
      const client = weatherEarningsAPI.createClient();
      const response = await client.get<WeatherStation>(
        `/stations/${stationId}`,
      );
      return response.data;
    } catch (error) {
      log.error(`Error fetching weather station ${stationId}:`, error);
      throw error;
    }
  },

  /**
   * Get earnings data for a specific station
   */
  getStationEarnings: async (
    stationId: string,
    options: {
      period?: 'hourly' | 'daily' | 'weekly' | 'monthly';
      startDate?: number;
      endDate?: number;
      limit?: number;
    } = {},
  ): Promise<EarningsData[]> => {
    try {
      const client = weatherEarningsAPI.createClient();
      const response = await client.get<EarningsData[]>(
        `/stations/${stationId}/earnings`,
        {
          params: options,
        },
      );
      return response.data;
    } catch (error) {
      log.error(`Error fetching earnings for station ${stationId}:`, error);
      throw error;
    }
  },

  /**
   * Get reward transaction history
   */
  getRewardHistory: async (
    options: {
      stationId?: string;
      type?: string;
      startDate?: number;
      endDate?: number;
      status?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ transactions: RewardTransaction[]; total: number }> => {
    try {
      const client = weatherEarningsAPI.createClient();
      const response = await client.get<{
        transactions: RewardTransaction[];
        total: number;
      }>('/rewards/history', {
        params: options,
      });
      return response.data;
    } catch (error) {
      log.error('Error fetching reward history:', error);
      throw error;
    }
  },

  /**
   * Request a payout
   */
  requestPayout: async (
    payoutRequest: PayoutRequest,
  ): Promise<APIResponse<{ requestId: string }>> => {
    try {
      const client = weatherEarningsAPI.createClient();
      const response = await client.post<APIResponse<{ requestId: string }>>(
        '/payouts/request',
        payoutRequest,
      );
      return response.data;
    } catch (error) {
      log.error('Error requesting payout:', error);
      throw error;
    }
  },

  /**
   * Get payout history
   */
  getPayoutHistory: async (
    options: {
      stationId?: string;
      status?: string;
      startDate?: number;
      endDate?: number;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ payouts: PayoutHistory[]; total: number }> => {
    try {
      const client = weatherEarningsAPI.createClient();
      const response = await client.get<{
        payouts: PayoutHistory[];
        total: number;
      }>('/payouts/history', {
        params: options,
      });
      return response.data;
    } catch (error) {
      log.error('Error fetching payout history:', error);
      throw error;
    }
  },

  /**
   * Get earnings calculator data
   */
  getEarningsCalculator: async (params: {
    location?: { lat: number; lng: number };
    hardwareType?: string;
    sensorTypes?: string[];
    historicalDays?: number;
  }): Promise<{
    estimatedDailyEarnings: string;
    estimatedMonthlyEarnings: string;
    estimatedYearlyEarnings: string;
    factors: {
      baseRate: string;
      locationMultiplier: number;
      hardwareMultiplier: number;
      sensorMultiplier: number;
      seasonalMultiplier: number;
    };
    projections: Array<{
      period: string;
      earnings: string;
      confidence: number;
    }>;
  }> => {
    try {
      const client = weatherEarningsAPI.createClient();
      const response = await client.post('/calculator/estimate', params);
      return response.data;
    } catch (error) {
      log.error('Error fetching earnings calculator data:', error);
      throw error;
    }
  },

  /**
   * Get real-time earnings feed
   */
  getRealtimeEarnings: async (
    stationIds: string[],
  ): Promise<{
    [stationId: string]: {
      currentRate: string;
      todayEarnings: string;
      lastUpdate: number;
      status: string;
    };
  }> => {
    try {
      const client = weatherEarningsAPI.createClient();
      const response = await client.post('/earnings/realtime', { stationIds });
      return response.data;
    } catch (error) {
      log.error('Error fetching realtime earnings:', error);
      throw error;
    }
  },

  /**
   * Export earnings data
   */
  exportEarningsData: async (options: {
    stationIds?: string[];
    startDate: number;
    endDate: number;
    format: 'csv' | 'json' | 'xlsx';
    includeMetadata?: boolean;
  }): Promise<Blob> => {
    try {
      const client = weatherEarningsAPI.createClient();
      const response = await client.post('/earnings/export', options, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      log.error('Error exporting earnings data:', error);
      throw error;
    }
  },
};

// Carbon Credits API namespace
export const carbonAPI = {
  /**
   * Get carbon credits API base URL
   */
  getBaseURL: (): string => {
    const protocol = getProtocol();
    const host =
      typeof window !== 'undefined' ? window.location.hostname : 'localhost';

    if (host.includes('replit.dev')) {
      return `${protocol}//${host}/api/carbon`;
    }

    return `${protocol}//${host}:4001/api/carbon`;
  },

  /**
   * Create carbon credits API client
   */
  createClient: () => {
    return axios.create({
      baseURL: carbonAPI.getBaseURL(),
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Marketplace Operations
  /**
   * Get marketplace overview statistics
   */
  getMarketplaceStats: async (): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.get('/marketplace/stats');
      return response.data;
    } catch (error) {
      log.error('Error fetching marketplace stats:', error);
      throw error;
    }
  },

  /**
   * Search and filter carbon credits
   */
  searchCredits: async (searchOptions: any): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.post('/marketplace/search', searchOptions);
      return response.data;
    } catch (error) {
      log.error('Error searching carbon credits:', error);
      throw error;
    }
  },

  /**
   * Get marketplace listings
   */
  getMarketplace: async (): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.get('/marketplace');
      return response.data;
    } catch (error) {
      log.error('Error fetching marketplace listings:', error);
      throw error;
    }
  },

  /**
   * Get market statistics (alias for getMarketplaceStats)
   */
  getMarketStats: async (): Promise<any> => {
    return carbonAPI.getMarketplaceStats();
  },

  /**
   * Get available filter options for the marketplace
   */
  getAvailableFilters: async (): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.get('/marketplace/filters');
      return response.data;
    } catch (error) {
      log.error('Error fetching available filters:', error);
      throw error;
    }
  },

  /**
   * Get detailed information about a specific carbon credit
   */
  getCreditDetails: async (creditId: string): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.get(`/credits/${creditId}`);
      return response.data;
    } catch (error) {
      log.error(`Error fetching credit details for ${creditId}:`, error);
      throw error;
    }
  },

  /**
   * Get project information for a carbon credit
   */
  getProjectDetails: async (projectId: string): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      log.error(`Error fetching project details for ${projectId}:`, error);
      throw error;
    }
  },

  /**
   * Get real-time price updates for carbon credits
   */
  getPriceUpdates: async (creditIds: string[]): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.post('/marketplace/prices', { creditIds });
      return response.data;
    } catch (error) {
      log.error('Error fetching price updates:', error);
      throw error;
    }
  },

  // Purchase Operations
  /**
   * Create a new purchase order
   */
  createPurchaseOrder: async (orderData: any): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.post('/purchase/orders', orderData);
      return response.data;
    } catch (error) {
      log.error('Error creating purchase order:', error);
      throw error;
    }
  },

  /**
   * Get purchase order details
   */
  getOrderDetails: async (orderId: string): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.get(`/purchase/orders/${orderId}`);
      return response.data;
    } catch (error) {
      log.error(`Error fetching order details for ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Process payment for an order
   */
  processPayment: async (orderId: string, paymentData: any): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.post(
        `/purchase/orders/${orderId}/payment`,
        paymentData,
      );
      return response.data;
    } catch (error) {
      log.error(`Error processing payment for order ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Confirm order completion
   */
  confirmOrder: async (orderId: string): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.post(`/purchase/orders/${orderId}/confirm`);
      return response.data;
    } catch (error) {
      log.error(`Error confirming order ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Cancel an order
   */
  cancelOrder: async (orderId: string, reason?: string): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.post(`/purchase/orders/${orderId}/cancel`, {
        reason,
      });
      return response.data;
    } catch (error) {
      log.error(`Error cancelling order ${orderId}:`, error);
      throw error;
    }
  },

  // Portfolio and Retirement Operations
  /**
   * Get user's carbon credit portfolio
   */
  getPortfolio: async (userId: string): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.get(`/portfolio/${userId}`);
      return response.data;
    } catch (error) {
      log.error(`Error fetching portfolio for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Retire carbon credits
   */
  retireCredits: async (retirementData: any): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.post('/portfolio/retire', retirementData);
      return response.data;
    } catch (error) {
      log.error('Error retiring carbon credits:', error);
      throw error;
    }
  },

  /**
   * Get retirement history
   */
  getRetirementHistory: async (
    userId: string,
    options: any = {},
  ): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.get(`/portfolio/${userId}/retirements`, {
        params: options,
      });
      return response.data;
    } catch (error) {
      log.error(
        `Error fetching retirement history for user ${userId}:`,
        error,
      );
      throw error;
    }
  },

  /**
   * Get retirement certificate
   */
  getCertificate: async (retirementId: string): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.get(`/certificates/${retirementId}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      log.error(
        `Error fetching certificate for retirement ${retirementId}:`,
        error,
      );
      throw error;
    }
  },

  // Impact Calculation Operations
  /**
   * Calculate carbon footprint from user inputs
   */
  calculateFootprint: async (footprintInput: any): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.post('/impact/calculate', footprintInput);
      return response.data;
    } catch (error) {
      log.error('Error calculating carbon footprint:', error);
      throw error;
    }
  },

  /**
   * Get impact metrics for carbon credits
   */
  getImpactMetrics: async (creditIds: string[]): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.post('/impact/metrics', { creditIds });
      return response.data;
    } catch (error) {
      log.error('Error fetching impact metrics:', error);
      throw error;
    }
  },

  /**
   * Get equivalent impact comparisons
   */
  getImpactEquivalents: async (co2Amount: number): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.get(`/impact/equivalents?co2=${co2Amount}`);
      return response.data;
    } catch (error) {
      log.error(
        `Error fetching impact equivalents for ${co2Amount}kg CO2:`,
        error,
      );
      throw error;
    }
  },

  /**
   * Get carbon footprint benchmarks
   */
  getBenchmarks: async (location?: string): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const params = location ? { location } : {};
      const response = await client.get('/impact/benchmarks', { params });
      return response.data;
    } catch (error) {
      log.error('Error fetching carbon footprint benchmarks:', error);
      throw error;
    }
  },

  // Price Alerts and Notifications
  /**
   * Create price alert
   */
  createPriceAlert: async (alertData: any): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.post('/alerts/price', alertData);
      return response.data;
    } catch (error) {
      log.error('Error creating price alert:', error);
      throw error;
    }
  },

  /**
   * Get user's price alerts
   */
  getPriceAlerts: async (userId: string): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.get(`/alerts/price/${userId}`);
      return response.data;
    } catch (error) {
      log.error(`Error fetching price alerts for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Delete price alert
   */
  deletePriceAlert: async (alertId: string): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.delete(`/alerts/price/${alertId}`);
      return response.data;
    } catch (error) {
      log.error(`Error deleting price alert ${alertId}:`, error);
      throw error;
    }
  },

  // Market Analysis and Trends
  /**
   * Get market trends and analysis
   */
  getMarketTrends: async (timeframe: string = '30d'): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.get(
        `/market/trends?timeframe=${timeframe}`,
      );
      return response.data;
    } catch (error) {
      log.error('Error fetching market trends:', error);
      throw error;
    }
  },

  /**
   * Get price history for carbon credits
   */
  getPriceHistory: async (
    creditId: string,
    timeframe: string = '30d',
  ): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.get(
        `/credits/${creditId}/price-history?timeframe=${timeframe}`,
      );
      return response.data;
    } catch (error) {
      log.error(
        `Error fetching price history for credit ${creditId}:`,
        error,
      );
      throw error;
    }
  },

  /**
   * Get market depth and liquidity information
   */
  getMarketDepth: async (creditId: string): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.get(`/market/depth/${creditId}`);
      return response.data;
    } catch (error) {
      log.error(
        `Error fetching market depth for credit ${creditId}:`,
        error,
      );
      throw error;
    }
  },

  // User Preferences and Settings
  /**
   * Get user marketplace preferences
   */
  getUserPreferences: async (userId: string): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.get(`/users/${userId}/preferences`);
      return response.data;
    } catch (error) {
      log.error(`Error fetching preferences for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Update user marketplace preferences
   */
  updateUserPreferences: async (
    userId: string,
    preferences: any,
  ): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.put(
        `/users/${userId}/preferences`,
        preferences,
      );
      return response.data;
    } catch (error) {
      log.error(`Error updating preferences for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Add credits to favorites
   */
  addToFavorites: async (userId: string, creditId: string): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.post(`/users/${userId}/favorites`, {
        creditId,
      });
      return response.data;
    } catch (error) {
      log.error(`Error adding credit ${creditId} to favorites:`, error);
      throw error;
    }
  },

  /**
   * Remove credits from favorites
   */
  removeFromFavorites: async (
    userId: string,
    creditId: string,
  ): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.delete(
        `/users/${userId}/favorites/${creditId}`,
      );
      return response.data;
    } catch (error) {
      log.error(`Error removing credit ${creditId} from favorites:`, error);
      throw error;
    }
  },

  /**
   * Get user's favorite credits
   */
  getFavorites: async (userId: string): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.get(`/users/${userId}/favorites`);
      return response.data;
    } catch (error) {
      log.error(`Error fetching favorites for user ${userId}:`, error);
      throw error;
    }
  },

  // Export and Reporting
  /**
   * Export portfolio data
   */
  exportPortfolio: async (
    userId: string,
    format: string = 'csv',
  ): Promise<Blob> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.get(
        `/portfolio/${userId}/export?format=${format}`,
        {
          responseType: 'blob',
        },
      );
      return response.data;
    } catch (error) {
      log.error(`Error exporting portfolio for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Generate impact report
   */
  generateImpactReport: async (
    userId: string,
    options: any = {},
  ): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.post(`/reports/impact/${userId}`, options);
      return response.data;
    } catch (error) {
      log.error(
        `Error generating impact report for user ${userId}:`,
        error,
      );
      throw error;
    }
  },

  /**
   * Get transaction history
   */
  getTransactionHistory: async (
    userId: string,
    options: any = {},
  ): Promise<any> => {
    try {
      const client = carbonAPI.createClient();
      const response = await client.get(`/users/${userId}/transactions`, {
        params: options,
      });
      return response.data;
    } catch (error) {
      log.error(
        `Error fetching transaction history for user ${userId}:`,
        error,
      );
      throw error;
    }
  },
};

// Export default API object with all namespaces
export default {
  blockchain: blockchainAPI,
  wallet: walletAPI,
  mining: miningAPI,
  nft: nftAPI,
  documentation: documentationAPI,
  sensor: sensorAPI,
  weatherEarnings: weatherEarningsAPI,
  carbon: carbonAPI,
};
