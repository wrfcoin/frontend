/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockUseWeatherStations = jest.fn();
const mockUseWeatherEarnings = jest.fn();
const mockUseWeatherEarningsHistory = jest.fn();
const mockUseStationQuality = jest.fn();

jest.unstable_mockModule('../../../hooks/api/useWeatherQueries', () => ({
  useWeatherStations: mockUseWeatherStations,
  useStationQuality: mockUseStationQuality,
}));

jest.unstable_mockModule('../../../hooks/api/useEarningsQueries', () => ({
  useWeatherEarnings: mockUseWeatherEarnings,
  useWeatherEarningsHistory: mockUseWeatherEarningsHistory,
}));

jest.unstable_mockModule('../EarningsChart', () => ({
  default: ({ stationId }: { stationId: string }) => (
    <div data-testid="earnings-chart">chart:{stationId}</div>
  ),
}));

jest.unstable_mockModule('../RewardBreakdown', () => ({
  default: ({ stationId }: { stationId: string }) => (
    <div data-testid="reward-breakdown">breakdown:{stationId}</div>
  ),
}));

jest.unstable_mockModule('../PayoutHistory', () => ({
  default: ({ stationId }: { stationId: string }) => (
    <div data-testid="payout-history">history:{stationId}</div>
  ),
}));

jest.unstable_mockModule('../EarningsProjection', () => ({
  default: ({ stationId }: { stationId: string }) => (
    <div data-testid="earnings-projection">projection:{stationId}</div>
  ),
}));

const { default: EarningsDashboard } = await import('../EarningsDashboard');

function queryResult(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    error: null,
    isLoading: false,
    isError: false,
    ...overrides,
  };
}

describe('Weather Earnings live wiring states', () => {
  beforeEach(() => {
    mockUseWeatherStations.mockReturnValue(
      queryResult({
        data: [{ id: 'station-1', name: 'Station 1', status: 'live', location: 'NY' }],
      }),
    );
    mockUseWeatherEarnings.mockReturnValue(
      queryResult({
        data: {
          stationId: 'station-1',
          // base units, 10^8 per WRF: '12000000000' === 120 WRF.
          // These were plain numbers, i.e. 120 BASE UNITS = 0.0000012 WRF, so
          // the component rendered '0.00 WRF' and the assertion below failed.
          today: '200000000',
          thisWeek: '1000000000',
          thisMonth: '3000000000',
          // No lifetime total and no rate exist on the testnet (frontend#437):
          // the backend serves a recent reward-evidence window only.
          allTime: null,
          currentRate: null,
          window: {
            commits: 30,
            complete: false,
            rewardedCommits: 12,
            unknownCommits: 2,
            rewardedBaseUnits: '12000000000',
          },
        },
      }),
    );
    mockUseWeatherEarningsHistory.mockReturnValue(
      queryResult({
        data: [
          {
            id: 'earning-1',
            stationId: 'station-1',
            timestamp: new Date().toISOString(),
            amount: 1,
            rewardType: 'Data Quality Bonus',
            txHash: '0xabc',
          },
        ],
      }),
    );
    mockUseStationQuality.mockReturnValue(
      queryResult({ data: { stationId: 'station-1', overall: 95, dimensions: [] } }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows API error state when stations request fails', () => {
    mockUseWeatherStations.mockReturnValue(
      queryResult({ isError: true, error: new Error('stations failed') }),
    );

    render(<EarningsDashboard />);

    expect(screen.getByText('stations failed')).toBeInTheDocument();
    expect(screen.queryByText('Downtown Station Alpha')).not.toBeInTheDocument();
  });

  it('shows empty state when no stations are available', () => {
    mockUseWeatherStations.mockReturnValue(queryResult({ data: [] }));

    render(<EarningsDashboard />);

    expect(
      screen.getByText('No weather stations available for earnings analytics.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Downtown Station Alpha')).not.toBeInTheDocument();
  });

  it('renders loading skeleton for station earnings queries', () => {
    mockUseWeatherEarnings.mockReturnValue(queryResult({ isLoading: true }));

    const { container } = render(<EarningsDashboard />);

    expect(container.querySelector('.MuiSkeleton-root')).toBeTruthy();
  });

  it('renders the honest not-live notice for the backend earnings gap', () => {
    const error = new Error('no per-station reward ledger is exposed');
    error.name = 'StationEarningsUnavailableError';
    mockUseWeatherEarnings.mockReturnValue(queryResult({ isError: true, error }));

    render(<EarningsDashboard />);

    expect(screen.getByText('Not live on the testnet yet')).toBeInTheDocument();
    expect(screen.queryByText('0 WRF')).not.toBeInTheDocument();
  });

  it('renders the not-live notice when the station has no live quality score', () => {
    mockUseStationQuality.mockReturnValue(
      queryResult({ isError: true, error: new Error('STATION_QUALITY_NOT_LIVE') }),
    );

    render(<EarningsDashboard />);

    expect(screen.getByText('Not live on the testnet yet')).toBeInTheDocument();
    expect(screen.queryByText(/Unable to load station earnings data/)).not.toBeInTheDocument();
  });

  it('renders live earnings data successfully', () => {
    render(<EarningsDashboard />);

    expect(screen.getByText('Weather Earnings')).toBeInTheDocument();
    // EXACTLY two elements show the all-time total: the h2 hero and the h5
    // beside it. `.length > 0` passed even when the hero was mutated to print
    // raw base units, because the other element still matched — the assertion
    // did not pin WHICH element rendered correctly. Pinning the count makes
    // breaking either one fail (frontend#269).
    expect(screen.getAllByText(/120\.00 WRF/)).toHaveLength(1);
    expect(screen.getByText('Rewarded in the recent window')).toBeInTheDocument();
    expect(screen.getByText('Station: Station 1')).toBeInTheDocument();
    expect(screen.getByText('Quality: 95/100')).toBeInTheDocument();
    expect(screen.getByTestId('earnings-chart')).toHaveTextContent('chart:station-1');
  });

  // frontend#437: the page shows only what the backend proves. The recent
  // window is labelled as such; there is no lifetime total, no USD value, no
  // rate, no projection and no per-type breakdown in the default build.
  it('labels the recent window and shows no invented values', () => {
    const { container } = render(<EarningsDashboard />);

    const note = screen.getByTestId('earnings-window-note');
    expect(note).toHaveTextContent('12 rewarded of the last 30 observations');
    expect(note).toHaveTextContent('2 without readable evidence yet');
    expect(note).toHaveTextContent('partial window');
    expect(note).toHaveTextContent('Not a lifetime total');
    expect(note).toHaveTextContent('Testnet WRF has no monetary value');

    const text = container.textContent ?? '';
    expect(text).not.toMatch(/USD|\$\s?\d/);
    expect(text).not.toMatch(/All Time|Lifetime earnings|\/day|per day/i);
    expect(screen.queryByRole('button', { name: 'Projections' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('earnings-projection')).not.toBeInTheDocument();
    expect(screen.queryByTestId('reward-breakdown')).not.toBeInTheDocument();
    expect(screen.getByTestId('reward-breakdown-unavailable')).toHaveTextContent(
      'A breakdown by reward type is not available on this testnet',
    );
  });

  it('says reward evidence is unavailable when the window is missing', () => {
    mockUseWeatherEarnings.mockReturnValue(
      queryResult({
        data: { stationId: 'station-1', today: null, thisWeek: null, thisMonth: null, allTime: null, currentRate: null, window: null },
      }),
    );

    render(<EarningsDashboard />);

    expect(screen.getByTestId('earnings-window-note')).toHaveTextContent('Reward evidence unavailable.');
  });
});
