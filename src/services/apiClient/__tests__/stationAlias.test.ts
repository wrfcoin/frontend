/**
 * Owner ruling 2026-09-27 07:15Z: the public site identifies stations only by
 * the backend's opaque `alias` (stations-data contract; st_ + 12 hex). The
 * alias is the app's station id, and it wins over any raw id in the row.
 */
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { WeatherService } from '../weatherService';

const baseUrls = {
  api: 'https://api.test', weather: 'https://api.test', earnings: 'https://api.test',
  governance: 'https://api.test', wallet: 'https://api.test', compute: 'https://api.test', validator: 'https://api.test',
};

function serveStations(stations: unknown[]) {
  global.fetch = jest.fn(async () => new Response(
    JSON.stringify({ stations, total: stations.length, hasMore: false, nextCursor: null, source: 'wrfcoin-contributors' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )) as typeof fetch;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('station alias is the public station id', () => {
  it('uses the alias from the anonymous contract row (no raw id present)', async () => {
    serveStations([{ alias: 'st_3f9a0c12be47', name: 'Hilltop', latitude: 46.87, longitude: -96.79, status: 'active', qualityScore: null }]);
    const [station] = await new WeatherService(baseUrls).getStations();
    expect(station.id).toBe('st_3f9a0c12be47');
    expect(station.name).toBe('Hilltop');
  });

  it('prefers the alias even when a raw id is also in the row', async () => {
    serveStations([{ alias: 'st_3f9a0c12be47', id: 'KMNFARGO-tony-3', stationId: 'KMNFARGO-tony-3', name: 'Hilltop', latitude: 46.87, longitude: -96.79, status: 'active' }]);
    const stations = await new WeatherService(baseUrls).getStations();
    expect(stations[0].id).toBe('st_3f9a0c12be47');
    expect(JSON.stringify(stations)).not.toContain('tony');
  });

  it('keeps pre-alias rows working (raw id used only when no alias exists)', async () => {
    serveStations([{ id: 'station-1', name: 'Legacy', status: 'active' }]);
    const [station] = await new WeatherService(baseUrls).getStations();
    expect(station.id).toBe('station-1');
  });

  it('detail reads go to the alias path', async () => {
    const requested: string[] = [];
    global.fetch = jest.fn(async (input: string | URL | Request) => {
      requested.push(String(input));
      return new Response(JSON.stringify({ observations: [], submissions: [], overall: 90, dimensions: [] }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;
    const weather = new WeatherService(baseUrls);
    await weather.getLatestObservations('st_3f9a0c12be47');
    await weather.getStationQuality('st_3f9a0c12be47');
    await weather.getSubmissionLog('st_3f9a0c12be47');
    expect(requested).toEqual([
      'https://api.test/stations/st_3f9a0c12be47/observations?limit=1',
      'https://api.test/stations/st_3f9a0c12be47/quality',
      'https://api.test/stations/st_3f9a0c12be47/submissions',
    ]);
  });
});
