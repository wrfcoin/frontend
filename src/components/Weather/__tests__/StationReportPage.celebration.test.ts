/** @jest-environment jsdom */
/**
 * frontend#387: "My first WRF earned" is shown only to the station's
 * backend-confirmed owner, and never in the Stage 1.5 public read-only build.
 * Real StationReportPage, real hooks and services; only fetch is faked.
 */
import React, { Suspense } from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const featureFlags = { publicReadonly: false, fullStudio: true };

await jest.unstable_mockModule('../../../config/features', () => ({
  FEATURES: featureFlags,
  default: featureFlags,
}));
// Charts need a canvas; the dialog is what is under test.
await jest.unstable_mockModule('react-chartjs-2', () => ({
  Line: () => null,
  Bar: () => null,
}));

const { default: StationReportPage } = await import('../StationReportPage');
const { setAuthToken, clearAuthToken, getAuthToken } = await import('../../../services/authTokenStore');
const { walletAuthService, clearWalletAuthSession } = await import('../../../services/walletAuthService');

const OWNER = '0x1111111111111111111111111111111111111111';
const STRANGER = '0x2222222222222222222222222222222222222222';
const CELEBRATION = 'Your station is earning WRF';

function jwtFor(sub: string): string {
  const b64 = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub })}.signature`;
}

function rewardProgress(ownerAddress: string) {
  return {
    schemaVersion: 1,
    stationId: 'station-1',
    ownerAddress,
    state: 'AWAITING_OBSERVATION',
    asOf: '2026-09-26T12:00:00.000Z',
    evidenceFresh: true,
    registration: { state: 'REGISTERED', registeredAt: '2026-09-20T12:00:00.000Z' },
    chain: null,
    observation: null,
    contribution: null,
    reward: null,
    diagnostic: null,
  };
}

type Backend = { owner: string | null; progressOwnerOverride?: string };

let requests: Array<{ path: string; auth: string | null }> = [];

function installBackend({ owner, progressOwnerOverride }: Backend) {
  requests = [];
  global.fetch = jest.fn(async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const path = new URL(String(input), 'https://test.invalid').pathname;
    const headers = new Headers(init?.headers);
    const auth = headers.get('authorization');
    requests.push({ path, auth });
    const json = (status: number, body: unknown) =>
      new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

    if (path === '/api/weather/stations') {
      return json(200, {
        stations: [{ id: 'station-1', name: 'Hilltop station', status: 'active' }],
        total: 1, hasMore: false, nextCursor: null, source: 'wrfcoin-contributors',
      });
    }
    if (path === '/api/stations/station-1/earnings') {
      return json(200, {
        // The backend's real reward-evidence row (station-detail-routes.ts).
        earnings: [{
          commitId: 'ee'.repeat(32), rewarded: true, amountBaseUnits: '1500000000000000000', amountWrf: '-',
          blocker: null, finalized: true, height: 9, blockTimestamp: '2026-09-25T12:00:00.000Z',
        }],
        source: 'core4',
        window: { commits: 1, complete: true, scope: 'recent-observations' },
        totals: { rewardedCommits: 1, unknownCommits: 0, rewardedBaseUnits: '1500000000000000000', rewardedWrf: '-', note: 'sum over the recent window only, not a lifetime total' },
      });
    }
    if (path === '/api/auth/refresh') {
      return json(401, { error: { code: 'REFRESH_REJECTED' } });
    }
    if (path === '/api/weather/stations/station-1/reward-progress') {
      // Backend weather-routes.js: 401 without a wallet, 404 for any wallet
      // that does not own the station, 200 with the projection for the owner.
      const sub = auth ? JSON.parse(atob(auth.slice(7).split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub : null;
      if (!sub) return json(401, { error: { code: 'UNAUTHORIZED' } });
      if (owner === null || sub !== owner) return json(404, { error: { code: 'NOT_FOUND' } });
      return json(200, rewardProgress(progressOwnerOverride ?? owner));
    }
    return json(200, []);
  }) as typeof fetch;
}

async function renderStation() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    React.createElement(
      QueryClientProvider,
      { client },
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/weather/station/station-1'] },
        React.createElement(
          Suspense,
          { fallback: null },
          React.createElement(
            Routes,
            null,
            React.createElement(Route, {
              path: '/weather/station/:stationId',
              element: React.createElement(StationReportPage),
            }),
          ),
        ),
      ),
    ),
  );
  await screen.findByText('Hilltop station');
  if (featureFlags.publicReadonly && !featureFlags.fullStudio) {
    // The public build never reads per-station earnings (the public edge
    // 404s them); it says so instead. Let the other station reads settle.
    await screen.findByText(/not published on the public testnet site/);
    await waitFor(() =>
      expect(requests.some(r => r.path === '/api/stations/station-1/submissions')).toBe(true),
    );
    expect(requests.some(r => r.path.endsWith('/earnings'))).toBe(false);
    return;
  }
  // The earnings history (the celebration's data) has arrived and rendered.
  await waitFor(() =>
    expect(requests.some(r => r.path === '/api/stations/station-1/earnings')).toBe(true),
  );
  await waitFor(() => expect(screen.queryByText(/No earnings history/)).toBeNull());
}

const progressRequests = () =>
  requests.filter(r => r.path.endsWith('/reward-progress'));

// The fixture reward is stamped 2026-09-25 12:00Z and the page shows the last 7 days by default
// (StationReportPage filterByRange: now - timestamp <= 7 days). Against the real clock every
// internal-build case went RED after 2026-10-02 12:00Z. The page reads the clock only through
// Date.now(), so exactly that is pinned to the fixture's asOf: timers, animation frames, Intl and the
// Date constructor stay native. Test-only: no product code depends on this.
const FIXTURE_NOW = new Date('2026-09-26T12:00:00.000Z');
const LAST_DAY_IN_WINDOW = new Date('2026-10-02T12:00:00.000Z');
const NATIVE = {
  requestAnimationFrame: globalThis.requestAnimationFrame,
  cancelAnimationFrame: globalThis.cancelAnimationFrame,
  Intl: globalThis.Intl,
  setTimeout: globalThis.setTimeout,
  Date: globalThis.Date,
};
let nowMs = FIXTURE_NOW.getTime();
let dateNow: { mockRestore: () => void } | undefined;

beforeEach(() => {
  nowMs = FIXTURE_NOW.getTime();
  dateNow = jest.spyOn(Date, 'now').mockImplementation(() => nowMs);
  localStorage.clear();
  clearAuthToken();
});

afterEach(() => {
  dateNow?.mockRestore();
  cleanup();
  walletAuthService.clearSession();
  clearAuthToken();
  featureFlags.publicReadonly = false;
  featureFlags.fullStudio = true;
});

describe('FirstEarnCelebration on the station page', () => {
  describe('Stage 1.5 public read-only build (publicReadonly on, fullStudio off)', () => {
    beforeEach(() => {
      featureFlags.publicReadonly = true;
      featureFlags.fullStudio = false;
    });

    it('anonymous viewer: no celebration and no ownership request', async () => {
      installBackend({ owner: OWNER });
      await renderStation();
      expect(screen.queryByText(CELEBRATION)).toBeNull();
      expect(progressRequests()).toHaveLength(0);
    });

    it('even the owner signed in: no celebration and no ownership request', async () => {
      setAuthToken(jwtFor(OWNER));
      installBackend({ owner: OWNER });
      await renderStation();
      expect(screen.queryByText(CELEBRATION)).toBeNull();
      expect(progressRequests()).toHaveLength(0);
    });
  });

  describe('internal build', () => {
    it('anonymous viewer: no celebration and no ownership request', async () => {
      installBackend({ owner: OWNER });
      await renderStation();
      expect(screen.queryByText(CELEBRATION)).toBeNull();
      expect(progressRequests()).toHaveLength(0);
    });

    it('authenticated non-owner: backend 404s the ownership read, no celebration', async () => {
      setAuthToken(jwtFor(STRANGER));
      installBackend({ owner: OWNER });
      await renderStation();
      await waitFor(() => expect(progressRequests()).toHaveLength(1));
      expect(progressRequests()[0].auth).toBe(`Bearer ${jwtFor(STRANGER)}`);
      // Let the 404 settle before asserting absence.
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(screen.queryByText(CELEBRATION)).toBeNull();
    });

    it('a projection naming a different owner than the token is not trusted', async () => {
      setAuthToken(jwtFor(OWNER));
      installBackend({ owner: OWNER, progressOwnerOverride: STRANGER });
      await renderStation();
      await waitFor(() => expect(progressRequests()).toHaveLength(1));
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(screen.queryByText(CELEBRATION)).toBeNull();
    });

    it('owner: celebration shown with the first reward', async () => {
      setAuthToken(jwtFor(OWNER));
      installBackend({ owner: OWNER });
      await renderStation();
      expect(await screen.findByText(CELEBRATION)).not.toBeNull();
      expect(screen.getByText(/received its first verified reward/).textContent).toContain('Hilltop station');
    });
  });

  // Codex round 6 on #389: ownership is bound to the live session. The page
  // stays mounted while the session changes underneath it.
  describe('session changes while the page stays mounted', () => {
    async function ownerCelebrating() {
      installBackend({ owner: OWNER });
      await renderStation();
      expect(await screen.findByText(CELEBRATION)).not.toBeNull();
    }

    it('logout (clearWalletAuthSession): the dialog is gone at once', async () => {
      setAuthToken(jwtFor(OWNER));
      await ownerCelebrating();
      await act(async () => {
        clearWalletAuthSession();
      });
      expect(screen.queryByText(CELEBRATION)).toBeNull();
      expect(screen.queryByText('Share my card')).toBeNull();
    });

    it('automatic refresh failure clears the session and the dialog', async () => {
      // A real walletAuthService session whose scheduled refresh (1 s floor)
      // is rejected by the backend, the path at walletAuthService.ts:127.
      (walletAuthService as unknown as {
        storeTokenResponse: (a: string, r: object) => unknown;
      }).storeTokenResponse(OWNER, { jwt: jwtFor(OWNER), refreshToken: 'refresh-1', expiresIn: 1 });
      await ownerCelebrating();
      await waitFor(
        () => expect(requests.some(r => r.path === '/api/auth/refresh')).toBe(true),
        { timeout: 3000 },
      );
      await waitFor(() => expect(getAuthToken()).toBe(''));
      await waitFor(() => expect(screen.queryByText(CELEBRATION)).toBeNull());
    });

    it('account switch to a non-owner: gone, and the new account is probed', async () => {
      setAuthToken(jwtFor(OWNER));
      await ownerCelebrating();
      await act(async () => {
        setAuthToken(jwtFor(STRANGER));
      });
      // Gone before the new account's probe answers: the owner answer belongs
      // to the old subject.
      expect(screen.queryByText(CELEBRATION)).toBeNull();
      await waitFor(() =>
        expect(progressRequests().map(r => r.auth)).toContain(`Bearer ${jwtFor(STRANGER)}`),
      );
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(screen.queryByText(CELEBRATION)).toBeNull();
    });

    it('a token refresh for the same owner keeps the dialog', async () => {
      setAuthToken(jwtFor(OWNER));
      await ownerCelebrating();
      await act(async () => {
        setAuthToken(`${jwtFor(OWNER)}-refreshed`);
      });
      expect(screen.queryByText(CELEBRATION)).not.toBeNull();
    });
  });

  describe('fixture clock boundary (why the clock is pinned)', () => {
    it('only Date.now is pinned: animation frames, timers, Intl and the Date constructor stay native', async () => {
      expect(Date.now()).toBe(FIXTURE_NOW.getTime());
      expect(globalThis.requestAnimationFrame).toBe(NATIVE.requestAnimationFrame);
      expect(globalThis.cancelAnimationFrame).toBe(NATIVE.cancelAnimationFrame);
      expect(globalThis.Intl).toBe(NATIVE.Intl);
      expect(globalThis.setTimeout).toBe(NATIVE.setTimeout);
      expect(globalThis.Date).toBe(NATIVE.Date);
      expect(Math.abs(new Date().getTime() - FIXTURE_NOW.getTime())).toBeGreaterThan(24 * 60 * 60 * 1000);
      // An animation frame runs on its own, with no clock advanced by the test.
      const ran = await new Promise<boolean>((done) => {
        const timer = setTimeout(() => done(false), 1000);
        requestAnimationFrame(() => { clearTimeout(timer); done(true); });
      });
      expect(ran).toBe(true);
    });

    it('at exactly 7 days after the fixture reward it is still in the default window', async () => {
      nowMs = LAST_DAY_IN_WINDOW.getTime();
      installBackend({ owner: OWNER });
      await renderStation(); // waits until the earnings history has rendered
      expect(screen.queryByText(/No earnings history/)).toBeNull();
    });

    it('one millisecond later the reward has left the window: the page says it has no history', async () => {
      nowMs = LAST_DAY_IN_WINDOW.getTime() + 1;
      installBackend({ owner: OWNER });
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      render(
        React.createElement(
          QueryClientProvider,
          { client },
          React.createElement(
            MemoryRouter,
            { initialEntries: ['/weather/station/station-1'] },
            React.createElement(
              Suspense,
              { fallback: null },
              React.createElement(
                Routes,
                null,
                React.createElement(Route, { path: '/weather/station/:stationId', element: React.createElement(StationReportPage) }),
              ),
            ),
          ),
        ),
      );
      // The empty-history alert is also shown while the earnings query has no data yet, so wait until the
      // fixture reward has arrived in the query cache and nothing is fetching before looking at the page.
      await screen.findByText('Hilltop station');
      await waitFor(() => {
        const earnings = client.getQueryCache().findAll().filter(q => JSON.stringify(q.state.data ?? null).includes('ee'.repeat(32)));
        expect(earnings.length).toBeGreaterThan(0);
        expect(earnings.every(q => q.state.status === 'success')).toBe(true);
        expect(client.isFetching()).toBe(0);
      });
      await act(async () => {}); // let React render what the settled cache holds
      expect(screen.getByText(/No earnings history is available/)).not.toBeNull();
    });
  });
});
