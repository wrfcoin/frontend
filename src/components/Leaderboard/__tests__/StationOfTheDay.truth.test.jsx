/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';
const flags = { demoSurfaces: false };
await jest.unstable_mockModule('../../../config/features', () => ({ default: flags, FEATURES: flags }));
const { default: StationOfTheDay } = await import('../StationOfTheDay');
beforeEach(() => { flags.demoSurfaces = false; global.fetch = jest.fn(); });
afterEach(cleanup);
it('production default refuses awards without a trusted source and performs no read', () => {
  render(<StationOfTheDay />);
  expect(screen.getByTestId('station-of-the-day-not-live')).not.toBeNull();
  expect(screen.getByText('Station awards unavailable.')).not.toBeNull();
  expect(screen.queryByText('Eagle Ridge Observatory')).toBeNull();
  expect(screen.queryByText('AlpineObserver.wrf')).toBeNull();
  expect(screen.queryByText('Sample data')).toBeNull();
  expect(global.fetch).not.toHaveBeenCalled();
});
it('explicit demo retains the actual illustrative component beneath a sample disclosure', () => {
  flags.demoSurfaces = true; render(<StationOfTheDay />);
  expect(screen.getByTestId('station-of-the-day-sample-badge').textContent).toBe('Sample data');
  expect(screen.getByText('Eagle Ridge Observatory')).not.toBeNull();
  expect(screen.queryByTestId('station-of-the-day-not-live')).toBeNull();
  expect(global.fetch).not.toHaveBeenCalled();
});
