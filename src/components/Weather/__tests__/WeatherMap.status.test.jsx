/** @jest-environment jsdom */
/**
 * frontend#415 review: the dashboard WeatherMap (NewDashboard) fell back to the
 * online green for any status other than online/degraded/offline, so a
 * registered, stale or unknown station looked healthy. It now uses the shared
 * presentation table for the marker colour and the popup badge.
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

const GREEN = '#22C55E';
const AMBER = '#F59E0B';
const SLATE = '#94A3B8';

let stations = [];

await jest.unstable_mockModule('../../../hooks/api/useWeatherQueries', () => ({
  useWeatherStationsWithCoords: () => ({ data: stations, isLoading: false }),
  useWeatherStationSnapshots: () => ({ data: undefined, isLoading: false }),
}));

await jest.unstable_mockModule('react-leaflet', () => {
  const Element = ({ children }) => React.createElement('div', null, children);
  return {
    MapContainer: Element,
    TileLayer: Element,
    Circle: () => null,
    Popup: Element,
    useMap: () => ({ zoomIn: () => undefined, zoomOut: () => undefined }),
    Marker: ({ icon, children }) =>
      React.createElement('div', { 'data-testid': 'marker', 'data-html': icon.options.html }, children),
  };
});

const { default: WeatherMap } = await import('../WeatherMap');

const at = (id, status) => ({ id, name: `Station ${id}`, latitude: 46.8, longitude: -92.1, status });

function markerFills() {
  return screen
    .getAllByTestId('marker')
    .map((node) => (node.getAttribute('data-html') ?? '').match(/fill="(#[0-9A-Fa-f]{6})"/)?.[1]);
}

afterEach(() => cleanup());

describe('dashboard WeatherMap station status', () => {
  it('colours live green, stale amber, registered and unknown slate', () => {
    stations = [at('a', 'live'), at('b', 'stale'), at('c', 'registered'), at('d', 'unknown')];
    render(<WeatherMap />);
    expect(markerFills()).toEqual([GREEN, AMBER, SLATE, SLATE]);
  });

  it('labels the popup badge Online, Stale, Registered and Status unknown', () => {
    stations = [at('a', 'live'), at('b', 'stale'), at('c', 'registered'), at('d', 'unknown')];
    render(<WeatherMap />);
    for (const label of ['Online', 'Stale', 'Registered', 'Status unknown']) {
      expect(screen.getAllByText(label).some((node) => node.className.includes('status-badge'))).toBe(true);
    }
    expect(screen.queryByText('offline')).toBeNull();
    expect(screen.queryByText('Offline')).toBeNull();
  });
});
