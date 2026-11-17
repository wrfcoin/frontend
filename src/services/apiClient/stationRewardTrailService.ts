import type { ServiceBaseUrls } from './runtime';
import { ApiClient } from './client';
import { toStationAlias } from '../../utils/stationAlias';
import { normalizeStationRewardTrail, type StationRewardTrailView } from '../../utils/stationRewardTrail';

/**
 * Reward trail (GET /api/stations/<alias>/reward-trail, backend station-detail-routes.ts): stages only, no
 * amounts. Bare alias form (no query), counted in the edge's 30-a-minute public_read zone, so this read goes
 * out once: no automatic repeats of a 429 or server error. 404 means not live here, as ApiError.
 */
export class StationRewardTrailService {
  private readonly client: ApiClient;

  constructor(baseUrls: ServiceBaseUrls) {
    this.client = new ApiClient({ baseUrl: baseUrls.weather, retries: 0 });
  }

  async getStationRewardTrail(stationId: string): Promise<StationRewardTrailView> {
    const alias = toStationAlias(stationId);
    const response = await this.client.get<unknown>(`/stations/${encodeURIComponent(alias)}/reward-trail`);
    return normalizeStationRewardTrail(response);
  }
}
