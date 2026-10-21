/** @jest-environment jsdom */
//
// frontend#292 — TreasuryDashboard must never present fabricated DAO
// financial data (a $4.85M balance, vendor spending, invented transaction
// hashes) as if it were real.
//
// Scenarios:
//   1. Demo mode OFF, governance API unreachable — the default for a public
//      visitor on a build with no backend: every section shows the honest
//      not-live state; no fabricated figure or hash renders anywhere.
//   2. Demo mode OFF, governance API reachable — the live balance and ledger
//      from /api/governance/treasury* render; the sections that have no real
//      source still show the honest not-live state, not sample figures.
//   3. Demo mode ON — the sample sections may render, but only under the
//      page-level "Simulated preview" banner and per-section "Sample data"
//      badges, and the sample ledger carries no invented hashes.
//
// `FEATURES` and `apiClient` are mocked once at module scope (see
// ForecastPreview.test.jsx for why this file avoids jest.resetModules()).
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGet = jest.fn();
const featuresMock = { demoSurfaces: false, governance: true, governanceAdvanced: true };

jest.unstable_mockModule('../../../services/apiClient', () => ({
  apiClient: { get: mockGet },
}));

jest.unstable_mockModule('../../../config/features', () => ({
  default: featuresMock,
  FEATURES: featuresMock,
}));

const { default: TreasuryDashboard } = await import('../TreasuryDashboard');

const FABRICATED = ['$4.85M', 'CloudHSM Provider', 'BP-041', '0x3a7b...e2f1', '+8.4% from last month', 'Stablecoins (USDC/DAI)'];

function liveSummary() {
  return {
    success: true,
    data: { balance: '1250.5', totalDeposits: '2000', totalWithdrawals: '749.5', transactionCount: 3 },
  };
}

function liveLedger() {
  return {
    success: true,
    data: [
      {
        id: 1,
        transactionId: 'tx-1',
        transactionType: 'treasury_transaction',
        category: 'Grants',
        amount: '-100',
        description: 'Station operator grant',
        transactionHash: '0xabcdef0123456789abcdef0123456789abcdef01',
        createdAt: '2026-09-10T00:00:00.000Z',
      },
    ],
  };
}

function routeGet(summary, ledger) {
  mockGet.mockImplementation((path) => {
    if (path === '/governance/treasury') return summary();
    if (path.startsWith('/governance/treasury/transactions')) return ledger();
    return Promise.reject(new Error(`unexpected path ${path}`));
  });
}

beforeEach(() => {
  mockGet.mockReset();
  featuresMock.demoSurfaces = false;
});

describe('TreasuryDashboard — demo mode OFF, API unreachable (public visitor, no backend)', () => {
  it('renders honest not-live states and no fabricated figures or hashes', async () => {
    mockGet.mockRejectedValue(new Error('network blocked'));

    render(<TreasuryDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Treasury balance unavailable')).toBeInTheDocument();
    });

    expect(screen.getByText('Asset allocation unavailable')).toBeInTheDocument();
    expect(screen.getByText('Spending metrics unavailable')).toBeInTheDocument();
    expect(screen.getByText('Monthly flows unavailable')).toBeInTheDocument();
    expect(screen.getByText('No budget proposals yet')).toBeInTheDocument();
    expect(screen.getByText('Treasury ledger unavailable')).toBeInTheDocument();

    for (const text of FABRICATED) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
    expect(screen.queryByTestId('treasury-sample-banner')).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Sample data/);
    expect(document.body.textContent).not.toMatch(/0x[0-9a-f]{4}\.\.\.[0-9a-f]{4}/);
  });
});

describe('TreasuryDashboard — demo mode OFF, governance API live', () => {
  it('renders the real balance and ledger, and honest states for sections with no source', async () => {
    routeGet(
      () => Promise.resolve(liveSummary()),
      () => Promise.resolve(liveLedger()),
    );

    render(<TreasuryDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('treasury-live-balance')).toBeInTheDocument();
    });

    expect(screen.getByText('1,250.5 WRF')).toBeInTheDocument();
    expect(screen.getByText(/2,000 WRF deposited/)).toBeInTheDocument();
    expect(screen.getByTestId('treasury-live-ledger')).toBeInTheDocument();
    expect(screen.getByText('Station operator grant')).toBeInTheDocument();
    expect(screen.getByText('0xabcd...ef01')).toBeInTheDocument();

    // No real source for these → honest, not sample.
    expect(screen.getByText('Asset allocation unavailable')).toBeInTheDocument();
    expect(screen.getByText('No budget proposals yet')).toBeInTheDocument();
    for (const text of FABRICATED) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
    expect(document.body.textContent).not.toMatch(/Sample data/);
  });

  it('shows an honest empty ledger when the treasury has no transactions yet', async () => {
    routeGet(
      () => Promise.resolve({ success: true, data: { balance: '0', totalDeposits: '0', totalWithdrawals: '0', transactionCount: 0 } }),
      () => Promise.resolve({ success: true, data: [] }),
    );

    render(<TreasuryDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No treasury transactions recorded yet')).toBeInTheDocument();
    });
    expect(screen.getByText('0 WRF')).toBeInTheDocument();
    expect(screen.queryByText('CloudHSM Provider')).not.toBeInTheDocument();
  });
});

describe('TreasuryDashboard — demo mode ON (explicit opt-in)', () => {
  beforeEach(() => {
    featuresMock.demoSurfaces = true;
  });

  it('renders sample sections only under the banner and per-section badges, with no invented hashes', async () => {
    mockGet.mockRejectedValue(new Error('network blocked'));

    render(<TreasuryDashboard />);

    // The banner renders synchronously; wait for the live fetch to settle so
    // the balance card's honest state is asserted after loading, not during.
    await waitFor(() => {
      expect(screen.getByText('Treasury balance unavailable')).toBeInTheDocument();
    });

    expect(screen.getByTestId('treasury-sample-banner')).toBeInTheDocument();
    expect(screen.getByText('Simulated preview — not real financial data')).toBeInTheDocument();
    for (const id of [
      'treasury-growth-sample-badge',
      'treasury-allocation-sample-badge',
      'treasury-metrics-sample-badge',
      'treasury-flows-sample-badge',
      'treasury-proposals-sample-badge',
      'treasury-spending-sample-badge',
    ]) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
    expect(screen.getByText('BP-041')).toBeInTheDocument();
    expect(screen.getByText('CloudHSM Provider')).toBeInTheDocument();
    // The sample ledger never shows an invented transaction hash.
    expect(document.body.textContent).not.toMatch(/0x[0-9a-f]{4}\.\.\.[0-9a-f]{4}/);
    expect(screen.getAllByText('sample entry — no on-chain hash').length).toBeGreaterThan(0);
  });
});
