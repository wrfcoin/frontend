/** @jest-environment jsdom */
//
// frontend#326 — the mobile AI/ML, Carbon Credit and Distributed Storage
// dashboards set a hard-coded `mockMetrics` object with zero fetch calls.
// Each now goes through DemoSurfaceGate.
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const featuresMock = { demoSurfaces: false };
jest.unstable_mockModule('../../../config/features', () => ({ default: featuresMock, FEATURES: featuresMock }));
jest.unstable_mockModule('react-chartjs-2', () => ({
  Bar: () => React.createElement('div'), Line: () => React.createElement('div'), Doughnut: () => React.createElement('div'),
  Radar: () => React.createElement('div'), Pie: () => React.createElement('div'),
}));
jest.unstable_mockModule('chart.js', () => ({
  Chart: { register: () => {} },
  CategoryScale: class {}, LinearScale: class {}, BarElement: class {}, PointElement: class {}, LineElement: class {},
  ArcElement: class {}, Filler: class {}, Tooltip: class {}, Legend: class {}, Title: class {}, RadialLinearScale: class {},
}));

const { default: MobileAIMLDashboard } = await import('../MobileAIMLDashboard');
const { default: MobileCarbonCreditDashboard } = await import('../MobileCarbonCreditDashboard');
const { default: MobileDistributedStorage } = await import('../MobileDistributedStorage');

const PANELS: Array<[string, string, () => React.ReactElement]> = [
  ['mobile-aiml', 'AI/ML metrics are not live on the testnet yet', () => <MobileAIMLDashboard />],
  ['mobile-carbon', 'Carbon credits are not live on the testnet yet', () => <MobileCarbonCreditDashboard />],
  ['mobile-storage', 'Distributed storage is not live on the testnet yet', () => <MobileDistributedStorage />],
];

describe('mobile dashboards — demo mode OFF (default)', () => {
  beforeEach(() => { featuresMock.demoSurfaces = false; });
  it.each(PANELS)('%s renders the not-live notice and no hard-coded metric', (testId, title, make) => {
    const { unmount } = render(make());
    expect(screen.getByTestId(`${testId}-not-live`)).toBeInTheDocument();
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Sample data|\d{2,}(\.\d+)?\s*(TB|PB|GB|%|t|tons)/);
    unmount();
  });
});

describe('mobile dashboards — demo mode ON', () => {
  beforeEach(() => { featuresMock.demoSurfaces = true; });
  it.each(PANELS)('%s renders the sample only under the badge', (testId, _title, make) => {
    const { unmount } = render(make());
    expect(screen.getByTestId(`${testId}-sample-badge`)).toBeInTheDocument();
    expect(screen.queryByTestId(`${testId}-not-live`)).not.toBeInTheDocument();
    unmount();
  });
});
