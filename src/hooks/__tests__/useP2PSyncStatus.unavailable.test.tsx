/** @jest-environment jsdom */
//
// frontend#329 — on a failed read the hook used to substitute generateMockData():
// invented peers, sync jobs, a healthScore of 22 and the sentence "Displaying
// last-known safe fallback telemetry." Now it says the API is unavailable and
// shows nothing in its place.
import { jest } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';

jest.unstable_mockModule('../syncRuntimeConfig', () => ({
  resolveSyncApiBaseUrl: () => '',
}));

const { useP2PSyncStatus } = await import('../useP2PSyncStatus');

describe('useP2PSyncStatus when the orchestration API cannot be read', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => Promise.reject(new Error('ECONNREFUSED'))) as unknown as typeof fetch;
  });

  it('reports unavailable with empty telemetry, never a fallback score', async () => {
    const { result } = renderHook(() => useP2PSyncStatus());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toMatch(/ECONNREFUSED/);
    expect(result.current.readiness).toBe('unavailable');
    expect(result.current.healthScore).toBe(0);
    expect(result.current.healthSummary).toMatch(/unavailable/);
    expect(result.current.healthSummary).not.toMatch(/last-known|fallback telemetry/);
    expect(result.current.peers).toEqual([]);
    expect(result.current.syncJobs).toEqual([]);
    expect(result.current.failureCauses).toEqual([]);
    expect(result.current.canOperate).toBe(false);
  });
});
