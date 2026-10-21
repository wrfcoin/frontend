/** @jest-environment jsdom */
//
// frontend#296 — the Cross-Chain Bridge page presented $11.2B TVL, $736M daily
// volume, "13 integrated bridge protocols" and "248+ blockchain networks" as
// facts, with fabricated wallet balances, while only some protocol cards
// carried a "Demo Data" chip. The main API serves exactly one bridge route:
// GET /api/bridges/capabilities/readiness (bridges.js).
//
//   1. Demo mode OFF (default): the honest not-live state renders, with the
//      real readiness table from the API, and no fabricated figure appears.
//   2. Demo mode OFF, API unreachable: readiness is reported unavailable, no
//      figure is estimated in its place.
//   3. Demo mode ON: the sample page renders only beneath the banner and the
//      "Sample data" badges; the intro no longer claims integration.
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGet = jest.fn();
const featuresMock = { demoSurfaces: false, crossChain: true, bridgeAdvanced: true };

jest.unstable_mockModule('../../../services/apiClient', () => ({
  apiClient: { get: mockGet },
}));
jest.unstable_mockModule('../../../config/features', () => ({
  default: featuresMock,
  FEATURES: featuresMock,
}));
jest.unstable_mockModule('../../../services/bridgeStatusService', () => ({
  default: {
    connect: () => Promise.reject(new Error('no websocket under test')),
    getAllBridgeStatuses: () => ({}),
    getBridgeStatus: () => null,
    subscribe: () => () => {},
    disconnect: () => {},
  },
}));
jest.unstable_mockModule('../../../services/crossChainService', () => ({
  crossChainService: { getRoutes: async () => [], initiateBridge: async () => ({}) },
}));
jest.unstable_mockModule('../../../services/secureWalletStorage', () => ({
  getSecureWallet: () => null,
}));
jest.unstable_mockModule('../../WeatherStationSetup', () => ({
  default: () => null,
}));
jest.unstable_mockModule('../RealTimeBridgeStatus', () => ({
  default: ({ bridge }) => React.createElement('div', { 'data-testid': 'protocol-card' }, bridge.name),
}));

const { default: EnhancedBridgePage } = await import('../EnhancedBridgePage');

const FABRICATED = ['$11.2B', '$736M', '99.7%', '1,234.56', '5,678.90', '8.3 min', '2.8M'];

function readiness() {
  return {
    success: true,
    overallMode: 'simulated',
    capabilities: {
      'bridge.transfer': { capabilityId: 'bridge.transfer', mode: 'simulated', reason: 'No verified validators configured' },
      'bridge.verification': { capabilityId: 'bridge.verification', mode: 'unavailable', reason: 'Validator set is empty' },
      'route.store': { capabilityId: 'route.store', mode: 'production-verified', reason: 'Route store is healthy' },
    },
    signals: { bridgeSafety: 'operational', validatorConfigSource: 'env' },
    timestamp: '2026-09-16T00:00:00.000Z',
  };
}

beforeEach(() => {
  mockGet.mockReset();
  featuresMock.demoSurfaces = false;
});

describe('EnhancedBridgePage — demo mode OFF (default)', () => {
  it('renders the honest not-live state with the real readiness table and no fabricated figures', async () => {
    mockGet.mockResolvedValue(readiness());

    render(<EnhancedBridgePage />);

    expect(screen.getByText('Cross-chain bridging is not live on the testnet yet')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('bridge-readiness-live')).toBeInTheDocument();
    });
    expect(mockGet).toHaveBeenCalledWith('/bridges/capabilities/readiness');
    expect(screen.getByTestId('bridge-readiness-overall')).toHaveTextContent('overall: simulated');
    expect(screen.getByText('No verified validators configured')).toBeInTheDocument();
    expect(screen.getByText('Route store is healthy')).toBeInTheDocument();

    for (const text of FABRICATED) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
    expect(document.body.textContent).not.toMatch(/13 integrated|248\+/);
    expect(screen.queryByTestId('protocol-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bridge-sample-banner')).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Sample data/);
  });

  it('reports readiness unavailable when the API does not answer, without estimating anything', async () => {
    mockGet.mockRejectedValue(new Error('network blocked'));

    render(<EnhancedBridgePage />);

    await waitFor(() => {
      expect(screen.getByTestId('bridge-readiness-unavailable')).toBeInTheDocument();
    });
    expect(screen.getByText('Bridge readiness unavailable')).toBeInTheDocument();
    for (const text of FABRICATED) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
  });
});

describe('EnhancedBridgePage — demo mode ON (explicit opt-in)', () => {
  beforeEach(() => {
    featuresMock.demoSurfaces = true;
  });

  it('renders the sample page only under the banner and badges, with honest intro copy', async () => {
    mockGet.mockResolvedValue(readiness());

    render(<EnhancedBridgePage />);

    expect(screen.getByTestId('bridge-sample-banner')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('$11.2B')).toBeInTheDocument();
    });
    expect(screen.getByTestId('bridge-stats-sample-badge')).toBeInTheDocument();
    expect(screen.getByTestId('bridge-performance-sample-badge')).toBeInTheDocument();
    expect(screen.getAllByTestId('protocol-card').length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/13 integrated|248\+/);
    expect(document.body.textContent).toMatch(/none of them integrated with the testnet/);
    await waitFor(() => {
      expect(screen.getByTestId('bridge-readiness-live')).toBeInTheDocument();
    });
  });
});
