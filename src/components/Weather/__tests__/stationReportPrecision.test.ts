import { describe, expect, it } from '@jest/globals';
import { buildStationReportEarningsChartData } from '../stationReportPrecision';

const entry = (amount: string) => ({
  id: amount,
  stationId: 'station-1',
  timestamp: '2026-03-01T00:00:00.000Z',
  amount,
  rewardType: 'Quality',
});

describe('Station Report amount chart boundary', () => {
  it('converts safe ordinary amounts to chart numbers', () => {
    const chart = buildStationReportEarningsChartData([entry('150000000')]);
    expect(chart.data).toEqual([1.5]);
  });

  it('converts u64-scale strings through the guarded adapter', () => {
    const chart = buildStationReportEarningsChartData([entry('18446744073709551615')]);
    expect(typeof chart.data[0]).toBe('number');
    expect(chart.data[0]).toBeCloseTo(184467440737.0955, 3);
    expect(chart.data[0]).not.toBe('18446744073709551615');
  });

  it('emits an unavailable chart gap for u128-scale values, never zero', () => {
    const chart = buildStationReportEarningsChartData([
      entry('340282366920938463463374607431768211455'),
    ]);
    expect(chart.data).toEqual([null]);
    expect(chart.data).not.toEqual([0]);
  });
});
