/** @jest-environment jsdom */
/**
 * backend#1456 / frontend: the leaderboard hook asks for the chain-backed `earnings` metric by default,
 * never sends geo filters with it, and never exposes a partial list when the backend says unavailable.
 */
import { jest } from '@jest/globals';
import { renderHook, waitFor, act } from '@testing-library/react';

jest.unstable_mockModule('../../services/authTokenStore', () => ({ getAuthToken: () => null }));
const { useWeatherLeaderboard } = await import('../useWeatherLeaderboard');

const reply = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const row = (over) => ({ rank: 1, displayName: 'A', value: 15.24, earningsBaseUnits: '1524000000', earningsWrf: '15.24', ...over });

beforeEach(() => { global.fetch = jest.fn(); });

test('defaults to metric=earnings and does not send region/country/near with it', async () => {
  global.fetch.mockResolvedValue(reply(200, { entries: [row()], amountUnits: { available: true } }));
  const { result } = renderHook(() => useWeatherLeaderboard({ region: 'Europe', country: 'us', near: { lat: 1, lng: 2 }, radiusKm: 5 }));
  await waitFor(() => expect(result.current.entries).toHaveLength(1));
  const url = global.fetch.mock.calls[0][0];
  expect(url).toContain('metric=earnings');
  expect(url).not.toMatch(/region=|country=|near=|radius_km=/);
  expect(result.current.unavailable).toBe(false);
});

test('submissions still sends its geo filters', async () => {
  global.fetch.mockResolvedValue(reply(200, { entries: [] }));
  renderHook(() => useWeatherLeaderboard({ metric: 'submissions', region: 'Europe' }));
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  expect(global.fetch.mock.calls[0][0]).toMatch(/metric=submissions.*region=Europe/);
});

test('HTTP 503 with unavailable:[earnings] is unavailable with no entries, not an error string or a list', async () => {
  global.fetch.mockResolvedValue(reply(503, { success: false, unavailable: ['earnings'], entries: [row()] }));
  const { result } = renderHook(() => useWeatherLeaderboard());
  await waitFor(() => expect(result.current.unavailable).toBe(true));
  expect(result.current.entries).toEqual([]);
});

test('a 200 that reports unavailable or carries an unproven amount is unavailable, never partial', async () => {
  global.fetch.mockResolvedValueOnce(reply(200, { unavailable: ['earnings'], entries: [row()] }));
  const a = renderHook(() => useWeatherLeaderboard());
  await waitFor(() => expect(a.result.current.unavailable).toBe(true));
  expect(a.result.current.entries).toEqual([]);

  global.fetch.mockResolvedValueOnce(reply(200, { entries: [row(), row({ rank: 2, earningsBaseUnits: null, earningsWrf: null })] }));
  const b = renderHook(() => useWeatherLeaderboard());
  await waitFor(() => expect(b.result.current.unavailable).toBe(true));
  expect(b.result.current.entries).toEqual([]);
});

test('refetch after unavailable recovers', async () => {
  global.fetch.mockResolvedValueOnce(reply(503, { unavailable: ['earnings'] }));
  const { result } = renderHook(() => useWeatherLeaderboard());
  await waitFor(() => expect(result.current.unavailable).toBe(true));
  global.fetch.mockResolvedValueOnce(reply(200, { entries: [row()] }));
  await act(async () => { await result.current.refetch(); });
  expect(result.current.unavailable).toBe(false);
  expect(result.current.entries).toHaveLength(1);
});

describe('any failed earnings read is unavailable with no rows (never stale, never a false empty)', () => {
  const stale = [{ rank: 1, displayName: 'Old', value: 3, earningsBaseUnits: null }];

  test.each([
    ['HTTP 500', () => global.fetch.mockResolvedValueOnce(reply(500, {}))],
    ['HTTP 400', () => global.fetch.mockResolvedValueOnce(reply(400, {}))],
    ['network error', () => global.fetch.mockRejectedValueOnce(new Error('network down'))],
  ])('%s clears the previous rows and is unavailable', async (_name, arrange) => {
    global.fetch.mockResolvedValueOnce(reply(200, { entries: stale }));
    const { result, rerender } = renderHook(({ metric }) => useWeatherLeaderboard({ metric }), { initialProps: { metric: 'submissions' } });
    await waitFor(() => expect(result.current.entries).toHaveLength(1));
    arrange();
    rerender({ metric: 'earnings' });
    await waitFor(() => expect(result.current.unavailable).toBe(true));
    expect(result.current.entries).toEqual([]);
  });
});
