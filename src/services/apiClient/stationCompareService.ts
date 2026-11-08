import type { ServiceBaseUrls } from './runtime';
import { ApiClient } from './client';
import { toStationAlias } from '../../utils/stationAlias';
import { normalizeStationCompare, type StationCompareView } from '../../utils/stationCompare';

/**
 * "How does my station compare?" (backend station-detail-routes.ts GET /api/stations/<alias>/compare, Epic 8).
 * Kept out of WeatherService so that service's pinned operation contract stays the original station reads.
 */
export class StationCompareService {
  private readonly client: ApiClient;

  constructor(baseUrls: ServiceBaseUrls) {
    this.client = new ApiClient({ baseUrl: baseUrls.weather });
  }

  /** The public edge admits only the bare alias form (no query). 404 means not live here, as ApiError. */
  async getStationCompare(stationId: string): Promise<StationCompareView> {
    const alias = toStationAlias(stationId);
    const response = await this.client.get<unknown>(`/stations/${encodeURIComponent(alias)}/compare`);
    return normalizeStationCompare(response);
  }
}
