/** @jest-environment jsdom */
import { describe, it, expect, afterEach, jest } from '@jest/globals';
import {
  fetchPermissionlessHealth,
  fetchTransparencyLedger,
} from '../../services/resilienceService';

describe('resilienceService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('parses permissionless health envelope payload', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          generatedAt: new Date().toISOString(),
          participation: {
            status: 'pass',
            geoblockingViolations: 0,
            totalEvents: 10,
            throttleEvents: 1,
            denyEvents: 0,
            actorNeutrality: 'verified',
            privacySafeTelemetry: true,
            notes: [],
            checkedAt: new Date().toISOString(),
          },
          relay: {
            status: 'healthy',
            globalAvailabilityPercent: 99.1,
            censorshipSignalCount: 0,
            checkedAt: new Date().toISOString(),
            routes: [],
          },
          guidance: ['retry via alternate relay'],
        },
      }),
    });

    const payload = await fetchPermissionlessHealth();
    expect(payload.participation.status).toBe('pass');
    expect(payload.relay.status).toBe('healthy');
  });

  it('parses transparency ledger payload', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          generatedAt: new Date().toISOString(),
          privacySafe: true,
          sanctions: { total: 4, disclosed: 2 },
          appeals: { total: 3, cleared: 1 },
          parity: { human: 1, aiAgent: 1, robot: 1, unknown: 1 },
          dataFreshnessSeconds: 30,
        },
      }),
    });

    const payload = await fetchTransparencyLedger();
    expect(payload.privacySafe).toBe(true);
    expect(payload.sanctions.total).toBe(4);
    expect(payload.parity.aiAgent).toBe(1);
  });
});
