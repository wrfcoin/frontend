/** @jest-environment jsdom */
import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import { useStateSyncStatus } from '../../hooks/useStateSyncStatus';
import { useP2PSyncStatus } from '../../hooks/useP2PSyncStatus';

describe('Network Sync Hooks', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('maps operational state-sync API response for UI consumption', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          readiness: 'operational',
          healthScore: 96,
          healthSummary: 'State-sync orchestration is healthy',
          failureCauses: [],
          snapshotHeight: 148600,
          proof: { status: 'verified' },
          replay: { status: 'enforced' },
          replayNonce: 42,
          recentSyncOps: [],
          stateRootHex: '0xabc',
          snapshotRootHex: '0xdef',
          entryCount: 1200,
          remediationActions: [],
          canOperate: true,
        },
      }),
    });

    const { result } = renderHook(() => useStateSyncStatus());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.readiness).toBe('operational');
    expect(result.current.proofStatus).toBe('verified');
    expect(result.current.replayStatus).toBe('enforced');
    expect(result.current.snapshotHeight).toBe(148600);
    expect(result.current.error).toBeNull();
  });

  it('surfaces unavailable fallback state when state-sync backend is down', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('connect ECONNREFUSED'));

    const { result } = renderHook(() => useStateSyncStatus());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.readiness).toBe('unavailable');
    expect(result.current.proofStatus).toBe('failed');
    expect(result.current.error).toMatch(/ECONNREFUSED/i);
  });

  it('maps degraded p2p orchestration state and runs guarded action flow', async () => {
    global.fetch = jest
      .fn()
      // initial status fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            readiness: 'degraded',
            healthScore: 68,
            healthSummary: 'Degraded due to failed sync jobs',
            failureCauses: [
              {
                code: 'peer_stalled',
                message: 'Peer stalled beyond timeout',
                remediation: 'Resume after trust review',
                since: new Date().toISOString(),
                severity: 'warning',
              },
            ],
            proof: { status: 'pending' },
            replay: {
              status: 'at_risk',
              nonceWindowSize: 256,
              rejectedCount: 0,
            },
            peers: [],
            syncJobs: [],
            antiAbuse: {
              rateLimitedPeers: 1,
              blacklistedPeers: ['peer-x'],
              totalRequestsBlocked: 4,
              windowStart: new Date().toISOString(),
            },
            remediationActions: [],
            canOperate: true,
          },
        }),
      })
      // action post
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Sync action trigger_sync applied' }),
      })
      // refresh after action
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            readiness: 'operational',
            healthScore: 92,
            healthSummary: 'Recovered',
            failureCauses: [],
            proof: { status: 'verified' },
            replay: {
              status: 'enforced',
              nonceWindowSize: 256,
              rejectedCount: 0,
            },
            peers: [],
            syncJobs: [],
            antiAbuse: {
              rateLimitedPeers: 0,
              blacklistedPeers: [],
              totalRequestsBlocked: 4,
              windowStart: new Date().toISOString(),
            },
            remediationActions: [],
            canOperate: true,
          },
        }),
      });

    const { result } = renderHook(() => useP2PSyncStatus());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.readiness).toBe('degraded');
    expect(result.current.proof.status).toBe('pending');
    expect(result.current.replay.status).toBe('at_risk');

    await act(async () => {
      const ok = await result.current.runAction('trigger_sync', {
        reason: 'Operator-triggered guarded sync',
      });
      expect(ok).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.actionMessage).toMatch(/trigger_sync applied/i);
      expect(result.current.readiness).toBe('operational');
    });

    const actionCall = global.fetch.mock.calls.find(
      ([, options]) => options?.method === 'POST',
    );
    expect(actionCall?.[1]?.headers).toEqual({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });
  });

  it('does not trust localStorage operator authority headers for state-sync remediation', async () => {
    localStorage.setItem('wrf.syncRole', 'operator');
    localStorage.setItem('wrf.operatorId', 'local-operator');
    localStorage.setItem('wrf.syncProofToken', 'local-proof-token');

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            readiness: 'operational',
            healthScore: 96,
            healthSummary: 'State-sync orchestration is healthy',
            failureCauses: [],
            snapshotHeight: 148600,
            proof: { status: 'verified' },
            replay: { status: 'enforced' },
            replayNonce: 42,
            recentSyncOps: [],
            stateRootHex: '0xabc',
            snapshotRootHex: '0xdef',
            entryCount: 1200,
            remediationActions: [],
            canOperate: true,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Remediation action pause_all applied' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            readiness: 'operational',
            healthScore: 96,
            healthSummary: 'State-sync orchestration is healthy',
            failureCauses: [],
            snapshotHeight: 148600,
            proof: { status: 'verified' },
            replay: { status: 'enforced' },
            replayNonce: 43,
            recentSyncOps: [],
            stateRootHex: '0xabc',
            snapshotRootHex: '0xdef',
            entryCount: 1200,
            remediationActions: [],
            canOperate: true,
          },
        }),
      });

    const { result } = renderHook(() => useStateSyncStatus());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      const ok = await result.current.runRemediation('pause_all', {
        reason: 'Operator-requested pause',
      });
      expect(ok).toBe(true);
    });

    const actionCall = global.fetch.mock.calls.find(
      ([, options]) => options?.method === 'POST',
    );
    expect(actionCall?.[1]?.headers).toEqual({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });
  });

  // frontend#372: this case predated #332, which deliberately stopped the hook
  // inventing a fallback state on a backend outage. Since #332 the contract
  // (pinned by src/hooks/__tests__/useP2PSyncStatus.unavailable.test.tsx) is:
  // readiness 'unavailable', the real error in `error` and `healthSummary`,
  // and NO failure causes, peers, jobs or score. failureCauses carries only
  // causes the orchestration API itself reports.
  it('returns unavailable fallback in p2p hook when backend is down', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network offline'));

    const { result } = renderHook(() => useP2PSyncStatus());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.readiness).toBe('unavailable');
    expect(result.current.error).toMatch(/network offline/i);
    expect(result.current.healthSummary).toMatch(/network offline/i);
    expect(result.current.failureCauses).toEqual([]);
    expect(result.current.peers).toEqual([]);
    expect(result.current.syncJobs).toEqual([]);
    expect(result.current.healthScore).toBe(0);
    expect(result.current.canOperate).toBe(false);
  });
});
