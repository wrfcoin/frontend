import { describe, expect, it, jest } from '@jest/globals';

import { normalizeStationStatus } from '../../services/apiClient/weatherService';
import {
  buildWeatherStationViewModel,
  formatRelativeTime,
  mapWeatherStatus,
  metersPerSecondToMph,
  stationStatusPresentation,
  sumDefined,
  toFahrenheit,
} from '../weatherViewModels';

describe('weatherViewModels', () => {
  it('converts Celsius to Fahrenheit', () => {
    expect(toFahrenheit(0)).toBe(32);
    expect(toFahrenheit(25)).toBe(77);
    expect(toFahrenheit(undefined)).toBeNull();
  });

  it('converts meters per second to mph', () => {
    expect(metersPerSecondToMph(10)).toBeCloseTo(22.3694, 4);
    expect(metersPerSecondToMph(null)).toBeNull();
  });

  it('formats relative time from the current clock', () => {
    const now = new Date('2026-03-23T12:00:00.000Z').getTime();
    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(now);

    expect(formatRelativeTime('2026-03-23T11:58:00.000Z')).toBe('2 min ago');
    expect(formatRelativeTime('2026-03-23T09:00:00.000Z')).toBe('3 hr ago');
    expect(formatRelativeTime(undefined)).toBe('No recent readings');

    dateSpy.mockRestore();
  });

  it('builds a live station view model from API data', () => {
    const viewModel = buildWeatherStationViewModel({
      station: {
        id: 'ws-1',
        name: 'Station One',
        status: 'live',
        location: 'Rooftop',
        latitude: 40.71,
        longitude: -74.0,
      },
      observations: [
        {
          stationId: 'ws-1',
          timestamp: '2026-03-23T11:55:00.000Z',
          temperatureC: 20,
          humidityPct: 61,
          pressureHpa: 1012.4,
          windSpeedMs: 5,
          windDirectionDeg: 190,
          rainRateMmHr: 2.54,
          uvIndex: 4,
        },
        {
          stationId: 'ws-1',
          timestamp: '2026-03-23T11:50:00.000Z',
          temperatureC: 18,
          humidityPct: 58,
          pressureHpa: 1011.1,
          windSpeedMs: 3,
        },
      ],
      quality: {
        stationId: 'ws-1',
        overall: 92,
        dimensions: [],
      },
      earnings: {
        stationId: 'ws-1',
        today: '350000000',
        thisWeek: '1120000000',
        thisMonth: '2800000000',
        allTime: '14040000000',
        currentRate: '50000000',
        lifetime: null,
        rate: null,
        window: null,
      },
      submissions: [
        {
          id: 'sub-1',
          stationId: 'ws-1',
          timestamp: '2026-03-23T11:55:00.000Z',
          success: true,
          summary: 'ok',
        },
        {
          id: 'sub-2',
          stationId: 'ws-1',
          timestamp: '2026-03-23T11:45:00.000Z',
          success: false,
          summary: 'retry',
        },
      ],
    });

    expect(viewModel.status).toBe('online');
    expect(viewModel.temperatureF).toBe(68);
    expect(viewModel.windSpeedMph).toBeCloseTo(11.1847, 4);
    expect(viewModel.precipitationIn).toBeCloseTo(0.1, 3);
    expect(viewModel.quality).toBe(92);
    expect(viewModel.validationRate).toBe(50);
    expect(viewModel.earningsToday).toBe('350000000');
    expect(viewModel.earningsAllTime).toBe('14040000000');
    expect(viewModel.earningsRatePerDay).toBe(12);
    expect(viewModel.history).toHaveLength(2);
  });

  it('keeps u128-scale ordinary totals exact and unavailable values out of zero sums', () => {
    const u128 = '340282366920938463463374607431768211455';
    const viewModel = buildWeatherStationViewModel({
      station: { id: 'ws-u128', name: 'Large Station', status: 'live' },
      observations: [],
      quality: null,
      earnings: {
        stationId: 'ws-u128',
        today: u128,
        thisWeek: u128,
        thisMonth: u128,
        allTime: u128,
        currentRate: u128,
        lifetime: null,
        rate: null,
        window: null,
      },
      submissions: [],
    });

    expect(viewModel.earningsToday).toBe(u128);
    expect(viewModel.earningsThisWeek).toBe(u128);
    expect(viewModel.earningsAllTime).toBe(u128);
    expect(viewModel.earningsRatePerDay).toBeNull();
    expect(sumDefined([u128, '1'])).toBe('340282366920938463463374607431768211456');
    expect(sumDefined([null])).toBeNull();
  });
});

// frontend#415: backend#1263 sends observation freshness. The owner ruled
// neutral station labels, so a never-reported station is not "Offline".
describe('station status labels', () => {
  const label = (raw: unknown) =>
    stationStatusPresentation(mapWeatherStatus(normalizeStationStatus(raw))).label;

  it('maps the three freshness states to Online, Stale and Registered (no recent data)', () => {
    expect(label('live')).toBe('Online');
    expect(label('stale')).toBe('Stale');
    expect(label('registered')).toBe('Registered (no recent data)');
    expect(label(' LIVE ')).toBe('Online');
  });

  it('gives registered a neutral colour, not the offline red', () => {
    expect(stationStatusPresentation('registered').color).not.toBe(stationStatusPresentation('offline').color);
    expect(stationStatusPresentation('registered').color).toBe('#94A3B8');
  });

  it('falls back to "Status unknown" for anything unrecognised', () => {
    for (const raw of ['bogus', '', null, undefined, 42, {}]) {
      expect(normalizeStationStatus(raw)).toBe('unknown');
      expect(label(raw)).toBe('Status unknown');
    }
    expect(stationStatusPresentation('not-a-status').label).toBe('Status unknown');
    expect(stationStatusPresentation(undefined).label).toBe('Status unknown');
  });

  it('keeps the legacy spellings working', () => {
    expect(label('online')).toBe('Online');
    expect(label('active')).toBe('Online');
    expect(label('offline')).toBe('Offline');
    expect(label('inactive')).toBe('Offline');
    expect(label('maintenance')).toBe('Degraded');
  });
});

