/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockUseBackendHealth = jest.fn();

jest.unstable_mockModule('../../../hooks/api/useBackendHealth', () => ({
  useBackendHealth: mockUseBackendHealth,
}));

jest.unstable_mockModule('../NewDashboard.css', () => ({}));

jest.unstable_mockModule('../HeroStatsBar', () => ({
  default: () => <div>mock-hero-stats</div>,
}));
jest.unstable_mockModule('../PortfolioCard', () => ({
  default: () => <div>mock-portfolio-card</div>,
}));
jest.unstable_mockModule('../QuickActions', () => ({
  default: () => <div>mock-quick-actions</div>,
}));
jest.unstable_mockModule('../RecentTransactions', () => ({
  default: () => <div>mock-recent-transactions</div>,
}));
jest.unstable_mockModule('../../Weather/WeatherMap', () => ({
  default: () => <div>mock-weather-map</div>,
}));
jest.unstable_mockModule('../../Weather/StationCarousel', () => ({
  default: () => <div>mock-station-carousel</div>,
}));
jest.unstable_mockModule('../../Weather/ImpactScore', () => ({
  default: () => <div>mock-impact-score</div>,
}));
jest.unstable_mockModule('../../Earnings/EarningsDashboard', () => ({
  default: () => <div>mock-earnings-dashboard</div>,
}));
jest.unstable_mockModule('../../Earnings/PendingPayouts', () => ({
  default: () => <div>mock-pending-payouts</div>,
}));
jest.unstable_mockModule('../../Earnings/EarningsCalendar', () => ({
  default: () => <div>mock-earnings-calendar</div>,
}));
jest.unstable_mockModule('../../Network/NodeStatusPanel', () => ({
  default: () => <div>mock-node-status-panel</div>,
}));
jest.unstable_mockModule('../../Network/MiningChart', () => ({
  default: () => <div>mock-mining-chart</div>,
}));
jest.unstable_mockModule('../../Network/NetworkHealth', () => ({
  default: () => <div>mock-network-health</div>,
}));
jest.unstable_mockModule('../../RealTime/BackendUnavailableBanner', () => ({
  default: () => <div>mock-backend-banner</div>,
}));

const { default: NewDashboard } = await import('../NewDashboard');

function queryResult(overrides = {}) {
  return {
    data: undefined,
    error: null,
    isLoading: false,
    isError: false,
    ...overrides,
  };
}

describe('NewDashboard', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading state while the health check is in flight', () => {
    mockUseBackendHealth.mockReturnValue(queryResult({ isLoading: true }));

    render(<NewDashboard />);

    expect(screen.getByText('Checking WRFCoin backend health...')).toBeInTheDocument();
  });

  it('shows the disconnected banner instead of dashboard cards when backend health fails', () => {
    mockUseBackendHealth.mockReturnValue(
      queryResult({ isError: true, error: new Error('backend unavailable') }),
    );

    render(<NewDashboard />);

    expect(screen.getByText('Backend disconnected')).toBeInTheDocument();
    expect(screen.getByText('mock-backend-banner')).toBeInTheDocument();
    expect(screen.queryByText('mock-hero-stats')).not.toBeInTheDocument();
  });

  it('renders the dashboard body when backend health succeeds', async () => {
    mockUseBackendHealth.mockReturnValue(queryResult({ data: { ok: true } }));

    render(<NewDashboard />);

    expect(await screen.findByText('mock-hero-stats')).toBeInTheDocument();
    expect(screen.getByText('Connected to backend')).toBeInTheDocument();
  });
});
