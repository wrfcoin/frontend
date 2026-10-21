/**
 * TanStack Query Client Configuration
 * Centralized query client setup with optimized defaults
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Create a QueryClient with optimized defaults for WRFCoin
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 30 seconds before refetching
      staleTime: 30_000,

      // Cache data for 5 minutes
      gcTime: 5 * 60 * 1000,

      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Don't refetch on window focus by default (can override per-query)
      refetchOnWindowFocus: false,

      // Don't refetch on reconnect automatically
      refetchOnReconnect: 'always',

      // Network mode - fetch even if offline to allow fallback behavior
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,

      // Network mode for mutations
      networkMode: 'always',
    },
  },
});

/**
 * Query keys for consistent cache management
 */
export const queryKeys = {
  backend: {
    all: ['backend'] as const,
    health: ['backend', 'health'] as const,
  },

  // Wallet queries
  wallet: {
    all: ['wallet'] as const,
    balance: (address: string) => ['wallet', 'balance', address] as const,
    transactions: (address: string) =>
      ['wallet', 'transactions', address] as const,
  },

  // Bridge queries
  bridge: {
    all: ['bridge'] as const,
    networks: ['bridge', 'networks'] as const,
    tokens: ['bridge', 'tokens'] as const,
    transactions: (options?: Record<string, unknown>) =>
      ['bridge', 'transactions', options] as const,
    transaction: (id: string) => ['bridge', 'transaction', id] as const,
    finality: (txHash: string) => ['bridge', 'finality', txHash] as const,
  },


  // Capabilities queries
  capabilities: {
    all: ['capabilities'] as const,
  },

  // Protocol transition queries
  protocol: {
    all: ['protocol'] as const,
    transition: ['protocol', 'transition'] as const,
  },

  // Blockchain queries
  blockchain: {
    all: ['blockchain'] as const,
    status: ['blockchain', 'status'] as const,
    block: (id: string | number) => ['blockchain', 'block', id] as const,
    transactions: (options?: Record<string, unknown>) =>
      ['blockchain', 'transactions', options] as const,
  },

  // Weather queries
  weather: {
    all: ['weather'] as const,
    stations: ['weather', 'stations'] as const,
    snapshots: (stationIds: string[]) => ['weather', 'snapshots', ...stationIds] as const,
    observations: (stationId: string) =>
      ['weather', 'observations', stationId] as const,
    quality: (stationId: string) =>
      ['weather', 'quality', stationId] as const,
    submissions: (stationId: string) =>
      ['weather', 'submissions', stationId] as const,
  },

  // Earnings queries
  earnings: {
    all: ['earnings'] as const,
    summary: (stationId: string) => ['earnings', 'summary', stationId] as const,
    history: (stationId: string) => ['earnings', 'history', stationId] as const,
  },

  // Governance queries
  governance: {
    all: ['governance'] as const,
    proposals: (limit: number) => ['governance', 'proposals', limit] as const,
    delegations: (address: string) =>
      ['governance', 'delegations', address] as const,
  },

  // Compute queries
  compute: {
    all: ['compute'] as const,
    taskStatus: (taskId: string) => ['compute', 'task', taskId, 'status'] as const,
    taskResults: (taskId: string) =>
      ['compute', 'task', taskId, 'results'] as const,
  },

  // Validator / staking queries
  validators: {
    all: ['validators'] as const,
    list: ['validators', 'list'] as const,
    positions: (address: string) => ['validators', 'positions', address] as const,
    networkStats: ['validators', 'network-stats'] as const,
  },

} as const;

export default queryClient;
