import type { ServiceBaseUrls } from './runtime';
import { ApiClient } from './client';
import { toStationAlias } from '../../utils/stationAlias';
import { normalizeStationCompare, type StationCompareView } from '../../utils/stationCompare';
import { normalizeStationCompareHistory, type StationCompareHistoryView } from '../../utils/stationCompareHistory';

/**
 * "How does my station compare?" (backend station-detail-routes.ts GET /api/stations/<alias>/compare, Epic 8).
 * Kept out of WeatherService so that service's pinned operation contract stays the original station reads.
 */
export class StationCompareService {
  private readonly client: ApiClient;
  /**
   * Owner-only reads go out once. The shared client repeats a GET up to twice after a 429 or a server error,
   * which on a route limited per client would spend the limit on repeats of a refusal.
   */
  private readonly ownerClient: ApiClient;

  constructor(baseUrls: ServiceBaseUrls) {
    this.client = new ApiClient({ baseUrl: baseUrls.weather });
    this.ownerClient = new ApiClient({ baseUrl: baseUrls.weather, retries: 0 });
  }

  /** The public edge admits only the bare alias form (no query). 404 means not live here, as ApiError. */
  async getStationCompare(stationId: string): Promise<StationCompareView> {
    const alias = toStationAlias(stationId);
    const response = await this.client.get<unknown>(`/stations/${encodeURIComponent(alias)}/compare`);
    return normalizeStationCompare(response);
  }

  /**
   * The owner's 30-day summary (GET /api/stations/<alias>/compare/history). Sent with the wallet session
   * token (authScope.ts). 404 = not live here, 401/403 = not this station's owner: all as ApiError.
   */
  async getStationCompareHistory(stationId: string): Promise<StationCompareHistoryView> {
    const alias = toStationAlias(stationId);
    const response = await this.ownerClient.get<unknown>(`/stations/${encodeURIComponent(alias)}/compare/history`);
    return normalizeStationCompareHistory(response);
  }
}
