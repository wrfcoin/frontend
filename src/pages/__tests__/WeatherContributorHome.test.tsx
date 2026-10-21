/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

// Mirrors the real backend response shape (server/routes/blockchain-routes.js:67)
// and the BlockchainStatus type in services/api.ts — `mockResolvedValue`/
// `mockRejectedValue` need this generic to type-check under @jest/globals;
// bare `jest.fn()` infers a `never` return and both calls fail tsc.
interface MockBlockchainStatus {
  blockHeight: number;
  difficulty: string;
  totalSupply: string;
  circulating: string;
  networkHashRate: string;
  lastBlockTime: number;
}

const mockUseNavigate = jest.fn();
const mockUseWeatherStations = jest.fn();
const mockUseWeatherStationSnapshots = jest.fn();
const mockUseBackendHealth = jest.fn();
const mockGetInfo = jest.fn<() => Promise<MockBlockchainStatus>>();

jest.unstable_mockModule('react-router', () => ({
  useNavigate: () => mockUseNavigate,
}));

jest.unstable_mockModule('../../hooks/api/useWeatherQueries', () => ({
  useWeatherStations: mockUseWeatherStations,
  useWeatherStationSnapshots: mockUseWeatherStationSnapshots,
}));

jest.unstable_mockModule('../../hooks/api/useBackendHealth', () => ({
  useBackendHealth: mockUseBackendHealth,
  // Real outage (network/5xx) vs. "the edge just doesn't admit this path"
  // (404) are different for an anonymous visitor — mark the latter with
  // `notFound` so tests can tell renderHome() which one they mean.
  isBackendUnavailableError: (error: unknown) =>
    Boolean(error) &&
    !(error as { notFound?: boolean; authRequired?: boolean } | null)?.notFound &&
    !(error as { authRequired?: boolean } | null)?.authRequired,
  // frontend#299: a 401/403 is a sign-in prompt, not an outage — marked with
  // `authRequired` the same way.
  isAuthRequiredError: (error: unknown) =>
    Boolean((error as { authRequired?: boolean } | null)?.authRequired),
  getBackendUnavailableMessage: (error: unknown) =>
    error instanceof Error ? error.message : null,
}));

function notAdmittedError(message: string) {
  return Object.assign(new Error(message), { notFound: true });
}

function authRequiredError(message: string) {
  return Object.assign(new Error(message), { authRequired: true });
}

// NetworkStatusStrip's GET /api/blockchain/status read — never let the real
// implementation fire a network call from a jsdom test.
jest.unstable_mockModule('../../services/api', () => ({
  blockchainAPI: { getInfo: mockGetInfo },
}));

const { default: WeatherContributorHome } = await import('../WeatherContributorHome');

function renderHome() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <WeatherContributorHome />
    </QueryClientProvider>,
  );
}

function queryResult(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    error: null,
    isLoading: false,
    isError: false,
    ...overrides,
  };
}

describe('WeatherContributorHome', () => {
  beforeEach(() => {
    mockUseNavigate.mockReset();
    mockGetInfo.mockReset();
    mockGetInfo.mockRejectedValue(new Error('not admitted in this test'));
    mockUseBackendHealth.mockReturnValue(queryResult({ data: { ok: true } }));
    mockUseWeatherStations.mockReturnValue(
      queryResult({
        data: [{ id: 'station-1', name: 'Station Alpha', status: 'live', location: 'Rooftop' }],
      }),
    );
    mockUseWeatherStationSnapshots.mockReturnValue(
      queryResult({
        data: [
          {
            station: { id: 'station-1', name: 'Station Alpha', status: 'live', location: 'Rooftop' },
            observations: [
              {
                stationId: 'station-1',
                timestamp: new Date().toISOString(),
                temperatureC: 20,
              },
            ],
            quality: { stationId: 'station-1', overall: 91, dimensions: [] },
            earnings: {
              stationId: 'station-1',
              today: '250000000',
              thisWeek: '1020000000',
              thisMonth: '4080000000',
              allTime: '10150000000',
              currentRate: '10000000',
            },
            submissions: [
              {
                id: 'submission-1',
                stationId: 'station-1',
                timestamp: new Date().toISOString(),
                success: true,
                summary: 'ok',
              },
            ],
          },
        ],
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows a blocking disconnected banner when backend health fails', () => {
    mockUseBackendHealth.mockReturnValue(
      queryResult({ isError: true, error: new Error('backend unavailable') }),
    );

    renderHome();

    expect(screen.getByText('Cannot connect to WRFCoin backend (localhost:4001).')).toBeInTheDocument();
    expect(screen.queryByText('Station Alpha')).not.toBeInTheDocument();
  });

  it('shows the empty state when the backend is reachable but no stations exist', () => {
    mockUseWeatherStations.mockReturnValue(queryResult({ data: [] }));
    mockUseWeatherStationSnapshots.mockReturnValue(queryResult({ data: [] }));

    renderHome();

    expect(
      screen.getByText('No stations connected yet. Register your first station to unlock live quality and earnings data.'),
    ).toBeInTheDocument();
  });

  it('renders live station, quality, and earnings data without mock placeholders', () => {
    renderHome();

    expect(screen.getByText('Station Alpha')).toBeInTheDocument();
    expect(screen.getByText('2.50 WRF')).toBeInTheDocument();
    expect(screen.getAllByText('91/100').length).toBeGreaterThan(0);
  });

  it('renders exact u128 totals without routing them through a chart number', () => {
    const u128 = '340282366920938463463374607431768211455';
    mockUseWeatherStationSnapshots.mockReturnValue(
      queryResult({
        data: [{
          station: { id: 'station-1', name: 'Station Alpha', status: 'live', location: 'Rooftop' },
          observations: [],
          quality: null,
          earnings: {
            stationId: 'station-1',
            today: u128,
            thisWeek: u128,
            thisMonth: u128,
            allTime: u128,
            currentRate: u128,
          },
          submissions: [],
        }],
      }),
    );

    renderHome();

    expect(screen.getAllByText('3,402,823,669,209,384,634,633,746,074,317.68 WRF')).toHaveLength(3);
    expect(screen.queryByText(/0\.00 WRF/)).not.toBeInTheDocument();
  });

  it('renders unavailable totals as a marker instead of a numeric zero', () => {
    mockUseWeatherStationSnapshots.mockReturnValue(
      queryResult({
        data: [{
          station: { id: 'station-1', name: 'Station Alpha', status: 'live', location: 'Rooftop' },
          observations: [],
          quality: null,
          earnings: null,
          submissions: [],
        }],
      }),
    );

    renderHome();

    expect(screen.getAllByText('Unavailable WRF')).toHaveLength(3);
    expect(screen.queryByText(/0\.00 WRF/)).not.toBeInTheDocument();
  });

  it('shows a sign-in prompt with a next action, never the raw backend string, when the stations read is unauthenticated (401)', () => {
    mockUseBackendHealth.mockReturnValue(queryResult({ data: { status: 'ok' } }));
    mockUseWeatherStations.mockReturnValue(
      queryResult({ isError: true, error: authRequiredError('Bearer Token Required') }),
    );
    mockUseWeatherStationSnapshots.mockReturnValue(queryResult({ data: [] }));

    renderHome();

    expect(screen.getByText('Sign in to see your station fleet')).toBeInTheDocument();
    expect(screen.getByTestId('home-sign-in-cta')).toHaveTextContent('Get started');
    expect(screen.queryByText(/Bearer Token Required/)).not.toBeInTheDocument();
    expect(screen.queryByText('Not live on the testnet yet')).not.toBeInTheDocument();
    expect(screen.queryByText(/Cannot connect to WRFCoin backend/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('home-sign-in-cta'));
    expect(mockUseNavigate).toHaveBeenCalledWith('/onboarding');
  });

  it('shows the honest public-viewer notice, not the dev-facing outage banner, when the edge simply has not admitted these paths (404)', () => {
    mockUseBackendHealth.mockReturnValue(
      queryResult({ isError: true, error: notAdmittedError('Not Found') }),
    );
    mockUseWeatherStations.mockReturnValue(
      queryResult({ isError: true, error: notAdmittedError('Not Found') }),
    );
    mockUseWeatherStationSnapshots.mockReturnValue(queryResult({ data: [] }));

    renderHome();

    expect(screen.getByText('Not live on the testnet yet')).toBeInTheDocument();
    expect(
      screen.getByText('This view will populate once its data source is connected.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Cannot connect to WRFCoin backend (localhost:4001).')).not.toBeInTheDocument();
    expect(screen.queryByText(/Unable to load live station data/)).not.toBeInTheDocument();
  });

  it('shows a live network status chip fed by the admitted GET /api/blockchain/status read', async () => {
    mockGetInfo.mockReset();
    mockGetInfo.mockResolvedValue({
      blockHeight: 123456,
      difficulty: '1',
      totalSupply: '0',
      circulating: '0',
      networkHashRate: '0',
      lastBlockTime: Date.now(),
    });

    renderHome();

    expect(await screen.findByText('Testnet live — block 123,456')).toBeInTheDocument();
  });
});
