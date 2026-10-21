/**
 * Custom React hooks for governance data management
 * Provides real-time updates, caching, and error handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { governanceService } from '../services/governanceService';
import { getWebSocketClient } from '../services/websocketService';
import { usePolling } from './usePolling';
import { devLog } from '../utils/logger';

/**
 * Hook for managing governance proposals data
 */
export const useGovernanceProposals = (options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    realTimeUpdates = true,
    filterStatus = 'all',
    limit = 100,
  } = options;

  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const wsClient = useRef(null);

  // Fetch proposals from API
  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data =
        filterStatus === 'all'
          ? await governanceService.getAllProposals(limit)
          : await governanceService.getActiveProposals();

      setProposals(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError(err.message || 'Failed to fetch proposals');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, limit]);

  // Setup WebSocket for real-time updates
  useEffect(() => {
    if (realTimeUpdates) {
      wsClient.current = getWebSocketClient();
      wsClient.current.connect();

      wsClient.current.subscribe('governance');
      wsClient.current.subscribe('proposals');

      const handleProposalUpdate = data => {
        devLog('Proposal update received:', data);
        if (
          data.type === 'proposal_created' ||
          data.type === 'proposal_updated'
        ) {
          fetchProposals(); // Refresh
        }
      };

      wsClient.current.on('channel:governance', handleProposalUpdate);
      wsClient.current.on('channel:proposals', handleProposalUpdate);

      return () => {
        if (wsClient.current) {
          wsClient.current.off('channel:governance', handleProposalUpdate);
          wsClient.current.off('channel:proposals', handleProposalUpdate);
        }
      };
    }
  }, [realTimeUpdates, fetchProposals]);

  // Setup auto-refresh with visibility-aware polling
  const { refresh } = usePolling(fetchProposals, refreshInterval, {
    enabled: autoRefresh,
  });

  // Initial fetch when auto-refresh is disabled
  useEffect(() => {
    if (!autoRefresh) {
      fetchProposals();
    }
  }, [autoRefresh, fetchProposals]);

  // Create proposal
  const createProposal = useCallback(async proposalData => {
    try {
      const newProposal = await governanceService.createProposal(proposalData);
      setProposals(prev => [newProposal, ...prev]);
      return newProposal;
    } catch (err) {
      console.error('Error creating proposal:', err);
      throw err;
    }
  }, []);

  // Cast vote
  const castVote = useCallback(
    async (proposalId, voter, vote) => {
      try {
        const voteResult = await governanceService.castVote(
          proposalId,
          voter,
          vote,
        );
        // Refresh proposals to get updated vote counts
        await fetchProposals();
        return voteResult;
      } catch (err) {
        console.error('Error casting vote:', err);
        throw err;
      }
    },
    [fetchProposals],
  );

  // Filter proposals
  const filteredProposals = proposals.filter(proposal => {
    if (filterStatus === 'all') return true;
    return proposal.status === filterStatus;
  });

  return {
    proposals: filteredProposals,
    loading,
    error,
    lastUpdated,
    refresh,
    createProposal,
    castVote,
    totalCount: proposals.length,
  };
};

/**
 * Hook for managing governance analytics data
 */
export const useGovernanceAnalytics = (options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 60000, // 1 minute
    realTimeUpdates = true,
  } = options;

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch analytics from API
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        dashboardResponse,
        participationResponse,
        treasuryResponse,
        delegatesResponse,
      ] = await Promise.all([
        fetch('/api/governance/analytics/dashboard'),
        fetch('/api/governance/analytics/participation'),
        fetch('/api/governance/analytics/treasury'),
        fetch('/api/governance/analytics/delegates'),
      ]);

      const [dashboard, participation, treasury, delegates] = await Promise.all(
        [
          dashboardResponse.json(),
          participationResponse.json(),
          treasuryResponse.json(),
          delegatesResponse.json(),
        ],
      );

      setAnalytics({
        dashboard: dashboard.data,
        participation: participation.data,
        treasury: treasury.data,
        delegates: delegates.data,
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup auto-refresh with visibility-aware polling
  const { refresh } = usePolling(fetchAnalytics, refreshInterval, {
    enabled: autoRefresh,
  });

  // Initial fetch when auto-refresh is disabled
  useEffect(() => {
    if (!autoRefresh) {
      fetchAnalytics();
    }
  }, [autoRefresh, fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    lastUpdated,
    refresh,
  };
};

/**
 * Hook for managing delegate information
 */
export const useDelegates = (options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 120000, // 2 minutes
    limit = 50,
  } = options;

  const [delegates, setDelegates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch delegates from API
  const fetchDelegates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/governance/analytics/delegates');
      const data = await response.json();

      if (data.success) {
        setDelegates(data.data.topDelegates || []);
        setLastUpdated(new Date());
      } else {
        throw new Error(data.error || 'Failed to fetch delegates');
      }
    } catch (err) {
      console.error('Error fetching delegates:', err);
      setError(err.message || 'Failed to fetch delegates');
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup auto-refresh with visibility-aware polling
  const { refresh } = usePolling(fetchDelegates, refreshInterval, {
    enabled: autoRefresh,
  });

  // Initial fetch when auto-refresh is disabled
  useEffect(() => {
    if (!autoRefresh) {
      fetchDelegates();
    }
  }, [autoRefresh, fetchDelegates]);

  // Create delegation
  const createDelegation = useCallback(
    async (delegator, delegate, amount) => {
      try {
        const delegation = await governanceService.createDelegation(
          delegator,
          delegate,
          amount,
        );
        await fetchDelegates(); // Refresh delegates
        return delegation;
      } catch (err) {
        console.error('Error creating delegation:', err);
        throw err;
      }
    },
    [fetchDelegates],
  );

  // Remove delegation
  const removeDelegation = useCallback(
    async (delegator, delegate) => {
      try {
        await governanceService.removeDelegation(delegator, delegate);
        await fetchDelegates(); // Refresh delegates
      } catch (err) {
        console.error('Error removing delegation:', err);
        throw err;
      }
    },
    [fetchDelegates],
  );

  return {
    delegates,
    loading,
    error,
    lastUpdated,
    refresh,
    createDelegation,
    removeDelegation,
  };
};

/**
 * Hook for managing treasury data
 */
export const useTreasury = (options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 180000, // 3 minutes
    includeHistorical = false,
  } = options;

  const [treasury, setTreasury] = useState(null);
  const [historical, setHistorical] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch treasury data from API
  const fetchTreasury = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const promises = [fetch('/api/governance/analytics/treasury')];

      if (includeHistorical) {
        promises.push(
          fetch('/api/governance/analytics/historical?timeframe=30d'),
        );
      }

      const responses = await Promise.all(promises);
      const data = await Promise.all(responses.map(r => r.json()));

      if (data[0].success) {
        setTreasury(data[0].data);
      }

      if (includeHistorical && data[1]?.success) {
        setHistorical(data[1].data);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching treasury data:', err);
      setError(err.message || 'Failed to fetch treasury data');
    } finally {
      setLoading(false);
    }
  }, [includeHistorical]);

  // Setup auto-refresh with visibility-aware polling
  const { refresh } = usePolling(fetchTreasury, refreshInterval, {
    enabled: autoRefresh,
  });

  // Initial fetch when auto-refresh is disabled
  useEffect(() => {
    if (!autoRefresh) {
      fetchTreasury();
    }
  }, [autoRefresh, fetchTreasury]);

  return {
    treasury,
    historical,
    loading,
    error,
    lastUpdated,
    refresh,
  };
};

/**
 * Hook for managing governance notifications
 */
export const useGovernanceNotifications = (options = {}) => {
  const {
    maxNotifications = 50,
    autoMarkAsRead = false,
    realTimeUpdates = true,
  } = options;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsClient = useRef(null);

  // Setup WebSocket for real-time notifications
  useEffect(() => {
    if (realTimeUpdates) {
      wsClient.current = getWebSocketClient();
      wsClient.current.connect();

      wsClient.current.subscribe('governance');
      wsClient.current.subscribe('notifications');

      const handleNotification = data => {
        const notification = {
          id: Date.now(),
          title: data.title || 'Governance Update',
          message: data.message || 'New governance activity',
          timestamp: new Date().toLocaleTimeString(),
          type: data.type || 'info',
          read: autoMarkAsRead,
        };

        setNotifications(prev => {
          const newNotifications = [notification, ...prev];
          return newNotifications.slice(0, maxNotifications);
        });

        if (!autoMarkAsRead) {
          setUnreadCount(prev => prev + 1);
        }
      };

      wsClient.current.on('channel:governance', handleNotification);
      wsClient.current.on('channel:notifications', handleNotification);

      return () => {
        if (wsClient.current) {
          wsClient.current.off('channel:governance', handleNotification);
          wsClient.current.off('channel:notifications', handleNotification);
        }
      };
    }
  }, [realTimeUpdates, maxNotifications, autoMarkAsRead]);

  // Add notification manually
  const addNotification = useCallback(
    notification => {
      const newNotification = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        read: false,
        type: 'info',
        ...notification,
      };

      setNotifications(prev => {
        const newNotifications = [newNotification, ...prev];
        return newNotifications.slice(0, maxNotifications);
      });

      setUnreadCount(prev => prev + 1);
    },
    [maxNotifications],
  );

  // Mark notification as read
  const markAsRead = useCallback(notificationId => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification,
      ),
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true })),
    );
    setUnreadCount(0);
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
};

/**
 * Hook for managing voting power
 */
export const useVotingPower = (address, options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 60000, // 1 minute
  } = options;

  const [votingPower, setVotingPower] = useState(null);
  const [delegatedPower, setDelegatedPower] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch voting power from API
  const fetchVotingPower = useCallback(async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/governance/voting-power/${address}`);
      const data = await response.json();

      if (data.success) {
        setVotingPower(data.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(data.error || 'Failed to fetch voting power');
      }
    } catch (err) {
      console.error('Error fetching voting power:', err);
      setError(err.message || 'Failed to fetch voting power');
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Setup auto-refresh with visibility-aware polling
  const { refresh } = usePolling(fetchVotingPower, refreshInterval, {
    enabled: autoRefresh && !!address,
  });

  // Initial fetch when auto-refresh is disabled
  useEffect(() => {
    if (!autoRefresh && address) {
      fetchVotingPower();
    }
  }, [autoRefresh, fetchVotingPower, address]);

  return {
    votingPower,
    delegatedPower,
    loading,
    error,
    lastUpdated,
    refresh,
  };
};

// Export all hooks as default
export default {
  useGovernanceProposals,
  useGovernanceAnalytics,
  useDelegates,
  useTreasury,
  useGovernanceNotifications,
  useVotingPower,
};
