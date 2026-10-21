import { useState, useEffect, useCallback } from 'react';

// Types
interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  type: 'integration' | 'parameter' | 'upgrade' | 'budget';
  status: 'draft' | 'active' | 'passed' | 'rejected' | 'executed';
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  quorum: number;
  deadline: number;
  creator: string;
  createdAt: number;
  executedAt?: number;
  integrationTarget?: string;
}

interface VotingPower {
  address: string;
  power: number;
  delegated: number;
  total: number;
}

interface VoteRecord {
  proposalId: string;
  voter: string;
  vote: 'for' | 'against' | 'abstain';
  power: number;
  timestamp: number;
}

interface GovernanceStats {
  totalProposals: number;
  activeProposals: number;
  totalVoters: number;
  totalVotingPower: string;
  participationRate: number;
  averageExecutionTime: number;
}

interface UseIntegrationGovernanceOptions {
  userAddress?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseIntegrationGovernanceReturn {
  proposals: GovernanceProposal[];
  userVotingPower: VotingPower | null;
  userVotes: VoteRecord[];
  stats: GovernanceStats | null;
  loading: boolean;
  error: string | null;
  createProposal: (proposal: Partial<GovernanceProposal>) => Promise<boolean>;
  vote: (
    proposalId: string,
    vote: 'for' | 'against' | 'abstain'
  ) => Promise<boolean>;
  delegateVote: (delegatee: string) => Promise<boolean>;
  executeProposal: (proposalId: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

/**
 * Custom hook for integration governance functionality
 */
const useIntegrationGovernance = (
  options: UseIntegrationGovernanceOptions = {},
): UseIntegrationGovernanceReturn => {
  const {
    userAddress,
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
  } = options;

  // State
  const [proposals, setProposals] = useState<GovernanceProposal[]>([]);
  const [userVotingPower, setUserVotingPower] = useState<VotingPower | null>(
    null,
  );
  const [userVotes, setUserVotes] = useState<VoteRecord[]>([]);
  const [stats, setStats] = useState<GovernanceStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch governance proposals
  const fetchProposals = useCallback(async (): Promise<
    GovernanceProposal[]
  > => {
    try {
      const response = await fetch('/api/governance/proposals');
      if (!response.ok) {
        throw new Error('Failed to fetch proposals');
      }
      const data = await response.json();
      return data.proposals || [];
    } catch (err) {
      console.error('Error fetching proposals:', err);
      return [];
    }
  }, []);

  // Fetch user voting power
  const fetchUserVotingPower = useCallback(
    async (address: string): Promise<VotingPower | null> => {
      try {
        const response = await fetch(`/api/governance/voting-power/${address}`);
        if (!response.ok) {
          throw new Error('Failed to fetch voting power');
        }
        const data = await response.json();
        return data.votingPower || null;
      } catch (err) {
        console.error('Error fetching voting power:', err);
        return null;
      }
    },
    [],
  );

  // Fetch user vote history
  const fetchUserVotes = useCallback(
    async (address: string): Promise<VoteRecord[]> => {
      try {
        const response = await fetch(`/api/governance/votes/${address}`);
        if (!response.ok) {
          throw new Error('Failed to fetch vote history');
        }
        const data = await response.json();
        return data.votes || [];
      } catch (err) {
        console.error('Error fetching vote history:', err);
        return [];
      }
    },
    [],
  );

  // Fetch governance statistics
  const fetchStats = useCallback(async (): Promise<GovernanceStats | null> => {
    try {
      const response = await fetch('/api/governance/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch governance stats');
      }
      const data = await response.json();
      return data.stats || null;
    } catch (err) {
      console.error('Error fetching governance stats:', err);
      return null;
    }
  }, []);

  // Refresh all data
  const refreshData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const [proposalsData, statsData] = await Promise.all([
        fetchProposals(),
        fetchStats(),
      ]);

      setProposals(proposalsData);
      setStats(statsData);

      // Fetch user-specific data if address is provided
      if (userAddress) {
        const [votingPowerData, votesData] = await Promise.all([
          fetchUserVotingPower(userAddress),
          fetchUserVotes(userAddress),
        ]);

        setUserVotingPower(votingPowerData);
        setUserVotes(votesData);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error refreshing governance data:', err);
    } finally {
      setLoading(false);
    }
  }, [
    userAddress,
    fetchProposals,
    fetchStats,
    fetchUserVotingPower,
    fetchUserVotes,
  ]);

  // Create new proposal
  const createProposal = useCallback(
    async (proposal: Partial<GovernanceProposal>): Promise<boolean> => {
      try {
        const response = await fetch('/api/governance/proposals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...proposal,
            creator: userAddress,
            createdAt: Date.now(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create proposal');
        }

        // Refresh proposals after creation
        await refreshData();
        return true;
      } catch (err) {
        console.error('Error creating proposal:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to create proposal',
        );
        return false;
      }
    },
    [userAddress, refreshData],
  );

  // Vote on proposal
  const vote = useCallback(
    async (
      proposalId: string,
      voteChoice: 'for' | 'against' | 'abstain',
    ): Promise<boolean> => {
      if (!userAddress) {
        setError('User address required to vote');
        return false;
      }

      try {
        const response = await fetch(
          `/api/governance/proposals/${proposalId}/vote`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              voter: userAddress,
              vote: voteChoice,
              timestamp: Date.now(),
            }),
          },
        );

        if (!response.ok) {
          throw new Error('Failed to cast vote');
        }

        // Refresh data after voting
        await refreshData();
        return true;
      } catch (err) {
        console.error('Error voting on proposal:', err);
        setError(err instanceof Error ? err.message : 'Failed to cast vote');
        return false;
      }
    },
    [userAddress, refreshData],
  );

  // Delegate voting power
  const delegateVote = useCallback(
    async (delegatee: string): Promise<boolean> => {
      if (!userAddress) {
        setError('User address required to delegate');
        return false;
      }

      try {
        const response = await fetch('/api/governance/delegate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            delegator: userAddress,
            delegatee: delegatee,
            timestamp: Date.now(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to delegate vote');
        }

        // Refresh voting power after delegation
        if (userAddress) {
          const votingPowerData = await fetchUserVotingPower(userAddress);
          setUserVotingPower(votingPowerData);
        }

        return true;
      } catch (err) {
        console.error('Error delegating vote:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to delegate vote',
        );
        return false;
      }
    },
    [userAddress, fetchUserVotingPower],
  );

  // Execute proposal
  const executeProposal = useCallback(
    async (proposalId: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/governance/proposals/${proposalId}/execute`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              executor: userAddress,
              executedAt: Date.now(),
            }),
          },
        );

        if (!response.ok) {
          throw new Error('Failed to execute proposal');
        }

        // Refresh proposals after execution
        await refreshData();
        return true;
      } catch (err) {
        console.error('Error executing proposal:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to execute proposal',
        );
        return false;
      }
    },
    [userAddress, refreshData],
  );

  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshData]);

  return {
    proposals,
    userVotingPower,
    userVotes,
    stats,
    loading,
    error,
    createProposal,
    vote,
    delegateVote,
    executeProposal,
    refreshData,
  };
};

export default useIntegrationGovernance;
export type {
  GovernanceProposal,
  VotingPower,
  VoteRecord,
  GovernanceStats,
  UseIntegrationGovernanceOptions,
  UseIntegrationGovernanceReturn,
};
