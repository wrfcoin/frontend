/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';
const flags = { demoSurfaces: false };
const chart = jest.fn(({ data }) => <div data-testid="illustrative-chart">{JSON.stringify(data)}</div>);
await jest.unstable_mockModule('../../../config/features', () => ({ default: flags, FEATURES: flags }));
// Canvas rendering is unrelated; the real dashboard and gate stay mounted.
await jest.unstable_mockModule('react-chartjs-2', () => ({ Bar: chart, Doughnut: chart }));
jest.useFakeTimers({ now: Date.UTC(2026, 9, 3, 12), doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
const formatting = jest.spyOn(Date.prototype, 'toLocaleDateString');
const { default: ResourceDashboard } = await import('../ResourceDashboard');
const importFormattingCalls = formatting.mock.calls.length;
beforeEach(() => { flags.demoSurfaces = false; chart.mockClear(); formatting.mockClear(); global.fetch = jest.fn(); });
afterEach(cleanup);
afterAll(() => jest.useRealTimers());
it('production default withholds invented hardware, earnings and charts', () => {
  render(<ResourceDashboard />);
  expect(screen.getByTestId('compute-resources-not-live')).not.toBeNull();
  expect(screen.getByText('Compute resource telemetry unavailable.')).not.toBeNull();
  expect(screen.queryByText('NVIDIA RTX 4090')).toBeNull();
  expect(screen.queryByText('AMD Ryzen 9 7950X')).toBeNull();
  expect(chart).not.toHaveBeenCalled();
  expect(importFormattingCalls).toBe(0); expect(formatting).not.toHaveBeenCalled();
  expect(global.fetch).not.toHaveBeenCalled();
});
it('explicit demo labels actual sample hardware and deterministic illustrative charts', () => {
  flags.demoSurfaces = true; render(<ResourceDashboard />);
  expect(screen.getByTestId('compute-resources-sample-badge').textContent).toBe('Sample data');
  expect(screen.getByText('NVIDIA RTX 4090')).not.toBeNull();
  expect(chart).toHaveBeenCalled(); expect(formatting).toHaveBeenCalledTimes(14);
  expect(screen.queryByTestId('compute-resources-not-live')).toBeNull();
  expect(global.fetch).not.toHaveBeenCalled();
});
