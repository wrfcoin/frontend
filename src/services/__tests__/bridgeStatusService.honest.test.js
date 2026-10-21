/** @jest-environment jsdom */
//
// frontend#329 — bridgeStatusService.getBridgeStatus() used to fall back to
// generateMockStatus(): 13 named bridges with 99.8% uptime, fees and
// liquidity that no feed ever reported.
import { jest } from '@jest/globals';

jest.unstable_mockModule('../websocketService', () => ({
  getWebSocketClient: () => ({
    status: 'disconnected',
    connect: () => {},
    on: () => () => {},
    send: () => {},
  }),
}));

const { default: bridgeStatusService } = await import('../bridgeStatusService');

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.reject(new Error('no /api/bridge/fee-estimate on the testnet')));
});

describe('bridgeStatusService without a real feed (frontend#329)', () => {
  it('reports null for a bridge nothing has reported, and for every bridge in the list', () => {
    expect(bridgeStatusService.getBridgeStatus('axelar')).toBeNull();
    const all = bridgeStatusService.getAllBridgeStatuses();
    expect(Object.keys(all).length).toBeGreaterThan(0);
    expect(Object.values(all).every(v => v === null)).toBe(true);
  });

  it('scores an unknown bridge 0 instead of scoring invented uptime and fees', () => {
    const routes = bridgeStatusService.calculateOptimalRoute([{ bridge: 'wormhole' }, { bridge: 'axelar' }]);
    expect(routes.map(r => r.score)).toEqual([0, 0]);
  });

  it('returns null from getFeeEstimate when the API and the status are both absent', async () => {
    await expect(bridgeStatusService.getFeeEstimate('axelar', '10', 'ethereum', 'polygon')).resolves.toBeNull();
  });

  it('still surfaces a status the feed really delivered', () => {
    bridgeStatusService.handleStatusUpdate({
      type: 'bridge_status',
      bridgeId: 'axelar',
      status: { status: 'active', uptime: 97.5, avgTransactionTime: '4 min', currentFee: '0.01%', gasEstimate: '$3.00' },
    });
    expect(bridgeStatusService.getBridgeStatus('axelar')).toMatchObject({ uptime: 97.5 });
    expect(bridgeStatusService.calculateOptimalRoute([{ bridge: 'axelar' }])[0].score).toBeGreaterThan(0);
  });
});
