import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import { earningsService } from '../../services/apiClient';

export function useWeatherEarnings(stationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.earnings.summary(stationId || ''),
    queryFn: () => {
      if (!stationId) throw new Error('Station ID is required');
      return earningsService.getStationSummary(stationId);
    },
    enabled: Boolean(stationId),
    staleTime: 60_000,
  });
}

export function useWeatherEarningsHistory(stationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.earnings.history(stationId || ''),
    queryFn: () => {
      if (!stationId) throw new Error('Station ID is required');
      return earningsService.getStationHistory(stationId);
    },
    enabled: Boolean(stationId),
    staleTime: 30_000,
  });
}
