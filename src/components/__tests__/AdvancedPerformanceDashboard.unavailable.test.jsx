import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const flags = { demoSurfaces: false };
const features = new Proxy(flags, { get: (target, prop) => prop in target ? target[prop] : true });
await jest.unstable_mockModule('../../config/features', () => ({ FEATURES: features, default: features }));
await jest.unstable_mockModule('../../utils/pwaUtils', () => ({
  usePWA: () => ({ canInstall: false, isInstalled: true, isOnline: true, requestNotifications: jest.fn() }),
}));
await jest.unstable_mockModule('../Mobile/MobileNavigation', () => ({
  default: ({ onNavigate }) => <nav>
    <button onClick={() => onNavigate('/performance')}>Performance navigation</button>
    <button onClick={() => onNavigate('/sensors')}>Sensor navigation</button>
  </nav>,
}));
for (const path of [
  'Mobile/MobileSensorDashboard', 'Mobile/MobileEarnings', 'Mobile/MobileQuickActions',
  'Mobile/MobileHSMSecurityDashboard', 'Mobile/MobileIntegrationsHub',
  'Mobile/MobileCarbonCreditDashboard', 'Mobile/MobileAIMLDashboard', 'Mobile/MobileDistributedStorage',
  'UnifiedAnalytics/UnifiedAnalyticsDashboard', 'DeFi/DeFiPortfolio',
  'Governance/ComprehensiveGovernanceDashboard', 'ComputeMarketplace', 'System/SystemMonitor',
]) {
  await jest.unstable_mockModule(`../${path}`, () => ({ default: () => <div data-testid={path} /> }));
}
// Charts are irrelevant to the unavailable-state criterion. Keep every old
// chart export available so baseline failures are rendering assertions.
await jest.unstable_mockModule('recharts', () => Object.fromEntries([
  'LineChart', 'Line', 'AreaChart', 'Area', 'BarChart', 'Bar', 'XAxis', 'YAxis',
  'CartesianGrid', 'Tooltip', 'Legend', 'ResponsiveContainer', 'PieChart', 'Pie', 'Cell',
].map(name => [name, () => null])));

const Dashboard = (await import('../AdvancedPerformanceDashboard')).default;
const MobileApp = (await import('../Mobile/MobileApp')).default;
const previousEnv = globalThis.__VITE_ENV__;

beforeEach(() => {
  globalThis.__VITE_ENV__ = { VITE_ENABLE_FULL_STUDIO: 'true', VITE_ENABLE_OPERATOR_PREVIEW: 'true' };
  window.matchMedia = jest.fn(() => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
  global.fetch = jest.fn(async () => new Response('{}', { status: 404 }));
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { cleanup(); jest.restoreAllMocks(); globalThis.__VITE_ENV__ = previousEnv; });

function expectUnavailable() {
  expect(screen.getByTestId('advanced-performance-not-live')).toBeTruthy();
  expect(screen.getByText('Advanced performance data is unavailable')).toBeTruthy();
  expect(screen.queryByText('847')).toBeNull();
  expect(screen.queryByText('2.1s')).toBeNull();
  expect(screen.queryByText('Active Protocols: 13/13')).toBeNull();
  expect(global.fetch).not.toHaveBeenCalled();
}

describe('performance source availability', () => {
  it.each([false, true])('direct rendering is unavailable even with demoSurfaces=%s', async enabled => {
    flags.demoSurfaces = enabled;
    await act(async () => { render(<Dashboard />); });
    expectUnavailable();
  });

  it('the actual MobileApp performance branch remains navigable with a sibling control', async () => {
    flags.demoSurfaces = true;
    await act(async () => { render(<MobileApp initialPath="/performance" />); });
    expectUnavailable();
    fireEvent.click(screen.getByText('Sensor navigation'));
    expect(screen.getByTestId('Mobile/MobileSensorDashboard')).toBeTruthy();
    expect(screen.queryByTestId('advanced-performance-not-live')).toBeNull();
    fireEvent.click(screen.getByText('Performance navigation'));
    expectUnavailable();
  });
});
