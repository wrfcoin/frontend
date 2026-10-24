/** @jest-environment jsdom */
/**
 * Stage 1.5 public map (/map), found by building the publicReadonly variant
 * and driving it in headless Chromium:
 *  - a lone station loaded 7 degrees off-screen (MapContainer reads `center`
 *    only on mount, before the station list arrives);
 *  - the popup's "Station report" set location.hash under BrowserRouter, so it
 *    never navigated; "Fleet view" pointed at an operator-only route;
 *  - the popup said earnings were "Syncing" in a build that never reads them;
 *  - a failed station list read said "No stations connected yet.";
 *  - the wind layer scattered particles over the map with no wind data.
 */
import React from 'react';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const featureFlags = { publicReadonly: true, fullStudio: false };
const mapCalls: { setView: unknown[][]; fitBounds: unknown[][] } = { setView: [], fitBounds: [] };
const overlayVisible: Record<string, boolean[]> = { wind: [], temperature: [] };

await jest.unstable_mockModule('../../../config/features', () => ({
  FEATURES: featureFlags,
  default: featureFlags,
}));

await jest.unstable_mockModule('react-leaflet', () => {
  const Element = ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', null, children);
  const map = {
    setView: (...args: unknown[]) => { mapCalls.setView.push(args); },
    fitBounds: (...args: unknown[]) => { mapCalls.fitBounds.push(args); },
    invalidateSize: () => undefined,
    zoomIn: () => undefined,
    zoomOut: () => undefined,
    getContainer: () => document.createElement('div'),
  };
  return {
    MapContainer: Element,
    TileLayer: Element,
    Marker: Element,
    Popup: Element,
    Tooltip: Element,
    useMap: () => map,
  };
});

await jest.unstable_mockModule('../WindFlowOverlay', () => ({
  default: ({ visible }: { visible: boolean }) => {
    overlayVisible.wind.push(visible);
    return null;
  },
}));
await jest.unstable_mockModule('../TemperatureOverlay', () => ({
  default: ({ visible }: { visible: boolean }) => {
    overlayVisible.temperature.push(visible);
    return null;
  },
}));

const { default: EnhancedWeatherMap } = await import('../EnhancedWeatherMap');

type StationRow = { id: string; name: string; latitude: number; longitude: number; status?: unknown };

function backend(stations: StationRow[] | 'error') {
  global.fetch = jest.fn(async () => {
    if (stations === 'error') {
      return new Response('{}', { status: 500, headers: { 'content-type': 'application/json' } });
    }
    return new Response(
      JSON.stringify({
        stations: stations.map(s => ({ stationId: s.id, status: 'active', ...s })),
        total: stations.length,
        hasMore: false,
        nextCursor: null,
        source: 'wrfcoin-contributors',
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;
}

function renderMap() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/map']}>
        <Routes>
          <Route path="/map" element={<EnhancedWeatherMap />} />
          <Route path="/weather/station/:stationId" element={<div>station report route</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// Obviously fake coordinates. The public map shows them on the 0.1-degree grid
// (owner ruling 2026-10-01).
const ONE: StationRow = { id: 'station-1', name: 'Hilltop station', latitude: 10.123456, longitude: -20.987654 };
const TWO: StationRow = { id: 'station-2', name: 'Valley station', latitude: 20.04, longitude: -10.04 };

beforeEach(() => {
  mapCalls.setView.length = 0;
  mapCalls.fitBounds.length = 0;
  overlayVisible.wind.length = 0;
  overlayVisible.temperature.length = 0;
});

afterEach(() => {
  cleanup();
  featureFlags.publicReadonly = true;
  featureFlags.fullStudio = false;
});

describe('Stage 1.5 public map', () => {
  it.each([false, true])('does not advertise unimplemented history playback (fullStudio=%s)', async fullStudio => {
    featureFlags.fullStudio = fullStudio;
    backend([ONE]);
    renderMap();
    await screen.findByText('Station report');
    expect(screen.getByText('Data Layers')).toBeTruthy();
    expect(screen.getAllByRole('switch')).toHaveLength(6);
    expect(screen.queryByText(/time control/i)).toBeNull();
    expect(screen.queryByTitle('Play')).toBeNull();
    expect(screen.queryByText('-24h')).toBeNull();
    expect(screen.queryByText('-12h')).toBeNull();
  });

  it('brings a lone station into view once it loads', async () => {
    backend([ONE]);
    renderMap();
    await waitFor(() => expect(mapCalls.setView).toContainEqual([[10.1, -21], 8]));
  });

  it('fits several stations into view', async () => {
    backend([ONE, TWO]);
    renderMap();
    await waitFor(() => expect(mapCalls.fitBounds.length).toBeGreaterThan(0));
    const bounds = mapCalls.fitBounds[0][0] as { getNorth(): number; getSouth(): number };
    expect(bounds.getNorth()).toBeCloseTo(20.0, 6);
    expect(bounds.getSouth()).toBeCloseTo(10.1, 6);
  });

  it('"Station report" navigates in-app to the station page', async () => {
    backend([ONE]);
    renderMap();
    fireEvent.click(await screen.findByText('Station report'));
    expect(await screen.findByText('station report route')).toBeTruthy();
  });

  it('public build: no earnings claim and no operator-only Fleet link in the popup', async () => {
    backend([ONE]);
    renderMap();
    await screen.findByText('Station report');
    expect(screen.queryByText('Earnings')).toBeNull();
    expect(screen.queryByText('Syncing')).toBeNull();
    expect(screen.queryByText('Fleet view')).toBeNull();
  });

  it('internal build: earnings cell stays, and says "--" rather than "Syncing" when absent', async () => {
    featureFlags.fullStudio = true;
    backend([ONE]);
    renderMap();
    await screen.findByText('Station report');
    expect(screen.getByText('Earnings')).toBeTruthy();
    expect(screen.queryByText('Syncing')).toBeNull();
  });

  it('a failed station read is not reported as an empty network', async () => {
    backend('error');
    renderMap();
    expect(await screen.findByText('Station data is unavailable right now.')).toBeTruthy();
    expect(screen.queryByText('No stations connected yet.')).toBeNull();
  });

  it('an empty network says so', async () => {
    backend([]);
    renderMap();
    expect(await screen.findByText('No stations connected yet.')).toBeTruthy();
  });

  it('draws no wind or temperature field when no station reported one', async () => {
    backend([ONE]);
    renderMap();
    await screen.findByText('Station report');
    expect(overlayVisible.wind.length).toBeGreaterThan(0);
    expect(overlayVisible.wind.every(visible => visible === false)).toBe(true);
    expect(overlayVisible.temperature.every(visible => visible === false)).toBe(true);
  });

  // frontend#415: backend#1263 reports freshness (live / stale / registered).
  // A station that never reported is neutral "Registered", never red "Offline".
  it('labels live, stale and registered stations Online, Stale and Registered (no recent data)', async () => {
    backend([
      { ...ONE, status: 'live' },
      { ...TWO, status: 'stale' },
      { id: 'station-3', name: 'New station', latitude: 45.5, longitude: -94.1, status: 'registered' },
    ]);
    renderMap();
    await waitFor(() => expect(screen.getAllByText('Station report')).toHaveLength(3));
    // Popup badges: one per station.
    expect(screen.getAllByText('Online').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Stale').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Registered (no recent data)').length).toBeGreaterThanOrEqual(1);
    // Legend: every status counts once and nothing is counted offline.
    const legend = (label: string) =>
      screen.getAllByText(label).map(node => node.parentElement?.textContent ?? '');
    expect(legend('Online')).toContain('1Online');
    expect(legend('Stale')).toContain('1Stale');
    expect(legend('Registered (no recent data)')).toContain('1Registered (no recent data)');
    expect(legend('Offline')).toEqual(['0Offline']);
    expect(document.body.textContent).not.toMatch(/\bOFFLINE\b|\boffline\b/);
  });

  it('an unrecognised or missing status is "Status unknown", not Offline', async () => {
    backend([
      { ...ONE, status: 'bogus' },
      { ...TWO, status: null },
    ]);
    renderMap();
    await waitFor(() => expect(screen.getAllByText('Station report')).toHaveLength(2));
    const unknown = screen.getAllByText('Status unknown');
    expect(unknown.length).toBeGreaterThanOrEqual(2);
    expect(unknown.map(node => node.parentElement?.textContent ?? '')).toContain('2Status unknown');
    expect(screen.getAllByText('Offline').map(node => node.parentElement?.textContent)).toEqual(['0Offline']);
  });
});

describe('phone layout (frontend#560)', () => {
  const original = window.matchMedia;
  beforeEach(() => {
    window.matchMedia = ((query: string) => ({
      media: query, matches: query === '(max-width: 767px)', onchange: null,
      addEventListener: () => undefined, removeEventListener: () => undefined,
      addListener: () => undefined, removeListener: () => undefined, dispatchEvent: () => true,
    })) as unknown as typeof window.matchMedia;
  });
  afterEach(() => { window.matchMedia = original; });

  it('starts with both panels closed, keeps the chips and zoom in a toolbar, and opens at most one panel', async () => {
    backend([{ id: 'st-1', name: 'Hilltop', latitude: 45, longitude: -93 }]);
    renderMap();
    await screen.findByText('Weather Network Map');
    expect(screen.getByRole('toolbar', { name: 'Map controls' })).toBeInTheDocument();
    expect(screen.queryByTestId('map-layers-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('map-legend-panel')).not.toBeInTheDocument();
    for (const name of ['Zoom in', 'Zoom out', 'Full screen']) expect(screen.getByRole('button', { name })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show map layers' }));
    expect(screen.getByTestId('map-layers-panel')).toHaveAttribute('data-collapsed', 'false');
    expect(screen.queryByTestId('map-legend-panel')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show map legend' }));
    expect(screen.getByTestId('map-legend-panel')).toHaveAttribute('data-collapsed', 'false');
    expect(screen.queryByTestId('map-layers-panel')).not.toBeInTheDocument();

    // The sheet's own header closes it (the toolbar chip is the other "Hide map legend" button).
    fireEvent.click(within(screen.getByTestId('map-legend-panel')).getByRole('button', { name: 'Hide map legend' }));
    expect(screen.queryByTestId('map-legend-panel')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show map legend' })).toHaveAttribute('aria-expanded', 'false');
  });
});
