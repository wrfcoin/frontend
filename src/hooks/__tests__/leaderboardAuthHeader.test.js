/** @jest-environment jsdom */
/**
 * backend#1361: a signed-in wallet lets the server mark its OWN leaderboard row (`isYou`) and own
 * profile key, so the leaderboard and operator-profile fetches send the in-memory auth token when
 * there is one, and send nothing extra when there is not.
 */
import { jest } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';

const { setAuthToken, clearAuthToken } = await import('../../services/authTokenStore');
const { useWeatherLeaderboard } = await import('../useWeatherLeaderboard');
const { useOperatorProfile } = await import('../useOperatorProfile');

const okJson = (body) => ({ ok: true, status: 200, json: async () => body });

beforeEach(() => {
  global.fetch = jest.fn(async (url) => (String(url).includes('/leaderboard') ? okJson({ entries: [] }) : okJson({ profile: { walletAddress: '0xa1a1…a1a1' } })));
});
afterEach(() => clearAuthToken());

describe('optional wallet token on the two public reads', () => {
  test('leaderboard: no token means no Authorization header', async () => {
    renderHook(() => useWeatherLeaderboard({ metric: 'submissions', period: '7d' }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [, init] = global.fetch.mock.calls[0];
    expect(init?.headers?.Authorization).toBeUndefined();
  });

  test('leaderboard: a token is sent as a bearer header to the same-origin route', async () => {
    setAuthToken('wallet-access-token');
    renderHook(() => useWeatherLeaderboard({ metric: 'submissions', period: '7d' }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [url, init] = global.fetch.mock.calls[0];
    expect(String(url)).toMatch(/^\/api\/weather\/leaderboard\?/);
    expect(init.headers.Authorization).toBe('Bearer wallet-access-token');
  });

  test('operator profile: the token is sent when present and omitted when not', async () => {
    renderHook(() => useOperatorProfile('c_0123456789abcdef01234567'));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch.mock.calls[0][1].headers).toBeUndefined();

    global.fetch.mockClear();
    setAuthToken('wallet-access-token');
    renderHook(() => useOperatorProfile('c_89abcdef0123456789abcdef'));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer wallet-access-token');
  });
});
