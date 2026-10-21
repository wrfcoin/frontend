import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import { walletService } from '../../services/apiClient';

export function useWalletBalanceLive(address: string | undefined) {
  return useQuery({
    queryKey: queryKeys.wallet.balance(address || ''),
    queryFn: () => {
      if (!address) throw new Error('Address is required');
      return walletService.getBalance(address);
    },
    enabled: Boolean(address),
    staleTime: 20_000,
    refetchInterval: 30_000,
  });
}

export function useWalletTransactionsLive(address: string | undefined) {
  return useQuery({
    queryKey: queryKeys.wallet.transactions(address || ''),
    queryFn: () => {
      if (!address) throw new Error('Address is required');
      return walletService.getTransactions(address);
    },
    enabled: Boolean(address),
    staleTime: 20_000,
  });
}
