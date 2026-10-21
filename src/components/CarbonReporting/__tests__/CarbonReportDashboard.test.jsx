/** @jest-environment jsdom */
//
// frontend#303 — the Carbon Reporting dashboard (credits, prices, scope
// flows, a TCFD compliance tab) is fabricated end to end; backend has no
// carbon-accounting source (capability `carbonReporting` = unavailable).
//
//   1. Demo mode OFF (default): the honest not-live state renders and none
//      of the fabricated figures or the TCFD tab appear.
//   2. Demo mode ON: the sample dashboard renders only beneath the
//      "Simulated preview" banner and a "Sample data" badge, the TCFD tab is
//      labelled illustrative, and the export action is disabled.
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const featuresMock = { demoSurfaces: false, carbonReporting: true };

jest.unstable_mockModule('../../../config/features', () => ({
  default: featuresMock,
  FEATURES: featuresMock,
}));

jest.unstable_mockModule('react-chartjs-2', () => ({
  Bar: () => React.createElement('div', { 'data-testid': 'bar-chart' }),
  Line: () => React.createElement('div', { 'data-testid': 'line-chart' }),
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

const { default: CarbonReportDashboard } = await import('../CarbonReportDashboard');

const FABRICATED = ['12,847', '$384,410', '94.2%', 'A+'];

beforeEach(() => {
  featuresMock.demoSurfaces = false;
});

describe('CarbonReportDashboard — demo mode OFF (default)', () => {
  it('renders the honest not-live state and no fabricated carbon or TCFD content', () => {
    render(<CarbonReportDashboard />);

    expect(screen.getByText('Carbon reporting is not live on the testnet yet')).toBeInTheDocument();
    for (const text of FABRICATED) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
    expect(screen.queryByText(/TCFD Report/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('carbon-sample-banner')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Sample data/);
  });
});

describe('CarbonReportDashboard — demo mode ON (explicit opt-in)', () => {
  beforeEach(() => {
    featuresMock.demoSurfaces = true;
  });

  it('renders the sample dashboard only under the banner and badge, with the TCFD tab marked illustrative and export disabled', () => {
    render(<CarbonReportDashboard />);

    expect(screen.getByTestId('carbon-sample-banner')).toBeInTheDocument();
    expect(
      screen.getByText('Simulated preview — illustrative carbon data, not an ESG or compliance record'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('carbon-sample-badge')).toBeInTheDocument();
    expect(screen.getByText('12,847')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'TCFD Report (illustrative)' })).toBeInTheDocument();

    const exportBtn = screen.getByRole('button', { name: /Export TCFD Report \(disabled/ });
    expect(exportBtn).toBeDisabled();
  });
});
