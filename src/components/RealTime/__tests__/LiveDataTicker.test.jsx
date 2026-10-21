/** @jest-environment jsdom */
//
// frontend#295 — the global ticker (rendered on every route, App.jsx) scrolled
// twelve hard-coded literals ("$2.847 WRF +3.42%", "1,247 validators",
// "8,421 stations online", "342 tx/s", "2,341 tons carbon"…) that no feed ever
// updated. It now reads the three public testnet routes through
// usePublicTestnetStats and renders "unavailable" for anything it cannot read.
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const featuresMock = { demoSurfaces: false };
const hookState = { current: { state: 'loading', blockHeight: null, latestBlockTime: null, coverageZoneCount: null } };

jest.unstable_mockModule('../../../config/features', () => ({
  default: featuresMock,
  FEATURES: featuresMock,
}));
jest.unstable_mockModule('../../../hooks/usePublicTestnetStats', () => ({
  usePublicTestnetStats: () => hookState.current,
}));

const { default: LiveDataTicker, buildTickerItems, formatBlockAge } = await import('../LiveDataTicker');

const FABRICATED = ['2.847', '12.5', '1,847,293', '1,247', '342', '8,421', '847.2M', '2,341', '22.4', '67', '14.2', '1013'];

beforeEach(() => {
  featuresMock.demoSurfaces = false;
});

describe('LiveDataTicker', () => {
  it('shows a connecting state while the public stats load, with no numbers', () => {
    hookState.current = { state: 'loading', blockHeight: null, latestBlockTime: null, coverageZoneCount: null };
    render(<LiveDataTicker />);

    expect(screen.getAllByText('connecting…').length).toBeGreaterThan(0);
    for (const text of FABRICATED) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
  });

  it('renders only the real block height, block age and coverage-zone count', () => {
    hookState.current = {
      state: 'ready',
      blockHeight: 1234,
      latestBlockTime: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      coverageZoneCount: 12,
    };
    render(<LiveDataTicker />);

    // Items are rendered twice for the seamless scroll loop.
    expect(screen.getAllByText('#1,234').length).toBe(2);
    expect(screen.getAllByText('3 min ago').length).toBe(2);
    expect(screen.getAllByText('12').length).toBe(2);
    expect(screen.getAllByText('Coverage zones').length).toBe(2);
    for (const text of FABRICATED) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
    expect(screen.getByTestId('live-data-ticker').textContent).not.toMatch(/WRF|gwei|Validators|TPS|Stations|MCap|Carbon|Sample|%/);
  });

  it('says the feed is unavailable rather than showing a remembered or estimated figure', () => {
    hookState.current = { state: 'unavailable', blockHeight: null, latestBlockTime: null, coverageZoneCount: null };
    render(<LiveDataTicker />);

    expect(screen.getAllByText('live feed unavailable').length).toBe(2);
    expect(screen.getAllByText('unavailable').length).toBe(6);
    expect(screen.getByTestId('live-data-ticker').textContent).not.toMatch(/\d/);
  });

  it('adds labelled sample items only under demo mode', () => {
    featuresMock.demoSurfaces = true;
    hookState.current = { state: 'ready', blockHeight: 7, latestBlockTime: null, coverageZoneCount: null };
    render(<LiveDataTicker />);

    expect(screen.getAllByText('Sample · Avg Temp').length).toBe(2);
    expect(screen.getAllByText('#7').length).toBe(2);
  });
});

describe('buildTickerItems / formatBlockAge', () => {
  it('never emits a change arrow (no source reports a delta)', () => {
    const items = buildTickerItems(
      { state: 'ready', blockHeight: 10, latestBlockTime: '2026-09-16T00:00:00Z', coverageZoneCount: 3 },
      { now: Date.parse('2026-09-16T00:00:30Z') },
    );
    expect(items.every((i) => i.change === 0)).toBe(true);
    expect(items.map((i) => i.value)).toEqual(['10', '30s ago', '3']);
  });

  it('formats block age in seconds, minutes, hours and days, and null for garbage', () => {
    const now = Date.parse('2026-09-16T12:00:00Z');
    expect(formatBlockAge('2026-09-16T11:59:50Z', now)).toBe('10s ago');
    expect(formatBlockAge('2026-09-16T11:45:00Z', now)).toBe('15 min ago');
    expect(formatBlockAge('2026-09-16T06:00:00Z', now)).toBe('6 h ago');
    expect(formatBlockAge('2026-09-10T12:00:00Z', now)).toBe('6 d ago');
    expect(formatBlockAge('not a date', now)).toBeNull();
  });
});
