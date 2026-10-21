/** @jest-environment jsdom */
//
// frontend#329 — MiningContext used to start a Math.random() simulator
// (hashrate, CPU/GPU load and temperatures) three seconds after the mining
// WebSocket failed. It now reads the real GET /api/mining/node-stats and marks
// hardware telemetry unavailable until a WebSocket really reports it.
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGet = jest.fn();
jest.unstable_mockModule('../../services/apiClient', () => ({
  apiClient: { get: mockGet },
}));
jest.unstable_mockModule('../../utils/wsUrl.js', () => ({ resolveWsUrl: (u) => u }));

const { MiningProvider, useMining } = await import('../MiningContext');

function Probe() {
  const { state } = useMining();
  return (
    <div>
      <span data-testid="load-state">{state.node.loadState}</span>
      <span data-testid="height">{state.node.stats?.block_height ?? 'none'}</span>
      <span data-testid="telemetry">{String(state.performance.telemetryAvailable)}</span>
      <span data-testid="hashrate">{state.statistics.hashrate.current}</span>
    </div>
  );
}

beforeEach(() => {
  mockGet.mockReset();
  // No mining WebSocket under jsdom: the constructor throws, which is the
  // exact path that used to start the simulator.
  global.WebSocket = class { constructor() { throw new Error('no ws'); } };
});

describe('MiningContext (frontend#329)', () => {
  it('loads real node statistics from /api/mining/node-stats and never simulates hardware', async () => {
    mockGet.mockResolvedValue({ success: true, data: { block_height: 4321, sync_status: 'synced', difficulty: 7 } });

    render(<MiningProvider><Probe /></MiningProvider>);

    await waitFor(() => expect(screen.getByTestId('load-state')).toHaveTextContent('loaded'));
    expect(mockGet).toHaveBeenCalledWith('/mining/node-stats');
    expect(screen.getByTestId('height')).toHaveTextContent('4321');
    expect(screen.getByTestId('telemetry')).toHaveTextContent('false');
    expect(screen.getByTestId('hashrate')).toHaveTextContent('0');
  });

  it('reports the node statistics as unavailable when the route cannot be read', async () => {
    mockGet.mockRejectedValue(new Error('core4 down'));

    render(<MiningProvider><Probe /></MiningProvider>);

    await waitFor(() => expect(screen.getByTestId('load-state')).toHaveTextContent('unavailable'));
    expect(screen.getByTestId('height')).toHaveTextContent('none');
  });
});
