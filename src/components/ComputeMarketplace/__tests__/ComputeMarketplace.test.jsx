/** @jest-environment jsdom */
//
// frontend#301 — the Compute Marketplace showed 847.3 TFLOPS, 1,248
// contributors, 89 running jobs, three "featured" jobs and a contributor
// earnings panel ending in "Pending Payout 84.5 WRF" — all hard-coded. No
// compute-marketplace route is served by the main API (capability
// `computeMarketplace` = unavailable).
//
//   1. Demo mode OFF (default): the honest not-live state renders; none of
//      the fabricated figures, jobs or the payout appear.
//   2. Demo mode ON: the sample dashboard renders only beneath the banner and
//      "Sample data" badges, and the payout row says nothing is payable.
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const featuresMock = { demoSurfaces: false, computeMarketplace: true };

jest.unstable_mockModule('../../../config/features', () => ({
  default: featuresMock,
  FEATURES: featuresMock,
}));
jest.unstable_mockModule('../../../services/apiClient', () => ({
  apiClient: { get: () => Promise.reject(new Error('no compute route on the testnet API')) },
}));
jest.unstable_mockModule('react-chartjs-2', () => ({
  Line: () => React.createElement('div', { 'data-testid': 'line-chart' }),
  Bar: () => React.createElement('div', { 'data-testid': 'bar-chart' }),
  Doughnut: () => React.createElement('div', { 'data-testid': 'doughnut-chart' }),
}));
jest.unstable_mockModule('chart.js', () => ({
  Chart: { register: () => {} },
  CategoryScale: class {},
  LinearScale: class {},
  BarElement: class {},
  PointElement: class {},
  LineElement: class {},
  ArcElement: class {},
  Filler: class {},
  Tooltip: class {},
  Legend: class {},
}));

const { default: ComputeMarketplace } = await import('../ComputeMarketplace');

const FABRICATED = ['847.3', '1,248', '89', 'WRF Model Training', 'Global Ensemble Run', '0x7a3B...f29C', '4,218.7 WRF'];

beforeEach(() => {
  featuresMock.demoSurfaces = false;
});

describe('ComputeMarketplace — demo mode OFF (default)', () => {
  it('renders the honest not-live state and no fabricated stats, jobs or payout', () => {
    render(<ComputeMarketplace />);

    expect(screen.getByText('The compute marketplace is not live on the testnet yet')).toBeInTheDocument();
    for (const text of FABRICATED) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
    expect(document.body.textContent).not.toMatch(/Pending Payout|Featured Jobs|Sample data/);
    expect(screen.queryByTestId('compute-sample-banner')).not.toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });
});

describe('ComputeMarketplace — demo mode ON (explicit opt-in)', () => {
  beforeEach(() => {
    featuresMock.demoSurfaces = true;
  });

  it('renders the sample dashboard only under the banner and badges, with the payout marked not payable', () => {
    render(<ComputeMarketplace />);

    expect(screen.getByTestId('compute-sample-banner')).toBeInTheDocument();
    expect(screen.getByTestId('compute-featured-sample-badge')).toBeInTheDocument();
    expect(screen.getByTestId('compute-earnings-sample-badge')).toBeInTheDocument();
    expect(screen.getByText('WRF Model Training')).toBeInTheDocument();
    expect(screen.getByText('Pending Payout (sample — nothing is payable)')).toBeInTheDocument();
  });
});
