/** @jest-environment jsdom */
// frontend#442 review (SOL-C): the REAL EarningsChart (only the canvas wrapper and the history hook are
// substituted). The backend serves a recent observation window with no proof of daily coverage, so a
// per-day average and a moving average are demo-surface only: demo build (VITE_ENABLE_DEMO_SURFACES).
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
await jest.unstable_mockModule('../../../config/features', () => {
  const FEATURES = { demoSurfaces: true };
  return { default: FEATURES, FEATURES };
});

const { default: EarningsChart } = await import('../EarningsChart');

describe('EarningsChart, demo build (VITE_ENABLE_DEMO_SURFACES)', () => {
  it('keeps the averages behind the demo flag', () => {
    render(<EarningsChart stationId="station-1" periodView="daily" />);
    expect(screen.getByText(/Total:/)).toHaveTextContent('2.00 WRF');
    const labels = datasets[datasets.length - 1];
    expect(screen.getByText(/Avg\/day/)).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeChecked();
    expect(labels.some((l) => /Moving Avg/.test(l))).toBe(true);
  });
});
