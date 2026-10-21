/** @jest-environment jsdom */
// frontend#442 review (SOL-A r2): across the autumn DST change the oldest displayed local day is 25 hours
// long, so a constant `days * 24h` cutoff dropped its early rewards. The REAL EarningsChart (only the canvas
// wrapper and the history hook are substituted), in America/Los_Angeles, at 2026-11-02 23:30 PST, 7D view.
// Only meaningful in a worker STARTED with TZ=America/Los_Angeles: EarningsChart.dst.test.tsx spawns it that way.
// (Assigning process.env.TZ inside Jest does not move an already-started worker's zone.)
import React from 'react';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

type Dataset = { label: string; data: Array<number | null> };
const charts: Array<{ labels: string[]; datasets: Dataset[] }> = [];
await jest.unstable_mockModule('react-chartjs-2', () => ({
  Line: ({ data }: { data: { labels: string[]; datasets: Dataset[] } }) => {
    charts.push(data);
    return <div data-testid="line-chart" />;
  },
}));

const WRF = '100000000'; // 1 WRF in base units (10^8 per WRF)
const reward = (id: string, iso: string) => ({ id: id.repeat(64), stationId: 'station-1', timestamp: iso, amount: WRF, rewardType: 'Reward' });
const history = [
  reward('a', '2026-10-27T07:00:00Z'), // 2026-10-27 00:00 PDT: the first instant of the oldest displayed day
  reward('b', '2026-10-27T06:59:59Z'), // 2026-10-26 23:59:59 PDT: the day before the window
  reward('c', '2026-11-03T07:31:00Z'), // one minute in the future
];
await jest.unstable_mockModule('../../../hooks/api/useEarningsQueries', () => ({
  useWeatherEarningsHistory: () => ({ data: history, isLoading: false, isError: false, error: null }),
}));

const { default: EarningsChart } = await import('../EarningsChart');

const describeInChild = process.env.EARNINGS_DST_CHILD === '1' ? describe : describe.skip;
describeInChild('EarningsChart across the autumn DST change (America/Los_Angeles)', () => {
  beforeEach(() => {
    // Only Date is faked: 2026-11-02 23:30 PST.
    jest.useFakeTimers({
      now: new Date('2026-11-03T07:30:00Z'),
      doNotFake: ['hrtime', 'nextTick', 'performance', 'queueMicrotask', 'setImmediate', 'clearImmediate',
        'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'],
    });
  });
  afterEach(() => jest.useRealTimers());

  it('runs in the intended zone (the fixture means what it says)', () => {
    const first = new Date('2026-10-27T07:00:00Z');
    expect([first.getDate(), first.getHours()]).toEqual([27, 0]);
    const now = new Date();
    expect([now.getMonth(), now.getDate(), now.getHours(), now.getMinutes()]).toEqual([10, 2, 23, 30]);
  });

  it('7D counts a reward at the oldest displayed local midnight; the day before and the future stay out', () => {
    render(<EarningsChart stationId="station-1" periodView="daily" />);
    fireEvent.click(screen.getByRole('button', { name: '7D' }));
    const chart = charts[charts.length - 1];
    expect(chart.labels).toEqual(['Oct 27', 'Oct 28', 'Oct 29', 'Oct 30', 'Oct 31', 'Nov 1', 'Nov 2']);
    const daily = chart.datasets.find((d) => d.label.startsWith('Daily Earnings'));
    const cumulative = chart.datasets.find((d) => d.label.startsWith('Cumulative'));
    expect(daily?.data).toEqual([1, 0, 0, 0, 0, 0, 0]);
    expect(cumulative?.data).toEqual([1, 1, 1, 1, 1, 1, 1]);
    expect(screen.getByText(/Total:/)).toHaveTextContent('1.00 WRF');
  });
});
