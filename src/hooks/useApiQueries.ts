/**
 * TanStack Query Hooks for WRFCoin API Integration
 *
 * Provides standardized data fetching with loading states, caching, and error handling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { walletManager, walletUtils } from '../utils/walletUtils';
import { walletService } from '../services/apiClient';
import bridgeService, { BridgeError } from '../services/bridgeService';

// ============================================================================
// Wallet Hooks
// ============================================================================

/**
 * Hook to fetch wallet balance
 */
export function useWalletBalance(address: string | undefined) {
  return useQuery({
    queryKey: queryKeys.wallet.balance(address || ''),
    queryFn: async () => {
      if (!address) throw new Error('Address is required');
      return walletService.getBalance(address);
    },
    enabled: !!address && walletUtils.isValidAddress(address),
    staleTime: 15_000, // Balance changes frequently
    refetchInterval: 30_000, // Auto-refresh every 30 seconds
  });
}

/**
 * Hook to get wallet status
 */
export function useWalletStatus() {
  return useQuery({
    queryKey: queryKeys.wallet.all,
    queryFn: () => walletManager.getWalletStatus(),
    staleTime: Infinity, // Local state doesn't go stale
  });
}

// ============================================================================
// Bridge Hooks
// ============================================================================

/**
 * Hook to fetch supported bridge networks
 */
export function useBridgeNetworks() {
  return useQuery({
    queryKey: queryKeys.bridge.networks,
    queryFn: () => bridgeService.getSupportedChains(),
    staleTime: 5 * 60 * 1000, // Networks rarely change - 5 minutes
  });
}

/**
 * Hook to fetch supported bridge tokens
 */
export function useBridgeTokens() {
  return useQuery({
    queryKey: queryKeys.bridge.tokens,
    queryFn: () => bridgeService.getSupportedTokens(),
    staleTime: Infinity, // Static data
  });
}

interface BridgeTransactionOptions {
  limit?: number;
  fromChain?: string;
  toChain?: string;
}

/**
 * Hook to fetch bridge transactions
 */
export function useBridgeTransactions(options: BridgeTransactionOptions = {}) {
  return useQuery({
    queryKey: queryKeys.bridge.transactions(options as Record<string, unknown>),
    queryFn: () => bridgeService.getRecentTransactions(options),
    staleTime: 10_000, // Transactions update frequently
    refetchInterval: 15_000,
  });
}

/**
 * Hook to fetch a specific bridge transaction
 */
export function useBridgeTransaction(txId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.bridge.transaction(txId || ''),
    queryFn: async () => {
      if (!txId) throw new Error('Transaction ID is required');
      return bridgeService.getTransaction(txId);
    },
    enabled: !!txId,
    staleTime: 5_000,
    refetchInterval: 10_000, // Poll for status updates
  });
}

interface OutboundTransactionParams {
  wrfAddress: string;
  externalAddress: string;
  amount: string;
  chain: string;
  asset?: string;
  provider?: string;
  fee?: string;
}

/**
 * Hook for initiating outbound bridge transactions
 */
export function useOutboundBridgeTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: OutboundTransactionParams) =>
      bridgeService.createOutboundTransaction(params),
    onSuccess: () => {
      // Invalidate transaction list to show new transaction
      queryClient.invalidateQueries({ queryKey: queryKeys.bridge.transactions() });
    },
    onError: (error: BridgeError) => {
      console.error('[Bridge] Outbound transaction failed:', error.message);
    },
  });
}

interface InboundTransactionParams {
  wrfAddress: string;
  externalAddress: string;
  amount: string;
  chain: string;
  externalTxHash?: string;
  asset?: string;
  provider?: string;
  fee?: string;
}

/**
 * Hook for initiating inbound bridge transactions
 */
export function useInboundBridgeTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: InboundTransactionParams) =>
      bridgeService.createInboundTransaction(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bridge.transactions() });
    },
    onError: (error: BridgeError) => {
      console.error('[Bridge] Inbound transaction failed:', error.message);
    },
  });
}

// ============================================================================
// Export all hooks
// ============================================================================

