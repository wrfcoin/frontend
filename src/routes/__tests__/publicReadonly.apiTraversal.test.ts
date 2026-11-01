/** @jest-environment jsdom */

import React, { Suspense } from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import fixture from '../__fixtures__/backend-main-mounts.json';
import edge from '../__fixtures__/public-edge-allowlist.json';

const featureFlags = {
  publicReadonly: true,
  fullStudio: false,
};
const markerPositions: Array<[number, number]> = [];

await jest.unstable_mockModule('../../config/features', () => ({
  FEATURES: featureFlags,
}));

await jest.unstable_mockModule('react-leaflet', () => {
  const Element = ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', null, children);
  const Marker = ({
    children,
    position,
  }: {
    children?: React.ReactNode;
    position: [number, number];
  }) => {
    markerPositions.push(position);
    return React.createElement('div', null, children);
  };
  return {
    MapContainer: Element,
    TileLayer: Element,
    Marker,
    Popup: Element,
    Tooltip: Element,
    Rectangle: Element,
    useMap: () => ({
      setView: jest.fn(),
      invalidateSize: jest.fn(),
      zoomIn: jest.fn(),
      zoomOut: jest.fn(),
      getContainer: () => document.createElement('div'),
    }),
  };
});

await jest.unstable_mockModule('../../components/WeatherMapGL/WindFlowOverlay', () => ({
  default: () => null,
}));

await jest.unstable_mockModule('../../components/WeatherMapGL/TemperatureOverlay', () => ({
  default: () => null,
}));

// Charts need a canvas; the station page's text is what is under test.
await jest.unstable_mockModule('react-chartjs-2', () => ({
  Line: () => null,
  Bar: () => null,
}));

const { default: PublicReadOnlyExplorer } = await import(
  '../../components/explorer/PublicReadOnlyExplorer'
);
const { default: PublicReadOnlySearch } = await import(
  '../../components/Search/PublicReadOnlySearch'
);
const { default: EnhancedWeatherMap } = await import(
  '../../components/WeatherMapGL/EnhancedWeatherMap'
);
const { default: StationReportPage } = await import(
  '../../components/Weather/StationReportPage'
);

function pathname(value: Parameters<typeof fetch>[0]): string {
  return new URL(String(value), 'https://test.invalid').pathname;
}

// Full request targets (path + query) seen by fetch in the last render.
let lastTargets: string[] = [];

// The public edge answers only what its allowlist admits (with
// PUBLIC_READONLY_API=on); anything else is a 404 the page cannot use.
function edgeAdmits(target: string): boolean {
  const url = new URL(target, 'https://test.invalid');
  const query = url.search.replace(/^\?/, '');
  return (edge.get as Array<{ path: string; query: string[] | null; queryPattern?: string }>).some(route =>
    new RegExp(route.path).test(url.pathname) &&
    (route.query === null || route.query.includes(query) ||
      (route.queryPattern !== undefined && new RegExp(route.queryPattern).test(query))),
  );
}

async function renderPublicRoute(
  path: string,
  { expectRequests = true }: { expectRequests?: boolean } = {},
): Promise<string[] & { container?: HTMLElement }> {
  const requests: string[] = [];
  const targets: string[] = [];
  lastTargets = targets;
  global.fetch = jest.fn(async (input: Parameters<typeof fetch>[0]) => {
    const requestPath = pathname(input);
    requests.push(requestPath);
    const url = new URL(String(input), 'https://test.invalid');
    targets.push(`${url.pathname}${url.search}`);
    // Real backend envelope (weather-routes.js); never a bare array.
    const body = requestPath === '/api/weather/stations'
      ? {
        stations: [{
          id: 'station-1',
          stationId: 'station-1',
          name: 'Private station',
          status: 'active',
          latitude: 10.123456,
          longitude: -20.987654,
          location: { address: '1 Private Lane, Testville' },
        }],
        total: 1,
        hasMore: false,
        nextCursor: null,
        source: 'wrfcoin-contributors',
      }
      : [];
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const { container } = render(
    React.createElement(
      QueryClientProvider,
      { client },
      React.createElement(
        MemoryRouter,
        { initialEntries: [path] },
        React.createElement(
          Suspense,
          { fallback: null },
          React.createElement(
            Routes,
            null,
            React.createElement(Route, {
              path: '/explore',
              element: React.createElement(PublicReadOnlyExplorer),
            }),
            React.createElement(Route, {
              path: '/search',
              element: React.createElement(PublicReadOnlySearch),
            }),
            React.createElement(Route, {
              path: '/map',
              element: React.createElement(EnhancedWeatherMap),
            }),
            React.createElement(Route, {
              path: '/weather/station/:stationId',
              element: React.createElement(StationReportPage),
            }),
          ),
        ),
      ),
    ),
  );
  if (expectRequests) {
    await waitFor(() => expect(requests.length).toBeGreaterThan(0));
  }
  return Object.assign(requests, { container });
}

async function renderStationDetail(): Promise<HTMLElement> {
  const { container } = await renderPublicRoute('/weather/station/station-1');
  await waitFor(() => expect(container?.textContent).toContain('Coordinates'));
  return container as HTMLElement;
}

describe('Stage 1.5 API traversal', () => {
  afterEach(() => {
    cleanup();
    markerPositions.length = 0;
    featureFlags.publicReadonly = true;
    featureFlags.fullStudio = false;
  });

  it('renders every public route and keeps every observed request mounted', async () => {
    const observed: string[] = [];
    const targets: string[] = [];
    for (const route of [
      '/explore',
      `/search?q=${'a'.repeat(64)}`,
      '/map',
      '/weather/station/station-1',
    ]) {
      const requests = await renderPublicRoute(route);
      if (route.startsWith('/weather/station/')) {
        // Let the per-station reads (gated on the list) go out too.
        await waitFor(() => expect(requests).toEqual(
          expect.arrayContaining(['/api/stations/station-1/submissions']),
        ));
      }
      observed.push(...requests);
      targets.push(...lastTargets);
      cleanup();
    }

    expect(fixture.backendCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(observed).toEqual(expect.arrayContaining([
      '/api/blockchain/blocks',
      `/api/blockchain/transactions/${'a'.repeat(64)}`,
      '/api/weather/stations',
      '/api/stations/station-1/observations',
    ]));
    // stage15 readiness: the backend mounting a route is not enough — the
    // public edge must admit the exact request, or the page gets a 404.
    expect(edge.infraCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(targets.filter(target => !edgeAdmits(target))).toEqual([]);
    const specificMounts = fixture.mounts.filter(mount => mount !== '/api');
    // Exact routes of routers mounted on bare /api: one segment per :param.
    const exactRoutes = fixture.routes.map(
      route => new RegExp(`^${route.replace(/:[^/]+/g, '[^/]+')}$`),
    );
    for (const path of observed) {
      expect(
        specificMounts.some(mount => path === mount || path.startsWith(`${mount}/`)) ||
          exactRoutes.some(route => route.test(path)),
      ).toBe(true);
    }
  });

  it('asks only the alias ownership path for station ownership, and the edge admits it', async () => {
    await renderStationDetail();
    await waitFor(() => expect(lastTargets.some(t => /\/ownership$/.test(t))).toBe(true));
    const ownership = lastTargets.filter(t => t.includes('/ownership'));
    expect(ownership).toEqual(['/api/stations/st_406339c8ab53/ownership']);
    expect(edgeAdmits(ownership[0])).toBe(true);
    expect(edgeAdmits('/api/stations/station-1/ownership')).toBe(false);
    expect(edgeAdmits('/api/stations/st_406339c8ab53/ownership?x=1')).toBe(false);
  });

  it('does not ask the edge for a block by height (never admitted)', async () => {
    const requests = await renderPublicRoute('/search?q=42', { expectRequests: false });
    await waitFor(() =>
      expect(requests.container?.textContent).toContain('not available on the public site'),
    );
    expect([...requests]).toEqual([]);
  });

  it('never requests per-station earnings in the public build', async () => {
    const container = await renderStationDetail();
    await waitFor(() =>
      expect(container.textContent).toContain('not published on the public testnet site'),
    );
    expect(lastTargets.some(target => target.includes('/earnings'))).toBe(false);
    expect(lastTargets.filter(target => !edgeAdmits(target))).toEqual([]);
  });

  it('POST allowlist admits exactly the infra#1319 send route, the Wolfram reading check and the backend#389 notification writes, and every regex is well formed', () => {
    const post = (edge as unknown as { post: Array<{ path: string; query: string[]; requiresBearer: boolean }> }).post;
    // Demo item 7 adds the forecast check hand-in: no Bearer (the record proves itself against the chain).
    expect(post.map(r => r.path)).toEqual([
      '^/api/wallet/send$',
      '^/api/integrations/wolfram/reading-check$',
      '^/api/notifications/subscriptions$',
      '^/api/notifications/subscriptions/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/test$',
      '^/api/notifications/unsubscribe$',
      '^/api/forecast-verification/forecasts$',
    ]);
    // Of the notification writes, only unsubscribe works without the wallet login (possession of the endpoint or topic).
    expect(post.filter(r => !r.requiresBearer && r.path.includes('/notifications/')).map(r => r.path)).toEqual(['^/api/notifications/unsubscribe$']);
    expect(post[0].requiresBearer).toBe(true);
    expect(post.find(r => r.path === '^/api/forecast-verification/forecasts$')?.requiresBearer).toBeUndefined();
    const own = '0x' + 'ab'.repeat(20);
    expect(edgeAdmits(`/api/wallet/${own}/nonce`)).toBe(true);
    expect(edgeAdmits(`/api/wallet/${own}/nonce?x=1`)).toBe(false);
    expect(edgeAdmits(`/api/wallet/0x${'AB'.repeat(20)}/nonce`)).toBe(false); // edge regex is lowercase-only
    expect(edgeAdmits('/api/wallet/send')).toBe(false); // POST-only route is not a GET route
    for (const route of [...edge.get, ...post]) {
      expect(() => new RegExp(route.path)).not.toThrow();
      expect(route.path).not.toMatch(/\s|\\ /); // no literal space joining two paths
    }
    expect(edge.get.some((r: { name: string }) => r.name === 'join_artifacts')).toBe(false);
  });

  it('the edge fixture refuses what the edge refuses', () => {
    expect(edgeAdmits('/api/weather/stations')).toBe(true);
    expect(edgeAdmits('/api/stations/station-1/observations?limit=1')).toBe(true);
    expect(edgeAdmits('/api/stations/station-1/earnings')).toBe(true);
    for (const refused of [
      '/api/blockchain/blocks/42',
      '/api/stations/station-1/earnings?limit=5', // edge admits the bare path only (infra#1318 era)
      '/api/weather/stations?lat=40&lng=-100',
      '/api/stations/station-1/submissions?limit=100',
      '/api/protocol/transition',
    ]) {
      expect(edgeAdmits(refused)).toBe(false);
    }
  });

  it('coarsens public map markers and skips per-station snapshots', async () => {
    featureFlags.publicReadonly = true;
    featureFlags.fullStudio = false;
    const requests = await renderPublicRoute('/map');

    await waitFor(() =>
      expect(markerPositions).toContainEqual([10.1, -21]),
    );
    expect(
      requests.some(path => path.startsWith('/api/weather/stations/station-1/')),
    ).toBe(false);
  });

  it('keeps exact map marker coordinates in full studio', async () => {
    featureFlags.publicReadonly = true;
    featureFlags.fullStudio = true;
    await renderPublicRoute('/map');

    await waitFor(() =>
      expect(markerPositions).toContainEqual([10.123456, -20.987654]),
    );
  });

  // frontend#349: station detail is public in this build, so it must obey the
  // same position policy as the public map.
  it('shows only grid coordinates and no address on public station detail', async () => {
    featureFlags.publicReadonly = true;
    featureFlags.fullStudio = false;
    const text = (await renderStationDetail()).textContent ?? '';

    expect(text).toContain('10.1, -21.0');
    for (const precise of ['10.12', '-20.99', '10.1235', '-20.9877', '10.123456', '-20.987654', '1 Private Lane']) {
      expect(text).not.toContain(precise);
    }
  });

  it('keeps precise station detail coordinates in full studio', async () => {
    featureFlags.publicReadonly = true;
    featureFlags.fullStudio = true;
    const text = (await renderStationDetail()).textContent ?? '';

    expect(text).toContain('10.1235, -20.9877');
    expect(text).toContain('1 Private Lane, Testville');
  });
});
