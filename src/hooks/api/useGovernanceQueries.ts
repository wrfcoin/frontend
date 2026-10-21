import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import { governanceService } from '../../services/apiClient';
import type { GovernanceVoteInput } from '../../services/apiClient';

export function useGovernanceProposals(limit: number = 25) {
  return useQuery({
    queryKey: queryKeys.governance.proposals(limit),
    queryFn: () => governanceService.getProposals(limit),
    staleTime: 60_000,
  });
}

export function useDelegations(address: string | undefined) {
  return useQuery({
    queryKey: queryKeys.governance.delegations(address || ''),
    queryFn: () => {
      if (!address) throw new Error('Address is required');
      return governanceService.getDelegations(address);
    },
    enabled: Boolean(address),
    staleTime: 30_000,
  });
}

export function useCastGovernanceVote() {
  return useMutation({
    mutationFn: (input: GovernanceVoteInput) => governanceService.castVote(input),
  });
}
