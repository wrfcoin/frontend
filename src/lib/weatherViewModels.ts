import type {
  EarningsSummary,
  StationObservation,
  StationQuality,
  StationSubmissionLogEntry,
  WeatherStation,
} from '../services/apiClient';
import { sumExactBaseUnits } from '../services/apiClient/amountPrecision';
import { toBaseUnits, toWrfNumberForChart } from '../services/apiClient/number';

export type WeatherDisplayStatus =
  | 'online'
  | 'stale'
  | 'registered'
  | 'degraded'
  | 'offline'
  | 'unknown';

/**
 * One label and colour per display status, shared by every station surface
 * (map pins and badges, popup, station page chip, contributor home), so the
 * wording cannot drift between them. Owner ruling: neutral labels. A station
 * that has not reported yet is "Registered (no recent data)" in a neutral slate, never red.
 */
export const STATION_STATUS_PRESENTATION: Record<
  WeatherDisplayStatus,
  { label: string; color: string }
> = {
  online: { label: 'Online', color: '#22C55E' },
  stale: { label: 'Stale', color: '#F59E0B' },
  registered: { label: 'Registered (no recent data)', color: '#94A3B8' },
  degraded: { label: 'Degraded', color: '#EAB308' },
  offline: { label: 'Offline', color: '#EF4444' },
  unknown: { label: 'Status unknown', color: '#94A3B8' },
};

export function stationStatusPresentation(status: WeatherDisplayStatus | string | undefined) {
  return (
    STATION_STATUS_PRESENTATION[status as WeatherDisplayStatus] ?? STATION_STATUS_PRESENTATION.unknown
  );
}

export interface WeatherStationSnapshot {
  station: WeatherStation;
  observations: StationObservation[];
  quality: StationQuality | null;
  earnings: EarningsSummary | null;
  submissions: StationSubmissionLogEntry[];
}

export interface WeatherHistoryPoint {
  time: string;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  windSpeed: number | null;
}

export interface WeatherStationViewModel {
  id: string;
  name: string;
  status: WeatherDisplayStatus;
  sourceStatus: WeatherStation['status'];
  location?: string;
  latitude?: number;
  longitude?: number;
  lastUpdatedAt?: string;
  lastUpdateLabel: string;
  temperatureC: number | null;
  temperatureF: number | null;
  humidity: number | null;
  pressure: number | null;
  windSpeedMs: number | null;
  windSpeedMph: number | null;
  windDirection: number | null;
  precipitationMm: number | null;
  precipitationIn: number | null;
  uvIndex: number | null;
  quality: number | null;
  validationRate: number | null;
  /** Exact base units for ordinary display and aggregation; never chart numbers. */
  earningsToday: string | null;
  earningsThisWeek: string | null;
  earningsAllTime: string | null;
  earningsRatePerDay: number | null;
  observationCount: number;
  history: WeatherHistoryPoint[];
}

export function mapWeatherStatus(status: WeatherStation['status'] | undefined): WeatherDisplayStatus {
  switch (status) {
  case 'live':
    return 'online';
  case 'stale':
    return 'stale';
  case 'registered':
    return 'registered';
  case 'sleeping':
  case 'maintenance':
    return 'degraded';
  case 'offline':
    return 'offline';
  default:
    return 'unknown';
  }
}

export function averageDefined(values: Array<number | null | undefined>): number | null {
  const numbers = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (numbers.length === 0) {
    return null;
  }
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

export function sumDefined(values: Array<unknown>): string | null {
  return sumExactBaseUnits(values);
}

function exactAmountOrNull(value: unknown): string | null {
  return toBaseUnits(value)?.toString() ?? null;
}

export function stationHasCoordinates<T extends { latitude?: number; longitude?: number }>(
  station: T,
): station is T & { latitude: number; longitude: number } {
  return typeof station.latitude === 'number' && typeof station.longitude === 'number';
}

export function toFahrenheit(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return (value * 9) / 5 + 32;
}

export function metersPerSecondToMph(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return value * 2.23694;
}

export function millimetersToInches(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return value / 25.4;
}

export function formatRelativeTime(timestamp?: string): string {
  if (!timestamp) {
    return 'No recent readings';
  }

  const target = new Date(timestamp).getTime();
  if (Number.isNaN(target)) {
    return 'No recent readings';
  }

  const diffMs = Date.now() - target;
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 1) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function sortObservationsAsc(observations: StationObservation[]): StationObservation[] {
  return [...observations].sort(
    (left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
  );
}

function getLatestObservation(observations: StationObservation[]): StationObservation | null {
  if (observations.length === 0) {
    return null;
  }
  return [...observations].sort(
    (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
  )[0] ?? null;
}

export function filterObservationsByRange(
  observations: StationObservation[],
  range: '24h' | '7d' | '30d' | '1y' | 'all',
): StationObservation[] {
  if (range === 'all') {
    return sortObservationsAsc(observations);
  }

  const now = Date.now();
  const thresholds = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '1y': 365 * 24 * 60 * 60 * 1000,
  } as const;

  return sortObservationsAsc(
    observations.filter((observation) => now - new Date(observation.timestamp).getTime() <= thresholds[range]),
  );
}

export function buildWeatherHistory(observations: StationObservation[]): WeatherHistoryPoint[] {
  return sortObservationsAsc(observations)
    .filter((observation) =>
      [
        observation.temperatureC,
        observation.humidityPct,
        observation.pressureHpa,
        observation.windSpeedMs,
      ].some((value) => typeof value === 'number' && Number.isFinite(value)),
    )
    .map((observation) => ({
      time: observation.timestamp,
      temperature: toFahrenheit(observation.temperatureC),
      humidity: observation.humidityPct ?? null,
      pressure: observation.pressureHpa ?? null,
      windSpeed: metersPerSecondToMph(observation.windSpeedMs),
    }));
}

export function buildWeatherStationViewModel(snapshot: WeatherStationSnapshot): WeatherStationViewModel {
  const latestObservation = getLatestObservation(snapshot.observations);
  const history = buildWeatherHistory(snapshot.observations);
  const successfulSubmissions = snapshot.submissions.filter((submission) => submission.success).length;
  const validationRate = snapshot.submissions.length
    ? (successfulSubmissions / snapshot.submissions.length) * 100
    : null;
  const lastUpdatedAt = latestObservation?.timestamp ?? snapshot.station.lastUpdatedAt;
  const currentRate = snapshot.earnings?.currentRate != null
    ? toWrfNumberForChart(snapshot.earnings.currentRate)
    : null;

  return {
    id: snapshot.station.id,
    name: snapshot.station.name,
    status: mapWeatherStatus(snapshot.station.status),
    sourceStatus: snapshot.station.status,
    location: snapshot.station.location,
    latitude: snapshot.station.latitude,
    longitude: snapshot.station.longitude,
    lastUpdatedAt,
    lastUpdateLabel: formatRelativeTime(lastUpdatedAt),
    temperatureC: latestObservation?.temperatureC ?? null,
    temperatureF: toFahrenheit(latestObservation?.temperatureC),
    humidity: latestObservation?.humidityPct ?? null,
    pressure: latestObservation?.pressureHpa ?? null,
    windSpeedMs: latestObservation?.windSpeedMs ?? null,
    windSpeedMph: metersPerSecondToMph(latestObservation?.windSpeedMs),
    windDirection: latestObservation?.windDirectionDeg ?? null,
    precipitationMm: latestObservation?.rainRateMmHr ?? null,
    precipitationIn: millimetersToInches(latestObservation?.rainRateMmHr),
    uvIndex: latestObservation?.uvIndex ?? null,
    quality: snapshot.quality?.overall ?? null,
    validationRate,
    earningsToday: exactAmountOrNull(snapshot.earnings?.today),
    earningsThisWeek: exactAmountOrNull(snapshot.earnings?.thisWeek),
    earningsAllTime: exactAmountOrNull(snapshot.earnings?.allTime),
    earningsRatePerDay: currentRate === null ? null : currentRate * 24,
    observationCount: snapshot.observations.length,
    history,
  };
}
