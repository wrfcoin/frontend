import { describe, expect, it } from '@jest/globals';

import {
  buildSubmissionActivity,
  formatStationReward,
} from '../StationAnalyticsDashboard';

describe('Station Analytics amount display', () => {
  it('keeps exact rewards and marks malformed rewards unavailable', () => {
    expect(formatStationReward('340282366920938463463374607431768211455')).toBe(
      '3,402,823,669,209,384,634,633,746,074,317.6821 WRF',
    );
    expect(formatStationReward('invalid')).toBe('Unavailable WRF');

    expect(buildSubmissionActivity([
      {
        id: 'submission-1',
        stationId: 'station-1',
        timestamp: '2026-03-23T11:55:00.000Z',
        success: true,
        summary: 'ok',
      },
      {
        id: 'submission-2',
        stationId: 'station-1',
        timestamp: '2026-03-23T11:54:00.000Z',
        success: true,
        summary: 'large reward',
        wrfEarned: '340282366920938463463374607431768211455',
      },
      {
        id: 'submission-3',
        stationId: 'station-1',
        timestamp: '2026-03-23T11:53:00.000Z',
        success: false,
        summary: 'unavailable reward',
        wrfEarned: 'invalid',
      },
    ]).map((item) => item.message)).toEqual([
      'ok',
      'large reward, 3,402,823,669,209,384,634,633,746,074,317.6821 WRF',
      'unavailable reward, Unavailable WRF',
    ]);
  });
});
