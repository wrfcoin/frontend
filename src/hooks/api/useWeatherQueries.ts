import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import {
  calibrationService,
  earningsService,
  weatherService,
  type EarningsSummary,
  type StationObservation,
  type StationQuality,
  type StationSubmissionLogEntry,
  type WeatherStation,
} from '../../services/apiClient';
import type { WeatherStationSnapshot } from '../../lib/weatherViewModels';
import { STATION_OBSERVATIONS_NOT_LIVE, STATION_QUALITY_NOT_LIVE } from '../../services/apiClient/weatherService';
import ApiError from '../../utils/apiError';

// "No live quality score yet" is the backend's answer, not a transport
// failure: retrying it only spends the public edge's per-IP read budget.
const QUALITY_RETRIES = 3;
export function retryStationQuality(failureCount: number, error: unknown): boolean {
  if (error instanceof Error && error.message === STATION_QUALITY_NOT_LIVE) return false;
  return failureCount < QUALITY_RETRIES;
}

export function retryStationObservations(failureCount: number, error: unknown): boolean {
  if (error instanceof Error && error.message === STATION_OBSERVATIONS_NOT_LIVE) return false;
  return failureCount < 3;
}

export function useWeatherStations() {
  return useQuery({
    queryKey: queryKeys.weather.stations,
    queryFn: () => weatherService.getStations(),
    staleTime: 60_000,
  });
}

export function useWeatherStationsWithCoords() {
  const query = useWeatherStations();
  const data = useMemo(
    () => query.data?.filter((s) => s.latitude != null && s.longitude != null) ?? [],
    [query.data],
  );
  return { ...query, data };
}

async function buildStationSnapshot(station: WeatherStation): Promise<WeatherStationSnapshot> {
  const settled = await Promise.allSettled([
    weatherService.getLatestObservations(station.id),
    weatherService.getStationQuality(station.id),
    earningsService.getStationSummary(station.id),
    weatherService.getSubmissionLog(station.id),
  ]);

  return {
    station,
    observations:
      settled[0].status === 'fulfilled'
        ? (settled[0].value as StationObservation[])
        : [],
    quality:
      settled[1].status === 'fulfilled'
        ? (settled[1].value as StationQuality)
        : null,
    earnings:
      settled[2].status === 'fulfilled'
        ? (settled[2].value as EarningsSummary)
        : null,
    submissions:
      settled[3].status === 'fulfilled'
        ? (settled[3].value as StationSubmissionLogEntry[])
        : [],
  };
}

export function useWeatherStationSnapshots(
  stations: WeatherStation[] | undefined,
  enabled = true,
) {
  const stationIds = useMemo(
    () => [...(stations ?? []).map((station) => station.id)].sort(),
    [stations],
  );

  return useQuery({
    queryKey: queryKeys.weather.snapshots(stationIds),
    enabled: enabled && stationIds.length > 0,
    queryFn: async () => Promise.all((stations ?? []).map((station) => buildStationSnapshot(station))),
    staleTime: 30_000,
  });
}

export function useLatestObservations(stationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.weather.observations(stationId || ''),
    queryFn: () => {
      if (!stationId) throw new Error('Station ID is required');
      return weatherService.getLatestObservations(stationId);
    },
    enabled: Boolean(stationId),
    staleTime: 15_000,
    refetchInterval: 15_000,
    retry: retryStationObservations,
  });
}

export function useStationQuality(stationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.weather.quality(stationId || ''),
    queryFn: () => {
      if (!stationId) throw new Error('Station ID is required');
      return weatherService.getStationQuality(stationId);
    },
    enabled: Boolean(stationId),
    staleTime: 30_000,
    retry: retryStationQuality,
  });
}

export function useSubmissionLog(stationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.weather.submissions(stationId || ''),
    queryFn: () => {
      if (!stationId) throw new Error('Station ID is required');
      return weatherService.getSubmissionLog(stationId);
    },
    enabled: Boolean(stationId),
    staleTime: 30_000,
  });
}

/**
 * Calibration certificate status for one station (backend calibration-certificate-routes.ts). A 404
 * means the feature is off on this network: not retried, and the page shows nothing for it.
 */
export function retryStationCalibration(failureCount: number, error: unknown): boolean {
  // Only a server or network failure is worth one more try; 404 (feature off), other 4xx and a body
  // this app cannot read are answers, and retrying them only spends the edge's per-IP read budget.
  if (!(error instanceof ApiError)) return false;
  return (error.status === 0 || error.status >= 500) && failureCount < 1;
}

export function useStationCalibration(stationId: string | undefined) {
  return useQuery({
    queryKey: ['weather', 'calibration', stationId ?? ''] as const,
    queryFn: () => calibrationService.getStationCalibration(stationId as string),
    enabled: Boolean(stationId),
    retry: retryStationCalibration,
    staleTime: 60_000,
  });
}
