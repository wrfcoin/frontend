/** @jest-environment jsdom */
/**
 * The rules of the owner-only 30-day comparison read: who makes the request at all, and what a
 * refusal turns into. Real hook, real service and API client; only fetch is faked.
 */
import React from 'react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const { useStationCompareHistory } = await import('../useStationCompareHistory');
const { setAuthToken, clearAuthToken } = await import('../../../services/authTokenStore');

const STATION = 'st_0123456789ab';
const OWNER = '0x1111111111111111111111111111111111111111';

function jwtFor(sub: string): string {
  const b64 = (value: object) => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub })}.signature`;
}

const OK_BODY = {
  status: 'ok', days: 30, from: 1_788_000_000, to: 1_790_000_000,
  reference: { kind: 'nws', stationIdentifier: 'KAAA' },
  variables: [{ variable: 'temperature_c', pairs: 100, usualDifference: 2, typicalGap: 2, closePercent: 40, closeWithin: 1.5 }],
  note: 'For your information only.', source: 'core4+nws',
};

let requests: Array<{ path: string; auth: string | null }> = [];
function answer(status: number, body: unknown) {
  requests = [];
  global.fetch = jest.fn(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    requests.push({ path: new URL(String(input), 'https://test.invalid').pathname, auth: new Headers(init?.headers).get('authorization') });
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  }) as unknown as typeof fetch;
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
const settle = () => new Promise(resolve => { setTimeout(resolve, 30); });

beforeEach(() => { clearAuthToken(); });
afterEach(() => { cleanup(); clearAuthToken(); });

describe('useStationCompareHistory', () => {
  it('no wallet session: no request, nothing shown, even if the page says owner', async () => {
    answer(200, OK_BODY);
    const { result } = renderHook(() => useStationCompareHistory(STATION, true), { wrapper });
    await settle();
    expect(requests).toHaveLength(0);
    expect(result.current).toBeNull();
  });

  it('a signed-in wallet that does not own the station: no request', async () => {
    setAuthToken(jwtFor(OWNER));
    answer(200, OK_BODY);
    const { result } = renderHook(() => useStationCompareHistory(STATION, false), { wrapper });
    await settle();
    expect(requests).toHaveLength(0);
    expect(result.current).toBeNull();
  });

  it('the owner: one request with the session token, and the summary', async () => {
    setAuthToken(jwtFor(OWNER));
    answer(200, OK_BODY);
    const { result } = renderHook(() => useStationCompareHistory(STATION, true), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(requests).toHaveLength(1);
    expect(requests[0].path).toBe(`/api/stations/${STATION}/compare/history`);
    expect(requests[0].auth).toMatch(/^Bearer /);
    expect(result.current).toMatchObject({ status: 'ok', referenceStation: 'KAAA' });
  });

  it.each([401, 403, 404, 429, 503])('a %i answer shows nothing and is not retried', async (status) => {
    setAuthToken(jwtFor(OWNER));
    answer(status, { error: { code: 'X', message: 'x' } });
    const { result } = renderHook(() => useStationCompareHistory(STATION, true), { wrapper });
    await waitFor(() => expect(requests).toHaveLength(1));
    // Long enough for the shared API client's first repeat (it waits before repeating a GET) to have shown up.
    await new Promise(resolve => { setTimeout(resolve, 1500); });
    expect(requests).toHaveLength(1);
    expect(result.current).toBeNull();
  });

  it('an unreadable 200 shows nothing', async () => {
    setAuthToken(jwtFor(OWNER));
    answer(200, { status: 'ok', variables: 'none' });
    const { result } = renderHook(() => useStationCompareHistory(STATION, true), { wrapper });
    await waitFor(() => expect(requests).toHaveLength(1));
    await settle();
    expect(result.current).toBeNull();
  });

  it('logging out removes the summary at once', async () => {
    setAuthToken(jwtFor(OWNER));
    answer(200, OK_BODY);
    const { result } = renderHook(() => useStationCompareHistory(STATION, true), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());
    clearAuthToken();
    await waitFor(() => expect(result.current).toBeNull());
  });
});
