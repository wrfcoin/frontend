import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import { validatorApiService } from '../../services/apiClient';

export function useValidators() {
  return useQuery({
    queryKey: queryKeys.validators.list,
    queryFn: () => validatorApiService.getValidators(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useStakingPositions(address?: string) {
  return useQuery({
    queryKey: queryKeys.validators.positions(address || ''),
    queryFn: () => validatorApiService.getStakingPositions(address),
    staleTime: 30_000,
  });
}

export function useNetworkStats() {
  return useQuery({
    queryKey: queryKeys.validators.networkStats,
    queryFn: () => validatorApiService.getNetworkStats(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
