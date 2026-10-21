/** @jest-environment jsdom */
// frontend#442 review (SOL-C): the REAL EarningsChart (only the canvas wrapper and the history hook are
// substituted). The backend serves a recent observation window with no proof of daily coverage, so a
// per-day average and a moving average are demo-surface only: default build (no demo surfaces).
import React from 'react';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const datasets: string[][] = [];
await jest.unstable_mockModule('react-chartjs-2', () => ({
  Line: ({ data }: { data: { datasets: Array<{ label: string }> } }) => {
    datasets.push(data.datasets.map((d) => d.label));
    return <div data-testid="line-chart" />;
  },
}));
// One proven 2 WRF reward today, in base units (10^8 per WRF).
await jest.unstable_mockModule('../../../hooks/api/useEarningsQueries', () => ({
  useWeatherEarningsHistory: () => ({
    data: [{ id: 'c'.repeat(64), stationId: 'station-1', timestamp: new Date(Date.now() - 60_000).toISOString(), amount: '200000000', rewardType: 'Reward' }],
    isLoading: false,
    isError: false,
    error: null,
  }),
}));

const { default: EarningsChart } = await import('../EarningsChart');

describe('EarningsChart, default build (no demo surfaces)', () => {
  it('shows the window total but no Avg/day, no Avg switch and no moving-average series', () => {
    render(<EarningsChart stationId="station-1" periodView="daily" />);
    expect(screen.getByText(/Total:/)).toHaveTextContent('2.00 WRF');
    const labels = datasets[datasets.length - 1];
    expect(screen.queryByText(/Avg\/day/)).not.toBeInTheDocument();
    expect(screen.queryByText('Avg')).not.toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(labels.some((l) => /Moving Avg/.test(l))).toBe(false);
    expect(document.body.textContent).not.toMatch(/\/day|per day|Avg/);
  });
});
