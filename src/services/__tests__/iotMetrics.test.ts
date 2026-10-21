/**
 * Tests for sensorAPI.getMetrics() — IoTMetrics type alignment with the
 * backend /api/iot/metrics response shape.
 *
 * Issue #144: the backend returns a { success, metrics: { snake_case } }
 * envelope; this verifies that getMetrics() correctly maps each field to the
 * camelCase IoTMetrics interface consumed by the UI.
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// Must mock axios BEFORE importing api.ts — jest.unstable_mockModule is the
// ESM-safe equivalent of jest.mock() hoisting.
const mockGet = jest.fn<(url: string) => Promise<{ data: unknown }>>();

await jest.unstable_mockModule('axios', () => ({
  default: {
    create: jest.fn(() => ({
      get: mockGet,
      post: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    })),
  },
}));

const { sensorAPI } = await import('../api.js');

// ─────────────────────────────────────────────────────────────────────────────

describe('sensorAPI.getMetrics — IoTMetrics field mapping', () => {
  beforeEach(() => {
    mockGet.mockClear();
  });

  it('maps backend snake_case fields to camelCase IoTMetrics', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        success: true,
        metrics: {
          total_networks: 4,
          active_networks: 3,
          total_devices: 127,
          global_coverage: true,
          network_uptime: '99.7%',
          avg_latency: '42ms',
        },
      },
    });

    const result = await sensorAPI.getMetrics();

    expect(result).toEqual({
      totalNetworks: 4,
      activeNetworks: 3,
      totalDevices: 127,
      globalCoverage: true,
      networkUptime: '99.7%',
      avgLatency: '42ms',
    });
  });

  it('does not include deprecated dataPointsToday, healthScore, or coverage fields', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        success: true,
        metrics: {
          total_networks: 1,
          active_networks: 1,
          total_devices: 5,
          global_coverage: false,
          network_uptime: '100%',
          avg_latency: '5ms',
        },
      },
    });

    const result = await sensorAPI.getMetrics();

    expect(result).not.toHaveProperty('dataPointsToday');
    expect(result).not.toHaveProperty('healthScore');
    expect(result).not.toHaveProperty('coverage');
  });

  it('passes the /iot/metrics path to the HTTP client', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        success: true,
        metrics: {
          total_networks: 0,
          active_networks: 0,
          total_devices: 0,
          global_coverage: false,
          network_uptime: '0%',
          avg_latency: 'N/A',
        },
      },
    });

    await sensorAPI.getMetrics();

    expect(mockGet).toHaveBeenCalledWith('/iot/metrics');
  });
});
