/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

await jest.unstable_mockModule('react-chartjs-2', () => ({
  Line: ({ data }) =>
    React.createElement('div', {
      'data-testid': 'line-chart',
      'data-point-count': String((data.datasets[0]?.data ?? []).length),
    }),
}));

await jest.unstable_mockModule('chart.js', () => ({
  Chart: { register: () => {} },
  CategoryScale: class {},
  LinearScale: class {},
  PointElement: class {},
  LineElement: class {},
  Title: class {},
  Tooltip: class {},
  Legend: class {},
  Filler: class {},
}));

await jest.unstable_mockModule('lucide-react', () => ({
  Pickaxe: () => React.createElement('span', { 'data-testid': 'icon-pickaxe' }),
  TrendingUp: () => React.createElement('span'),
  Activity: () => React.createElement('span'),
  Zap: () => React.createElement('span'),
}));

// The no-prop path ENABLES the query (`enabled: miningData === undefined`), so
// these two tests run through the real query. Mock the transport, not the hook:
// mocking useQuery would test the mock, whereas this still exercises
// fetchMiningData -> normalizeMiningData -> the empty-state branch.
const getWithFallback = jest.fn(async () => ({ mining: {} }));
await jest.unstable_mockModule('../../services/apiClient', () => ({
  apiClient: { getWithFallback: (...a) => getWithFallback(...a) },
  default: { getWithFallback: (...a) => getWithFallback(...a) },
}));

const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query');
const { default: MiningChart } = await import('../Network/MiningChart.jsx');

// MiningChart calls useQuery (`['dashboard','mining-performance']`, enabled only
// when the miningData prop is undefined), so it needs a QueryClient in context.
// These tests predate that hook and rendered it bare, which threw
// "No QueryClient set" before a single assertion ran — all six failed on the
// harness, not on the behaviour (frontend#269).
//
// A FRESH client per render, with retries off: a shared client would leak cache
// between tests, so the second test asserting an empty state could pass on the
// first test's data instead of on its own.
function renderWithQuery(element) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(
    React.createElement(QueryClientProvider, { client }, element),
  );
}

describe('MiningChart — real-data wiring', () => {
  test('shows empty state and "--" stats when no miningData prop', async () => {
    renderWithQuery(React.createElement(MiningChart, {}));
    // A loading alert renders first now that the component queries live
    // telemetry, so the empty state is asserted after the query settles.
    // Asserting the loading text instead would no longer test the empty state.
    expect(await screen.findByText('No mining data yet')).toBeInTheDocument();
    expect(getWithFallback).toHaveBeenCalled();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    const dashes = screen.getAllByText(/--/);
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  test('shows empty state when miningData is null', () => {
    renderWithQuery(React.createElement(MiningChart, { miningData: null }));
    expect(screen.getByText('No mining data yet')).toBeInTheDocument();
  });

  test('renders chart when real mining data is provided for 24h', () => {
    const miningData = {
      '24h': {
        labels: ['12:00', '13:00', '14:00'],
        hashRate: [450.2, 462.1, 455.8],
        earnings: [1.21, 1.24, 1.19],
      },
    };
    renderWithQuery(React.createElement(MiningChart, { miningData }));
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.queryByText('No mining data yet')).not.toBeInTheDocument();
  });

  test('shows real stat values when data is provided', () => {
    const miningData = {
      '24h': {
        labels: ['12:00', '13:00'],
        hashRate: [450.0, 460.0],
        earnings: [1.2, 1.3],
      },
    };
    renderWithQuery(React.createElement(MiningChart, { miningData }));
    expect(screen.queryByText(/--/)).not.toBeInTheDocument();
  });

  test('time range tabs render and are clickable', async () => {
    renderWithQuery(React.createElement(MiningChart, {}));
    expect(screen.getByText('24h')).toBeInTheDocument();
    expect(screen.getByText('7d')).toBeInTheDocument();
    expect(screen.getByText('30d')).toBeInTheDocument();
    // Same reason as above: wait for the query to settle before asserting the
    // empty state, or this reads the loading alert instead.
    await screen.findByText('No mining data yet');
    fireEvent.click(screen.getByText('7d'));
    expect(screen.getByText('No mining data yet')).toBeInTheDocument();
  });

  test('switching to 7d range with data shows chart', () => {
    const miningData = {
      '24h': { labels: [], hashRate: [], earnings: [] },
      '7d': {
        labels: ['Mon', 'Tue'],
        hashRate: [451.0, 448.5],
        earnings: [1.25, 1.18],
      },
    };
    renderWithQuery(React.createElement(MiningChart, { miningData }));
    fireEvent.click(screen.getByText('7d'));
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});
