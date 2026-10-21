/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockUseWeatherStations = jest.fn();
const mockUseLatestObservations = jest.fn();
const mockUseStationQuality = jest.fn();
const mockUseSubmissionLog = jest.fn();
const mockUseWeatherEarnings = jest.fn();
const mockUseWeatherEarningsHistory = jest.fn();

const mockUseWeatherStationSnapshots = jest.fn();

await jest.unstable_mockModule('../../../hooks/api/useWeatherQueries', () => ({
  useWeatherStations: mockUseWeatherStations,
  useWeatherStationSnapshots: mockUseWeatherStationSnapshots,
  useLatestObservations: mockUseLatestObservations,
  useStationQuality: mockUseStationQuality,
  useSubmissionLog: mockUseSubmissionLog,
}));

await jest.unstable_mockModule('../../../hooks/api/useEarningsQueries', () => ({
  useWeatherEarnings: mockUseWeatherEarnings,
  useWeatherEarningsHistory: mockUseWeatherEarningsHistory,
}));

await jest.unstable_mockModule('../LiveDataFeed', () => ({
  default: ({ channels }: { channels: unknown[] }) => (
    <div data-testid="live-data-feed">channels:{channels.length}</div>
  ),
}));

await jest.unstable_mockModule('../QualityMonitor', () => ({
  default: ({ quality }: { quality: { overall: number } }) => (
    <div data-testid="quality-monitor">quality:{quality.overall}</div>
  ),
}));

await jest.unstable_mockModule('../EarningsTimeline', () => ({
  default: ({ dataPoints }: { dataPoints: unknown[] }) => (
    <div data-testid="earnings-timeline">points:{dataPoints.length}</div>
  ),
}));

await jest.unstable_mockModule('../SubmissionLog', () => ({
  default: ({ entries }: { entries: unknown[] }) => (
    <div data-testid="submission-log">entries:{entries.length}</div>
  ),
}));

const { default: WeatherContributorDashboard } = await import('../WeatherContributorDashboard');

function queryResult(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    error: null,
    isLoading: false,
    isError: false,
    ...overrides,
  };
}

describe('WeatherContributorDashboard live wiring states', () => {
  beforeEach(() => {
    mockUseWeatherStationSnapshots.mockReturnValue(queryResult({ data: [] }));
    mockUseWeatherStations.mockReturnValue(
      queryResult({
        data: [{ id: 'station-1', name: 'Station 1', status: 'live', location: 'NY' }],
      }),
    );
    mockUseLatestObservations.mockReturnValue(
      queryResult({
        data: [
          {
            stationId: 'station-1',
            timestamp: new Date().toISOString(),
            temperatureC: 21.4,
            humidityPct: 63,
          },
        ],
      }),
    );
    mockUseStationQuality.mockReturnValue(
      queryResult({ data: { stationId: 'station-1', overall: 92, dimensions: [] } }),
    );
    mockUseSubmissionLog.mockReturnValue(
      queryResult({
        data: [
          {
            id: 'log-1',
            stationId: 'station-1',
            timestamp: new Date().toISOString(),
            success: true,
            summary: 'ok',
            qualityScore: 90,
            wrfEarned: 0.4,
          },
        ],
      }),
    );
    mockUseWeatherEarnings.mockReturnValue(
      queryResult({
        data: {
          stationId: 'station-1',
          today: 2.4,
          thisWeek: 12,
          thisMonth: 40,
          allTime: 300,
          currentRate: 0.1,
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
            amount: 1.2,
            rewardType: 'Data Quality Bonus',
          },
        ],
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading skeleton when stations query is loading', () => {
    mockUseWeatherStations.mockReturnValue(queryResult({ isLoading: true }));

    render(<WeatherContributorDashboard />);

    expect(screen.getByText('Loading weather stations...')).toBeInTheDocument();
  });

  it('shows stations API error state without mock fallback', () => {
    mockUseWeatherStations.mockReturnValue(
      queryResult({ isError: true, error: new Error('stations endpoint down') }),
    );

    render(<WeatherContributorDashboard />);

    expect(screen.getByText('stations endpoint down')).toBeInTheDocument();
    expect(screen.queryByText('Rooftop Alpha')).not.toBeInTheDocument();
  });

  it('shows empty state when stations list is unavailable', () => {
    mockUseWeatherStations.mockReturnValue(queryResult({ data: [] }));

    render(<WeatherContributorDashboard />);

    expect(
      screen.getByText('No weather stations are currently available.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Rooftop Alpha')).not.toBeInTheDocument();
  });

  it('renders live weather data path successfully', () => {
    render(<WeatherContributorDashboard />);

    expect(screen.getByText('DATA HUB')).toBeInTheDocument();
    expect(screen.getByText('1/1 LIVE')).toBeInTheDocument();
    expect(screen.getByTestId('live-data-feed')).toHaveTextContent('channels:2');
    expect(screen.getByTestId('quality-monitor')).toHaveTextContent('quality:92');
    expect(screen.getByTestId('submission-log')).toHaveTextContent('entries:1');
    expect(screen.getByTestId('earnings-timeline')).toHaveTextContent('points:1');
  });
});
