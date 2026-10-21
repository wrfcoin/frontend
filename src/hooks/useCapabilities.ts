/**
 * Hook to fetch platform feature capabilities from the backend.
 * Polls GET /api/capabilities every 60 seconds and caches the result.
 */

import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../services/config';
import { queryKeys } from '../lib/queryClient';
import type { CapabilityReadinessEntry } from '../types/capabilities';

export type FeatureStatus = 'operational' | 'degraded' | 'unavailable' | 'configured' | 'reachable' | 'simulated';

export interface FeatureStatusEntry {
  status: FeatureStatus;
  reasonCode: string;
}

export interface CapabilitiesResponse {
  features: Record<string, FeatureStatusEntry>;
  readiness?: Record<string, CapabilityReadinessEntry>;
  timestamp: string;
}

async function fetchCapabilities(): Promise<CapabilitiesResponse> {
  const response = await fetch(`${API_BASE_URL}/capabilities`);
  if (!response.ok) {
    throw new Error(`Capabilities fetch failed: ${response.status}`);
  }
  return response.json() as Promise<CapabilitiesResponse>;
}

export function useCapabilities() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.capabilities.all,
    queryFn: fetchCapabilities,
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    capabilities: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error : null,
  };
}
