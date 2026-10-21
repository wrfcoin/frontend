/**
 * API Configuration - TypeScript Implementation
 *
 * Centralized configuration using Vite environment variables
 * All URLs should be configured here to avoid hardcoded values throughout the codebase
*/
import { resolveWsUrl } from '../utils/wsUrl.js';

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

// ============================================================================
// Environment Variable Configuration
// ============================================================================

/**
 * Base URL for API requests
 * Defaults to relative `/api` when no explicit env override is provided.
 */
export const API_BASE_URL: string =
  env.VITE_API_BASE_URL ||
  env.VITE_API_URL ||
  '/api';

/**
 * Weather earnings API URL
 * Defaults to the dedicated proxy route used by the frontend and backend.
 */
export const WEATHER_EARNINGS_API_URL: string =
  env.VITE_EARNINGS_API_BASE_URL ||
  env.VITE_WEATHER_API_BASE_URL ||
  `${API_BASE_URL}/weather-earnings`;

/**
 * WebSocket URL for real-time updates
 */
export const WS_URL: string =
  resolveWsUrl(env.VITE_WS_URL);

/**
 * Cross-chain bridge API URL
 */
export const CROSS_CHAIN_API_URL: string =
  env.VITE_CROSS_CHAIN_URL || `${API_BASE_URL}/cross-chain`;

/**
 * Wallet service API URL
 */
export const WALLET_API_URL: string =
  env.VITE_WALLET_URL || `${API_BASE_URL}/wallet`;

// ============================================================================
// Default Configuration Values
// ============================================================================

// Default pagination size for list requests
export const DEFAULT_PAGE_SIZE: number = 10;

// Default timeout for API requests (in milliseconds)
export const API_TIMEOUT: number = 10000;

// ============================================================================
// Configuration Interfaces
// ============================================================================

export interface ApiConfig {
  baseUrl: string;
  wsUrl: string;
  crossChainUrl: string;
  walletUrl: string;
  timeout: number;
  pageSize: number;
}

// Default configuration object
export const defaultConfig: ApiConfig = {
  baseUrl: API_BASE_URL,
  wsUrl: WS_URL,
  crossChainUrl: CROSS_CHAIN_API_URL,
  walletUrl: WALLET_API_URL,
  timeout: API_TIMEOUT,
  pageSize: DEFAULT_PAGE_SIZE,
};

// Environment-specific configurations
export const environments = {
  development: {
    baseUrl: '/api',
    wsUrl: `${typeof window !== 'undefined' ? resolveWsUrl(env.VITE_WS_URL) : '/ws'}`,
    crossChainUrl: '/api/cross-chain',
    walletUrl: '/api/wallet',
    timeout: 10000,
    pageSize: 10,
  },
  production: {
    baseUrl: '/api',
    wsUrl: `wss://${typeof window !== 'undefined' ? window.location.host : ''}/ws`,
    crossChainUrl: '/api/cross-chain',
    walletUrl: '/api/wallet',
    timeout: 15000,
    pageSize: 20,
  },
} as const;

/**
 * Get current environment configuration
 * Respects Vite environment variables when set
 */
export const getCurrentConfig = (): ApiConfig => {
  // Use environment variables if available, otherwise fall back to defaults
  return {
    baseUrl: API_BASE_URL,
    wsUrl: WS_URL,
    crossChainUrl: CROSS_CHAIN_API_URL,
    walletUrl: WALLET_API_URL,
    timeout: import.meta.env.PROD ? 15000 : 10000,
    pageSize: import.meta.env.PROD ? 20 : 10,
  };
};

/**
 * Check if we're in development mode
 */
export const isDevelopment = (): boolean => import.meta.env.DEV;

/**
 * Check if we're in production mode
 */
export const isProduction = (): boolean => import.meta.env.PROD;
