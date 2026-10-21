/**
 * @jest-environment jsdom
 */
/**
 * Stage 1.5 public read-only build, rendered through the REAL app: main's App
 * with its real provider tree (theme, react-query with the app's own
 * queryClient, SocialAuth, Capabilities, Integrations, BrowserRouter), the real
 * route tree and the real pages, including the shell's polling and retries.
 *
 * What is faked, and only this:
 *  - import.meta.env: the public Dockerfile.frontend build variables with
 *    VITE_PUBLIC_READONLY_PATHS='true' (jest/viteImportMetaEnvTransformer.cjs
 *    reads globalThis.__VITE_ENV__). No flag parser or policy is mocked;
 *  - the network. fetch is answered by an emulation of the public edge, built
 *    from the pinned allowlist (__fixtures__/public-edge-allowlist.json, infra
 *    #1084 merge). XMLHttpRequest, WebSocket and EventSource only record;
 *  - react-chartjs-2 (jsdom has no canvas). (@mui/material/styles is the REAL
 *    module here, overriding jest.config's speed stub.)
 *
 * Contract (frontend#410 review): for `/` and all six Stage 1.5 routes, every
 * request over a window longer than two 30 s poll periods (with retries) must
 * be admitted by the edge, with the exact query string. Nothing goes over
 * XHR, WebSocket or EventSource.
 */
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterAll, afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { webcrypto } from 'node:crypto';
import { createWebLocksStub, installWebLocks } from '../../services/__fixtures__/webLocksStub';
const restoreLocks = installWebLocks(createWebLocksStub());
afterAll(restoreLocks);
import edge from '../__fixtures__/public-edge-allowlist.json';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// jsdom's crypto lacks subtle; model the HTTPS browser with real WebCrypto.
const originalCrypto = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
afterAll(() => {
  if (originalCrypto) Object.defineProperty(globalThis, 'crypto', originalCrypto);
  else Reflect.deleteProperty(globalThis, 'crypto');
});

const HASH = 'a'.repeat(64);
// Owner ruling 2026-09-27 07:15Z: raw station ids carry first names, so the
// public site uses the backend's opaque alias (stations-data contract:
// `alias` = st_ + 12 hex). RAW_ID is a canary: the row below ALSO carries it,
// as an operator-token response or a pre-alias backend would, and the public
// build must never put it in a request, a URL or the page.
const ALIAS = 'st_3f9a0c12be47';
const RAW_ID = 'KMNFARGO-tony-3';
const STATION = {
  alias: ALIAS,
  id: RAW_ID,
  stationId: RAW_ID,
  name: 'Hilltop station',
  latitude: 46.87,
  longitude: -96.79,
  status: 'active',
  qualityScore: null,
};
const BLOCKS = [
  { height: 24356, hash: 'b'.repeat(64), previousHash: 'c'.repeat(64), timestamp: '2026-09-27T02:07:45+00:00', transactions: 5 },
  { height: 24357, hash: 'd'.repeat(64), previousHash: 'b'.repeat(64), timestamp: '2026-09-27T02:12:12+00:00', transactions: 3 },
];

// Real response shape (backend weather-leaderboard-routes): short address plus opaque profileKey, exact
// base-unit amount as a string. 90071992.54740993 WRF is above 2^53 base units' float range on purpose.
const LEADERBOARD = {
  metric: 'earnings',
  amountUnits: { available: true },
  entries: [
    { rank: 1, displayName: 'Hilltop', walletAddress: '0xa1a1…a1a1', profileKey: 'c_0123456789abcdef01234567', value: 90071992.54740993, earningsBaseUnits: '9007199254740993', earningsWrf: '90071992.54740993', badgeLevel: 'gold' },
    { rank: 2, displayName: 'Valley', walletAddress: '0xb2b2…b2b2', profileKey: 'c_89abcdef0123456789abcdef', value: 0.00000001, earningsBaseUnits: '1', earningsWrf: '0.00000001' },
  ],
  updatedAt: '2026-10-08T00:00:00.000Z',
};

function edgeRoute(target) {
  const url = new URL(target, 'http://localhost');
  const query = url.search.replace(/^\?/, '');
  return edge.get.find(route =>
    new RegExp(route.path).test(url.pathname) &&
    (route.query === null || route.query.includes(query) ||
      (route.queryPattern && new RegExp(route.queryPattern).test(query))),
  );
}

// Plausible backend answers for the admitted reads (shapes from backend main).
function backendAnswer(name, pathname) {
  switch (name) {
  case 'public_capabilities':
    // The LIVE public edge (checked 2026-10-08): no evidence provider is wired, so `leaderboard` is
    // configured/unverified. A test swaps `leaderboardCapability` to exercise the other statuses.
    return [200, { features: leaderboardCapability ? { leaderboard: leaderboardCapability } : {}, readiness: {} }];
  case 'chain_status':
    return [200, { success: true, height: 24357, status: 'synced' }];
  case 'chain_blocks':
    return [200, { success: true, blocks: BLOCKS, total: 24358, page: 1, limit: 25 }];
  case 'chain_transaction_detail':
  case 'chain_transactions':
  case 'chain_validators':
  case 'chain_stats':
    return [501, { success: false, error: { code: 'NOT_IMPLEMENTED' } }];
  case 'weather_coverage_zones':
    return [200, { zones: [] }];
  case 'public_readonly_stations':
    return [200, { stations: stationRows, total: stationRows.length, hasMore: false, nextCursor: null, source: 'wrfcoin-contributors' }];
  case 'public_readonly_station_detail':
    // Contract: anonymous detail reads take the alias; a raw id is 404.
    if (!pathname.startsWith(`/api/stations/${ALIAS}/`)) return [404, { error: { code: 'STATION_NOT_FOUND' } }];
    if (pathname.endsWith('/observations')) return [200, { observations: [], source: 'backend-db', unavailable: ['observations'] }];
    if (pathname.endsWith('/quality')) return [200, { overall: null, dimensions: [], advisory: true, unavailable: ['quality'] }];
    return [200, { submissions: [], source: 'backend-db', limit: 25, offset: 0 }];
  case 'public_weather_leaderboard':
    return [200, LEADERBOARD];
  default:
    return [200, {}];
  }
}

let fetched = [];
let otherChannels = [];
// The station list the fake backend serves; one test swaps in two stations.
let stationRows = [STATION];
let leaderboardCapability = { status: 'configured', reasonCode: 'unverified' };

function installEdge() {
  fetched = [];
  otherChannels = [];
  globalThis.fetch = jest.fn(async (input, init) => {
    const raw = typeof input === 'string' ? input : input?.url ?? String(input);
    const url = new URL(raw, 'http://localhost');
    const method = (init?.method ?? input?.method ?? 'GET').toUpperCase();
    const sameOrigin = url.origin === 'http://localhost';
    const target = `${url.pathname}${url.search}`;
    const route = sameOrigin && method === 'GET' ? edgeRoute(target) : undefined;
    fetched.push({ method, target: sameOrigin ? target : url.href, admitted: Boolean(route) });
    if (!route) {
      return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain' } });
    }
    const [status, body] = backendAnswer(route.name, url.pathname);
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  });

  class RecordingXHR {
    open(method, url) { otherChannels.push(`XHR ${method} ${url}`); }
    setRequestHeader() {}
    send() { setTimeout(() => this.onerror?.(new Event('error')), 0); }
    abort() {}
    addEventListener() {}
    removeEventListener() {}
  }
  class RecordingSocket {
    constructor(url) { otherChannels.push(`WS ${url}`); this.readyState = 3; }
    send() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  }
  class RecordingEventSource {
    constructor(url) { otherChannels.push(`SSE ${url}`); }
    close() {}
    addEventListener() {}
    removeEventListener() {}
  }
  globalThis.XMLHttpRequest = RecordingXHR;
  globalThis.WebSocket = RecordingSocket;
  globalThis.EventSource = RecordingEventSource;
}

// The public Dockerfile.frontend build args with Stage 1.5 on (infra r12 §4.4):
// every VITE_ENABLE_* empty, VITE_PUBLIC_READONLY_PATHS exactly 'true'.
const PUBLIC_READONLY_BUILD_ENV = {
  VITE_API_URL: '',
  VITE_WRFCOIN_CHAIN_ID: '777',
  VITE_WRFCOIN_NETWORK_ID: 'testnet',
  VITE_WALLET_AUTH_ORIGIN: 'https://wrfcoin-testnet.taila1c049.ts.net',
  VITE_ENABLE_FULL_STUDIO: '',
  VITE_ENABLE_DEMO_SURFACES: '',
  VITE_ENABLE_OPERATOR_PREVIEW: '',
  VITE_PUBLIC_READONLY_PATHS: 'true',
  MODE: 'production',
  PROD: true,
  DEV: false,
};

// Flags are read at module load (features.ts, App.jsx, route modules), so the
// build env is in place BEFORE the app is imported, once, for the whole file.
globalThis.__VITE_ENV__ = PUBLIC_READONLY_BUILD_ENV;
await jest.unstable_mockModule('react-chartjs-2', () => ({ Line: () => null, Bar: () => null, Doughnut: () => null }));
// jest.config maps `@mui/material/styles` to a minimal stub (for speed). This
// test renders the real theme provider, so it loads the REAL module by file
// path (the mapper only matches the bare specifier) and serves it for the
// specifier too.
const realMuiStyles = await import('../../../node_modules/@mui/material/esm/styles/index.js');
await jest.unstable_mockModule('@mui/material/styles', () => realMuiStyles);
const { default: App } = await import('../../App');
// The app's own singleton client (App.jsx wraps everything in it); emptied
// between routes so each route starts cold, like a fresh page load.
const { default: appQueryClient } = await import('../../lib/queryClient');
// The same singletons the App uses (frontend#440 review wallet controls).
const { walletProviderManager } = await import('../../services/walletProviders/WalletProviderManager.js');
const { WalletProvider, useWallet, PASSIVE_WALLET_MESSAGE } = await import('../../contexts/WalletContext.jsx');
const { setSecureWallet, setActiveProvider } = await import('../../services/secureWalletStorage');
const { saveVault } = await import('../../services/walletVault');
const { setAuthToken, getAuthToken, clearAuthToken } = await import('../../services/authTokenStore');

async function renderPublicApp(path) {
  window.history.replaceState({}, '', path);
  let view;
  await act(async () => {
    view = render(React.createElement(App));
  });
  return view;
}

// Longer than two 30 s poll periods, in steps small enough for react-query's
// 1 s / 2 s / 4 s retry backoff and the loader's short delays to all fire.
async function soak(ms = 75_000, step = 500) {
  for (let elapsed = 0; elapsed < ms; elapsed += step) {
    await act(async () => {
      await jest.advanceTimersByTimeAsync(step);
    });
  }
}

const ROUTES = [
  { path: '/', expect: ['/api/blockchain/status'] },
  { path: '/explore', expect: ['/api/blockchain/blocks?limit=25'], text: 'Block Explorer' },
  { path: '/explorer', expect: ['/api/blockchain/blocks?limit=25'], text: 'Block Explorer', url: '/explore?tab=blocks' },
  { path: '/search', expect: [], text: 'Search the testnet' },
  { path: `/search?q=${HASH}`, expect: [`/api/blockchain/transactions/${HASH}`], text: 'not available on this testnet yet' },
  { path: '/search?q=24356', expect: [], text: 'not available on the public site' },
  { path: '/map', expect: ['/api/weather/stations'], text: 'Weather Network Map' },
  // frontend#437: the onboarding loop, with no keys on the web.
  { path: '/onboarding', expect: [], text: 'Create New Wallet' },
  // Owner ruling 2026-10-08: the public leaderboard; the edge admits only the one query grammar.
  { path: '/leaderboard/contributors', expect: ['/api/weather/leaderboard?metric=earnings&period=7d&limit=25'], text: '90,071,992.54740993 WRF' },
  {
    path: `/weather/station/${ALIAS}`,
    expect: [
      '/api/weather/stations',
      `/api/stations/${ALIAS}/observations?limit=1`,
      `/api/stations/${ALIAS}/quality`,
      `/api/stations/${ALIAS}/submissions`,
    ],
    text: 'Per-station earnings are not published on the public testnet site.',
  },
];

describe('Stage 1.5 public build through the real App shell', () => {
  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: false });
    installEdge();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    appQueryClient.clear();
    jest.clearAllTimers();
    jest.useRealTimers();
    window.history.replaceState({}, '', '/');
  });

  for (const route of ROUTES) {
    it(`${route.path}: every request in a 75 s window is admitted by the public edge`, async () => {
      const view = await renderPublicApp(route.path);
      await soak();

      // Not vacuous: the page rendered and made its own reads.
      if (route.text) expect(view.container.textContent).toContain(route.text);
      if (route.url) expect(`${window.location.pathname}${window.location.search}`).toBe(route.url);
      const targets = fetched.map(request => request.target);
      expect(targets).toEqual(expect.arrayContaining(['/api/capabilities', ...route.expect]));
      // The window really ran the pollers: capabilities polls every 60 s,
      // station observations every 15 s.
      expect(targets.filter(target => target === '/api/capabilities').length).toBeGreaterThanOrEqual(2);
      if (route.path.startsWith('/weather/station/')) {
        expect(targets.filter(target => target.endsWith('/observations?limit=1')).length).toBeGreaterThanOrEqual(4);
        // Name only: no "ID:" subtitle in the public build.
        expect(view.container.textContent).toContain('Hilltop station');
        expect(view.container.textContent).not.toContain('ID: ');
      }

      expect(fetched.filter(request => !request.admitted)).toEqual([]);
      expect(otherChannels).toEqual([]);
      // The edge-denied shell reads the review found are gone (frontend#416).
      expect(targets.some(target => target.startsWith('/api/protocol/transition'))).toBe(false);
      expect(targets.some(target => target.startsWith('/api/stats'))).toBe(false);

      // /map: open the real Leaflet popup and follow "Station report". The
      // link builder is only exercised on click, so drive it.
      if (route.path === '/map') {
        const marker = view.container.querySelector('.wrfcoin-station-marker');
        expect(marker).not.toBeNull();
        await act(async () => { marker.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
        await soak(2_000);
        const report = Array.from(document.querySelectorAll('button')).find(button => button.textContent === 'Station report');
        expect(report).toBeDefined();
        await act(async () => { report.click(); });
        await soak(5_000);
        expect(window.location.pathname).toBe(`/weather/station/${ALIAS}`);
        targets.push(...fetched.map(request => request.target).filter(target => !targets.includes(target)));
      }

      // No raw station id anywhere the public can see it (owner ruling 07:15Z).
      const leaks = value => value.toLowerCase().includes(RAW_ID.toLowerCase());
      expect(targets.filter(leaks)).toEqual([]);
      expect(leaks(`${window.location.pathname}${window.location.search}${window.location.hash}`)).toBe(false);
      expect(leaks(view.container.textContent ?? '')).toBe(false);
      expect(leaks(document.body.innerHTML)).toBe(false);
      expect(leaks(document.title)).toBe(false);
    }, 60_000);
  }
});

describe('public leaderboard through the real App shell', () => {
  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: false });
    installEdge();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    appQueryClient.clear();
    jest.clearAllTimers();
    jest.useRealTimers();
    window.history.replaceState({}, '', '/');
  });

  const click = async (container, name) => {
    const tab = Array.from(container.querySelectorAll('[role="tab"]')).find(t => t.textContent === name);
    expect(tab).toBeDefined();
    await act(async () => { tab.click(); });
    await soak(2_000);
  };

  it('every tab and period sends the one admitted query: metric, period, limit<=30, never a geo parameter', async () => {
    const view = await renderPublicApp('/leaderboard/contributors');
    await soak(2_000);
    expect(view.container.textContent).toContain('Contributor Leaderboard');
    for (const metric of ['Readings', 'Quality', 'Streak', 'Earnings']) {
      await click(view.container, metric);
      for (const period of ['30 days', 'All time', '7 days']) {
        if (metric !== 'Earnings') await click(view.container, period);
      }
    }
    const reads = fetched.filter(request => request.target.startsWith('/api/weather/leaderboard'));
    expect(reads.map(request => request.target)).toEqual(expect.arrayContaining([
      '/api/weather/leaderboard?metric=earnings&period=7d&limit=25',
      '/api/weather/leaderboard?metric=submissions&period=7d&limit=25',
      '/api/weather/leaderboard?metric=quality_score&period=30d&limit=25',
      '/api/weather/leaderboard?metric=streak&period=all&limit=25',
    ]));
    for (const request of reads) {
      expect(request.target).toMatch(/^\/api\/weather\/leaderboard\?metric=[a-z_]+&period=(7d|30d|all)&limit=25$/);
      expect(request.target).not.toMatch(/region|country|near|radius/);
    }
    expect(fetched.filter(request => !request.admitted)).toEqual([]);
    expect(otherChannels).toEqual([]);
  }, 60_000);

  it('shows exact base units, no region controls, no placeholder rows, and links only to pages the build mounts', async () => {
    const view = await renderPublicApp('/leaderboard/contributors');
    await soak(2_000);
    const text = view.container.textContent;
    expect(text).toContain('90,071,992.54740993 WRF');
    expect(text).toContain('0.00000001 WRF');
    expect(text).not.toMatch(/Soon|Region|auto-refreshes/);
    expect(view.container.querySelectorAll('tbody tr')).toHaveLength(2);
    // The row with no badgeLevel from the API gets no invented 'bronze'.
    expect(text).not.toContain('bronze');
    const hrefs = Array.from(view.container.querySelectorAll('a')).map(a => a.getAttribute('href'));
    expect(hrefs.filter(href => /^\/(impact|referrals|leaderboard|wallet|connect-station|earn)/.test(href ?? '') && href !== '/leaderboard/contributors')).toEqual([]);
  }, 60_000);

  it('an unavailable earnings read says so: no rows, no empty-list claim', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = jest.fn(async (input, init) => {
      const raw = typeof input === 'string' ? input : input?.url ?? String(input);
      if (raw.startsWith('/api/weather/leaderboard')) {
        return new Response(JSON.stringify({ unavailable: ['earnings'], entries: [] }), { status: 503, headers: { 'content-type': 'application/json' } });
      }
      return original(input, init);
    });
    const view = await renderPublicApp('/leaderboard/contributors');
    await soak(2_000);
    expect(view.container.textContent).toContain('Earnings are unavailable right now');
    expect(view.container.textContent).not.toContain('No contributor has earned WRF yet');
    expect(view.container.querySelectorAll('tbody tr')).toHaveLength(0);
  }, 60_000);

  it.each([
    [{ status: 'configured', reasonCode: 'unverified' }, true],
    [{ status: 'operational', reasonCode: 'ok' }, true],
    [{ status: 'degraded', reasonCode: 'degraded' }, true],
    [{ status: 'reachable', reasonCode: 'reachable' }, false],
    [{ status: 'simulated', reasonCode: 'simulated' }, false],
    [{ status: 'unavailable', reasonCode: 'not_wired' }, false],
    [undefined, false],
  ])('capability %j mounts the page: %s', async (capability, mounted) => {
    leaderboardCapability = capability;
    try {
      const view = await renderPublicApp('/leaderboard/contributors');
      await soak(2_000);
      expect(view.container.textContent.includes('Contributor Leaderboard')).toBe(mounted);
      const reads = fetched.filter(request => request.target.startsWith('/api/weather/leaderboard'));
      expect(reads.length > 0).toBe(mounted);
    } finally {
      leaderboardCapability = { status: 'configured', reasonCode: 'unverified' };
    }
  }, 60_000);

  it('a failed capabilities read does not mount the page', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = jest.fn(async (input, init) => {
      const raw = typeof input === 'string' ? input : input?.url ?? String(input);
      if (raw.startsWith('/api/capabilities')) return new Response('nope', { status: 503 });
      return original(input, init);
    });
    const view = await renderPublicApp('/leaderboard/contributors');
    await soak(10_000);
    expect(view.container.textContent).not.toContain('Contributor Leaderboard');
  }, 60_000);

  it('subpaths and the operator leaderboard are not mounted', async () => {
    for (const path of ['/leaderboard', '/leaderboard/contributors/x', '/leaderboard/nearby']) {
      const view = await renderPublicApp(path);
      await soak(2_000);
      expect(view.container.textContent).not.toContain('Contributor Leaderboard');
      expect(fetched.filter(request => request.target.startsWith('/api/weather/leaderboard'))).toEqual([]);
      view.unmount();
      appQueryClient.clear();
    }
  }, 60_000);
});

// frontend#436 review: two stations in one public 0.1 degree cell. Real App,
// real hooks and route tree, real Leaflet. Obviously fake coordinates.
describe('stations sharing a public cell through the real App shell', () => {
  const NORTH = { alias: 'st_aaaaaaaaaaaa', id: 'st_aaaaaaaaaaaa', stationId: 'st_aaaaaaaaaaaa', name: 'North fake station', latitude: 10.101, longitude: -20.991, status: 'active', qualityScore: null };
  const SOUTH = { alias: 'st_bbbbbbbbbbbb', id: 'st_bbbbbbbbbbbb', stationId: 'st_bbbbbbbbbbbb', name: 'South fake station', latitude: 10.109, longitude: -20.989, status: 'active', qualityScore: null };

  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: false });
    installEdge();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    appQueryClient.clear();
    jest.clearAllTimers();
    jest.useRealTimers();
    window.history.replaceState({}, '', '/');
    stationRows = [STATION];
  });

  async function openCell() {
    const view = await renderPublicApp('/map');
    await soak(5_000);
    const markers = view.container.querySelectorAll('.wrfcoin-station-marker');
    const cells = view.container.querySelectorAll('.wrfcoin-station-cell-marker');
    expect(markers).toHaveLength(1); // one marker for the cell, nothing stacked under it
    expect(cells).toHaveLength(1);
    expect(cells[0].textContent).toContain('2');
    await act(async () => { cells[0].dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
    await soak(2_000);
    return view;
  }

  it.each([
    ['North fake station', NORTH.alias],
    ['South fake station', SOUTH.alias],
  ])('one marker with a count; the list selects %s and opens its station page', async (name, alias) => {
    stationRows = [NORTH, SOUTH];
    await openCell();
    const list = document.querySelector('[data-testid="station-cell-list"]');
    expect(list).not.toBeNull();
    expect(list.textContent).toContain('2 stations in this area');
    expect(list.textContent).toContain('North fake station');
    expect(list.textContent).toContain('South fake station');
    // The cell sits at the coarse position only.
    expect(document.body.innerHTML).not.toMatch(/10\.10[19]|20\.9(89|91)/);
    const pick = Array.from(list.querySelectorAll('button')).find(button => button.textContent === name);
    expect(pick).toBeDefined();
    await act(async () => { pick.click(); });
    await soak(2_000);
    expect(window.location.pathname).toBe(`/weather/station/${alias}`);
  }, 60_000);

  it('control: stations in different cells keep one plain marker each', async () => {
    stationRows = [NORTH, { ...SOUTH, latitude: 10.201 }];
    const view = await renderPublicApp('/map');
    await soak(5_000);
    expect(view.container.querySelectorAll('.wrfcoin-station-marker')).toHaveLength(2);
    expect(view.container.querySelectorAll('.wrfcoin-station-cell-marker')).toHaveLength(0);
  }, 60_000);
});

// frontend#436 review r2: an owner-entered station name can carry a position.
// The public map popup, the cell list and the station page all show it at one
// decimal; an ordinary name is shown as written (the routes above).
describe('station names that carry coordinates through the real App shell', () => {
  const NAMED = { ...STATION, name: 'Hilltop 10.123456,-21' };

  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: false });
    installEdge();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    appQueryClient.clear();
    jest.clearAllTimers();
    jest.useRealTimers();
    window.history.replaceState({}, '', '/');
    stationRows = [STATION];
  });

  it('/map popup shows the name at one decimal', async () => {
    stationRows = [NAMED];
    const view = await renderPublicApp('/map');
    await soak(5_000);
    const marker = view.container.querySelector('.wrfcoin-station-marker');
    await act(async () => { marker.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
    await soak(2_000);
    expect(document.body.textContent).toContain('Hilltop 10.1,-21');
    expect(document.body.innerHTML).not.toContain('10.123456');
  }, 60_000);

  it('/map cell list shows the name at one decimal', async () => {
    stationRows = [
      { ...NAMED, alias: 'st_aaaaaaaaaaaa', id: 'st_aaaaaaaaaaaa', stationId: 'st_aaaaaaaaaaaa', latitude: 10.101, longitude: -20.991 },
      { ...STATION, alias: 'st_bbbbbbbbbbbb', id: 'st_bbbbbbbbbbbb', stationId: 'st_bbbbbbbbbbbb', name: 'Hilltop station', latitude: 10.109, longitude: -20.989 },
    ];
    const view = await renderPublicApp('/map');
    await soak(5_000);
    const cell = view.container.querySelector('.wrfcoin-station-cell-marker');
    await act(async () => { cell.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
    await soak(2_000);
    const list = document.querySelector('[data-testid="station-cell-list"]');
    expect(list.textContent).toContain('Hilltop 10.1,-21');
    expect(list.textContent).toContain('Hilltop station');
    expect(document.body.innerHTML).not.toContain('10.123456');
  }, 60_000);

  it('the station page shows the name at one decimal', async () => {
    stationRows = [NAMED];
    const view = await renderPublicApp(`/weather/station/${ALIAS}`);
    await soak(5_000);
    expect(view.container.textContent).toContain('Hilltop 10.1,-21');
    expect(document.body.innerHTML).not.toContain('10.123456');
    expect(document.title).not.toContain('10.123456');
  }, 60_000);
});

// frontend#437: what the public /onboarding page does NOT offer, and what stays
// hidden around it.
describe('public onboarding loop through the real App shell', () => {
  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: false });
    installEdge();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    appQueryClient.clear();
    jest.clearAllTimers();
    jest.useRealTimers();
    window.history.replaceState({}, '', '/');
  });

  // frontend#440 review: retained wallet state must not be restored on the
  // public page. The mnemonic is the published BIP-39 test vector (synthetic).
  const SYNTHETIC_MNEMONIC =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  // Wallet, provider, session-secret and auth keys only: the shell's own
  // theme, integrations and onboarding-progress keys are not wallet state.
  const WALLET_STATE_KEY = /^wrfcoin_(wallet|active_provider)|auth|jwt|token|mnemonic|secret/i;
  const storageSnapshot = () => {
    const snap = {};
    for (const [name, store] of [['local', localStorage], ['session', sessionStorage]]) {
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i);
        if (WALLET_STATE_KEY.test(key)) snap[`${name}:${key}`] = store.getItem(key);
      }
    }
    return snap;
  };
  const walletSpies = () => ({
    autoConnect: jest.spyOn(walletProviderManager, 'autoConnect'),
    connect: jest.spyOn(walletProviderManager, 'connect'),
  });
  const authRequests = () => fetched.filter(f => f.target.includes('/api/auth'));

  it('/onboarding: a retained custom session stays locked until the vault password is entered', async () => {
    const address = '0x3f995ceb27e8177077dbed8b1e4f696af74da492';
    // Published BIP-39 vector; no network login transport is permitted here.
    await saveVault(SYNTHETIC_MNEMONIC, address, 'synthetic-browser-password');
    const vault = localStorage.getItem('wrfcoin_wallet_vault_v1');
    setSecureWallet({ mnemonic: SYNTHETIC_MNEMONIC, address, passphrase: '' });
    setActiveProvider('custom');
    setAuthToken('synthetic-retained-login');
    const connect = jest.spyOn(walletProviderManager, 'connect');
    try {
      const view = await renderPublicApp('/onboarding');
      await soak(5_000);
      expect(view.container.textContent).toContain('Unlock Wallet');
      expect(connect).not.toHaveBeenCalled();
      expect(authRequests()).toEqual([]);
      expect(walletProviderManager.getLoginIdentity()).toBeNull();
      expect(getAuthToken()).toBe('');
      expect(sessionStorage.getItem('wrfcoin_wallet_secure')).toBeNull();
      expect(sessionStorage.getItem('wrfcoin_wallet_session_secret')).toBeNull();
      expect(localStorage.getItem('wrfcoin_wallet_vault_v1')).toBe(vault);
    } finally { connect.mockRestore(); await walletProviderManager.disconnect(); clearAuthToken(); }
  }, 60_000);

  it('/onboarding: retained legacy address metadata cannot bypass explicit setup', async () => {
    localStorage.setItem('wrfcoin_wallet', JSON.stringify({ address: '0x1111111111111111111111111111111111111111', type: 'created' }));
    localStorage.setItem('wrfcoin_active_provider', 'custom');
    const before = storageSnapshot();
    const spies = walletSpies();
    try {
      const view = await renderPublicApp('/onboarding');
      await soak(5_000);
      expect(view.container.textContent).toContain('Create New Wallet');
      expect(view.container.textContent).not.toContain('0x1111111111111111111111111111111111111111');
      expect(spies.autoConnect).toHaveBeenCalled();
      expect(authRequests()).toEqual([]);
    } finally {
      spies.autoConnect.mockRestore();
      spies.connect.mockRestore();
    }
  }, 60_000);

  it('/onboarding with a retained browser wallet: no account request, no wallet login', async () => {
    const request = jest.fn(async () => [`0x${'c'.repeat(40)}`]);
    window.ethereum = { isMetaMask: true, request, on: jest.fn(), removeListener: jest.fn() };
    localStorage.setItem('wrfcoin_active_provider', 'metamask');
    const before = storageSnapshot();
    const spies = walletSpies();
    try {
      await renderPublicApp('/onboarding');
      await soak(5_000);
      expect(request).not.toHaveBeenCalled();
      expect(spies.autoConnect).toHaveBeenCalled();
      expect(spies.connect).not.toHaveBeenCalled();
      expect(storageSnapshot()).not.toHaveProperty('local:wrfcoin_active_provider');
      expect(authRequests()).toEqual([]);
    } finally {
      spies.autoConnect.mockRestore();
      spies.connect.mockRestore();
      delete window.ethereum;
    }
  }, 60_000);

  it('the provider is passive by default in the public build and refuses wallet actions; an explicit non-passive provider does auto-connect (operator behaviour)', async () => {
    const spies = walletSpies();
    spies.autoConnect.mockResolvedValue(null);
    let api;
    const Probe = () => { api = useWallet(); return null; };
    try {
      await act(async () => {
        render(React.createElement(WalletProvider, null, React.createElement(Probe)));
      });
      expect(api.isPassive).toBe(true);
      expect(spies.autoConnect).not.toHaveBeenCalled();
      for (const action of ['connectWallet', 'authenticateWallet', 'createCustomWallet', 'importCustomWallet', 'sendTransaction', 'switchChain']) {
        await expect(api[action]('x')).rejects.toThrow(PASSIVE_WALLET_MESSAGE);
      }
      // frontend#374: there is no generic signing action at all.
      expect(api.signMessage).toBeUndefined();
      expect(spies.connect).not.toHaveBeenCalled();
      cleanup();

      // Positive control: the same provider, not passive, runs its auto-connect.
      await act(async () => {
        render(React.createElement(WalletProvider, { passive: false }, React.createElement(Probe)));
      });
      expect(api.isPassive).toBe(false);
      expect(spies.autoConnect).toHaveBeenCalledTimes(1);
    } finally {
      spies.autoConnect.mockRestore();
      spies.connect.mockRestore();
    }
  });

  it('/onboarding: saved progress cannot bypass wallet setup in a new session', async () => {
    localStorage.setItem('wrfcoin_onboarding', JSON.stringify({ currentStep: 2, completedSteps: { 0: { walletAddress: '0x1111111111111111111111111111111111111111' } }, walletAddress: '0x1111111111111111111111111111111111111111' }));
    const view = await renderPublicApp('/onboarding');
    await soak(5_000);
    expect(view.container.textContent).toContain('Create New Wallet');
    expect(view.container.textContent).not.toContain('0x1111111111111111111111111111111111111111');
    expect(authRequests()).toEqual([]);
  }, 60_000);

  it('/onboarding: offers first-party create/import with backup, without browser or social wallets', async () => {
    const view = await renderPublicApp('/onboarding');
    await soak(5_000);
    const text = view.container.textContent ?? '';
    expect(text).toContain('Create New Wallet');
    expect(text).toContain('Import Recovery Phrase');
    expect(text).toContain('backup');
    expect(text).not.toContain('Connect Browser Wallet');
    expect(document.getElementById('google-gsi-script')).toBeNull();
    expect(view.container.querySelector('input[type="password"]')).toBeNull();
  }, 60_000);

  it('/wallet: a retained EVM provider never prompts for an account or login', async () => {
    const request = jest.fn(async () => ['0x1111111111111111111111111111111111111111']);
    window.ethereum = { isMetaMask: true, request, on: jest.fn(), removeListener: jest.fn() };
    localStorage.setItem('wrfcoin_active_provider', 'metamask');
    const autoConnect = jest.spyOn(walletProviderManager, 'autoConnect');
    try {
      const view = await renderPublicApp('/wallet');
      await soak(5_000);
      expect(view.container.textContent).toContain('Create, import or unlock your wallet');
      expect(autoConnect).toHaveBeenCalled();
      expect(request).not.toHaveBeenCalled();
      expect(authRequests()).toEqual([]);
      expect(localStorage.getItem('wrfcoin_active_provider')).toBeNull();
    } finally { autoConnect.mockRestore(); delete window.ethereum; }
  }, 60_000);

  it('/wallet renders the own-address page with no Send or arbitrary-address lookup', async () => {
    const view = await renderPublicApp('/wallet?address=0x1111111111111111111111111111111111111111');
    await soak(5_000);
    const text = view.container.textContent ?? '';
    expect(text).toContain('Create, import or unlock your wallet');
    expect(text).not.toContain('0x1111111111111111111111111111111111111111');
    expect(view.container.querySelector('input')).toBeNull();
    expect(text).not.toMatch(/Send|Balance|Transaction History/);
    expect(fetched.filter(f => /balance|transactions|history/.test(f.target))).toEqual([]);
  }, 60_000);

  // W28 (owner ruling 2026-10-02 #14): the exact /connect-station and /earn are public. Without a signed-in
  // first-party wallet they send the visitor to wallet setup and never offer to create a second wallet.
  it.each(['/connect-station', '/earn'])('%s renders the station join with the one-wallet step, no wallet creation', async path => {
    const view = await renderPublicApp(path);
    await soak(2_000);
    const text = view.container.textContent ?? '';
    expect(text).toContain('Connect Your Weather Station');
    expect(text).toContain('Set up or unlock your wallet first');
    expect(text).toContain('Open wallet setup');
    expect(text).not.toContain('Page Not Found');
    expect(text).not.toMatch(/Create a new wallet|recovery phrase|Generate/);
    expect(view.container.querySelector('input')).toBeNull();
  }, 60_000);

  it.each([
    '/connect-station/x', '/earn/x', '/earnings', '/weather/onboarding',
    '/onboarding/qr', '/onboarding/auto-detect', '/onboarding/streak-shield',
    '/weather/dashboard', '/dashboard',
  ])('%s stays hidden in the public build', async path => {
    const hidden = await renderPublicApp(path);
    await soak(2_000);
    const hiddenText = hidden.container.textContent ?? '';
    cleanup();
    appQueryClient.clear();
    const unknown = await renderPublicApp('/this-route-does-not-exist');
    await soak(2_000);
    // The hidden route renders exactly what an unknown route renders, from the
    // 404 on (the header before it echoes the path's name).
    const fromNotFound = text => text.slice(text.indexOf('404'));
    expect(hiddenText).toContain('Page Not Found');
    expect(fromNotFound(hiddenText)).toBe(fromNotFound(unknown.container.textContent ?? ''));
  }, 60_000);

  it('/onboarding: unsupported encryption shows the vault notice without wallet inputs', async () => {
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
    try {
      const view = await renderPublicApp('/onboarding');
      await soak(5_000);
      const setup = view.container.querySelector('[aria-label="Web wallet setup"]');
      expect(setup.textContent).toContain('This browser cannot store a wallet securely here');
      expect(setup.querySelector('input, textarea, button')).toBeNull();
      expect(setup.textContent).not.toContain('Create New Wallet');
      expect(setup.textContent).not.toContain('Import Recovery Phrase');
    } finally { Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true }); }
  }, 60_000);
});
