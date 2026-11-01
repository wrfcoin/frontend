import type { ServiceBaseUrls } from './runtime';
import { ApiClient } from './client';
import { toStationAlias } from '../../utils/stationAlias';
import { normalizeStationCalibration, type StationCalibrationView } from '../../utils/stationCalibration';

/**
 * Station calibration certificates (backend calibration-certificate-routes.ts, core4#388/#435).
 * Kept out of WeatherService so that service's pinned operation contract stays the station reads.
 */
export class CalibrationService {
  private readonly client: ApiClient;

  constructor(baseUrls: ServiceBaseUrls) {
    this.client = new ApiClient({ baseUrl: baseUrls.weather });
  }

  /**
   * The public edge admits only the alias form GET /api/calibration-certificates/station/st_<12hex>
   * (no query). 404 means the feature is off on this network and surfaces as ApiError.
   */
  async getStationCalibration(stationId: string): Promise<StationCalibrationView> {
    const alias = toStationAlias(stationId);
    const response = await this.client.get<unknown>(`/calibration-certificates/station/${encodeURIComponent(alias)}`);
    return normalizeStationCalibration(response);
  }
}
