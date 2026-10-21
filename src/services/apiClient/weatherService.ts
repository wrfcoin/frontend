import type {
  StationObservation,
  StationQuality,
  StationSubmissionLogEntry,
  WeatherStation,
} from './types';
import type { ServiceBaseUrls } from './runtime';
import { ApiClient } from './client';
import { toNumber } from './number';
import { toStationAlias } from '../../utils/stationAlias';
import { normalizeStationOwnership, type StationOwnershipView } from '../../utils/stationOwnership';

// backend#1263 derives a public station's status from observation freshness:
// 'live' (recent data), 'stale' (data, but old) or 'registered' (registered,
// no observation yet). The owner's neutral-label ruling (frontend#415): a
// station that never reported is "Registered", not a red "Offline", and a
// status this app does not recognise is "unknown", not "offline".
export function normalizeStationStatus(status?: unknown): WeatherStation['status'] {
  const normalized = typeof status === 'string' ? status.trim().toLowerCase() : '';
  switch (normalized) {
  case 'online':
  case 'live':
  case 'active': // pre-#1263 registration flag; still accepted by the backend
    return 'live';
  case 'stale':
    return 'stale';
  case 'registered':
    return 'registered';
  case 'sleeping':
  case 'idle':
    return 'sleeping';
  case 'maintenance':
    return 'maintenance';
  case 'offline':
  case 'inactive':
    return 'offline';
  default:
    return 'unknown';
  }
}

export class WeatherService {
  private readonly client: ApiClient;

  constructor(baseUrls: ServiceBaseUrls) {
    this.client = new ApiClient({ baseUrl: baseUrls.weather });
  }

  async getStations(): Promise<WeatherStation[]> {
    // backend weather-routes.js: the coordinate-less GET /api/weather/stations
    // always answers with the envelope
    // { stations, total, hasMore, nextCursor, source }, never a bare array.
    const response = await this.client.get<unknown>('/weather/stations');
    const stations = unwrapStations(response);

    return stations.map((station: any) => ({
      // Owner ruling 2026-09-27 07:15Z: raw station ids carry owners' first
      // names, so the anonymous API serves an opaque public `alias`
      // (st_ + 12 hex; backend weather-routes.js) and the station routes
      // accept it. The alias is THE station id everywhere in this app (map
      // keys, links, /weather/station/<id>, /api/stations/<id>/...), and it
      // wins even when a raw id is also present, so a raw id can never reach a
      // URL, a request or the page. Never computed here: opaque, API-provided.
      id: String(station.alias || station.id || station.stationId || station.code || 'unknown'),
      name: String(station.name || station.stationName || 'Unnamed Station'),
      status: normalizeStationStatus(station.status),
      location: station.location?.address || station.location || station.region,
      latitude: toNumber(
        station.latitude ??
        station.lat ??
        station.location?.latitude ??
        station.location?.lat,
      ),
      longitude: toNumber(
        station.longitude ??
        station.lng ??
        station.location?.longitude ??
        station.location?.lng,
      ),
      lastUpdatedAt: station.lastDataUpdate
        ? new Date(station.lastDataUpdate).toISOString()
        : station.lastUpdatedAt,
    }));
  }

  async getLatestObservations(stationId: string): Promise<StationObservation[]> {
    const response = await this.client.get<any>(
      `/stations/${encodeURIComponent(stationId)}/observations?limit=1`,
    );
    // The producer answers HTTP 200 with `unavailable: ['observations']` when
    // core4 is down and the database holds no rows. That is not an empty
    // history, so it must not be returned as one.
    if (Array.isArray(response.unavailable) && response.unavailable.includes('observations')) {
      throw new Error(STATION_OBSERVATIONS_NOT_LIVE);
    }
    const rows = Array.isArray(response.observations) ? response.observations : [];

    return rows.map((entry: any) => ({
      stationId,
      timestamp: requireTimestamp(entry.timestamp, `observation ${stationId}`),
      temperatureC: toNumber(entry.temperatureC ?? entry.temperature),
      humidityPct: toNumber(entry.humidityPct ?? entry.humidity),
      pressureHpa: toNumber(entry.pressureHpa ?? entry.pressure),
      windSpeedMs: toNumber(entry.windSpeedMs ?? entry.windSpeed),
      windDirectionDeg: toNumber(entry.windDirectionDeg ?? entry.windDirection),
      rainRateMmHr: toNumber(entry.rainRateMmHr ?? entry.rainRate),
      uvIndex: toNumber(entry.uvIndex ?? entry.uv),
      pm25UgM3: toNumber(entry.pm25UgM3 ?? entry.pm25),
    }));
  }

  async getStationQuality(stationId: string): Promise<StationQuality> {
    const response = await this.client.get<any>(
      `/stations/${encodeURIComponent(stationId)}/quality`,
    );

    if (Array.isArray(response.unavailable) && response.unavailable.includes('quality')) {
      throw new Error(STATION_QUALITY_NOT_LIVE);
    }

    // backend station-detail-routes.ts returns overall: null (and per-factor
    // score: null) when a quality row exists but its score is missing or not
    // numeric. That is "no live score yet", not a transport failure.
    const overall = toNumber(response.overall);
    if (overall === undefined) {
      throw new Error(STATION_QUALITY_NOT_LIVE);
    }

    const dimensions = Array.isArray(response.dimensions)
      ? response.dimensions.flatMap((dimension: any) => {
        const score = toNumber(dimension.score);
        if (score === undefined) return [];
        return [{
          key: String(dimension.key || dimension.id || 'unknown'),
          label: String(dimension.label || dimension.name || 'Unknown'),
          score,
          color: dimension.color,
        }];
      })
      : [];

    return {
      stationId,
      overall,
      dimensions,
    };
  }

  /**
   * Read-only owner-ledger projection. The only path the public edge admits is the alias form
   * GET /api/stations/st_<12hex>/ownership (no query); 404 STATION_NOT_REGISTERED surfaces as ApiError.
   */
  async getStationOwnership(stationId: string): Promise<StationOwnershipView> {
    const alias = toStationAlias(stationId);
    const response = await this.client.get<unknown>(`/stations/${encodeURIComponent(alias)}/ownership`);
    return normalizeStationOwnership(response);
  }

  async getSubmissionLog(stationId: string): Promise<StationSubmissionLogEntry[]> {
    const response = await this.client.get<any>(
      `/stations/${encodeURIComponent(stationId)}/submissions`,
    );
    const rows = Array.isArray(response.submissions) ? response.submissions : [];

    return rows.map((entry: any, index: number) => ({
      id: String(entry.id),
      stationId,
      timestamp: requireTimestamp(entry.createdAt, `submission ${entry.id ?? index}`),
      success: isSuccessfulSubmission(entry),
      summary: String(entry.chainStatus ?? entry.status),
      qualityScore: undefined,
      wrfEarned: undefined,
    }));
  }
}

function requireTimestamp(value: unknown, field: string): string {
  if (typeof value === 'string' && Number.isFinite(Date.parse(value))) return value;
  throw new Error(`${field} timestamp is unavailable`);
}

export const STATION_QUALITY_NOT_LIVE = 'STATION_QUALITY_NOT_LIVE';
export const STATION_OBSERVATIONS_NOT_LIVE = 'STATION_OBSERVATIONS_NOT_LIVE';

// core4 contribution_status (native-chain launch_api routes/transactions.rs)
// emits these values; only these two mean the reveal was accepted on chain.
// Every other value (committed_pending_reveal, revealed_pending_attestation,
// reward_pending_quorum, attested_without_pending_records, not_found) is not
// yet a success.
const CORE4_ACCEPTED_STATUSES = new Set(['revealed_attested', 'reward_finalized']);

function isSuccessfulSubmission(entry: any): boolean {
  if (typeof entry.chainStatus === 'string') {
    return CORE4_ACCEPTED_STATUSES.has(entry.chainStatus);
  }
  // backend sends chainStatus: null when core4 could not be reached; fall back
  // to the backend's own commitment row.
  return entry.status === 'revealed';
}

function unwrapStations(response: unknown): unknown[] {
  if (response && typeof response === 'object' && Array.isArray((response as { stations?: unknown }).stations)) {
    return (response as { stations: unknown[] }).stations;
  }
  throw new Error('weather stations response has no stations list');
}

export default WeatherService;
