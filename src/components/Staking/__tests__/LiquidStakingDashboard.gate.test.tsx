import React from 'react';
import { jest } from '@jest/globals';
import { act, cleanup, render, screen } from '@testing-library/react';

let capability: string | undefined = 'unavailable';
let loading = false;
let error: Error | null = null;
await jest.unstable_mockModule('../../../contexts/CapabilitiesContext', () => ({
  useCapabilitiesContext: () => ({
    capabilities: { features: capability ? { liquidStaking: { status: capability } } : {} },
    loading, error,
  }),
}));
await jest.unstable_mockModule('../../../hooks/usePreflightChecks', () => ({ usePreflightChecks: () => [] }));
await jest.unstable_mockModule('../../DesignSystem', () => ({ WrfPreflightSimulation: () => null }));
await jest.unstable_mockModule('react-chartjs-2', () => ({ Line: () => null }));
const { default: Dashboard } = await import('../LiquidStakingDashboard');
const originalFetch = global.fetch;
beforeEach(() => {
  capability = 'unavailable'; loading = false; error = null;
  global.fetch = jest.fn<typeof fetch>().mockImplementation(async () => ({
    ok: true, json: async () => ({}),
  } as Response));
});
afterEach(() => { cleanup(); global.fetch = originalFetch; });

it.each(['unavailable', 'configured', 'reachable', 'simulated', 'unknown', undefined])(
  'refuses %s capability without reads or staking controls', async status => {
    capability = status;
    await act(async () => { render(<Dashboard />); });
    expect(screen.getByText('Not live on the testnet yet')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Stake' })).not.toBeInTheDocument();
  },
);
it.each(['loading', 'error'])('refuses cached operational data while %s', async state => {
  capability = 'operational'; loading = state === 'loading';
  error = state === 'error' ? new Error('offline') : null;
  await act(async () => { render(<Dashboard />); });
  expect(screen.getByText('Not live on the testnet yet')).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});
it.each(['operational', 'degraded'])('allows all three reads when %s (positive control)', async status => {
  capability = status;
  await act(async () => { render(<Dashboard />); });
  expect(global.fetch).toHaveBeenCalledTimes(3);
  expect((global.fetch as jest.Mock).mock.calls.map(call => call[0])).toEqual([
    '/api/staking/liquid/protocol', '/api/staking/liquid/user', '/api/staking/liquid/withdrawals',
  ]);
  expect(screen.queryByText('Not live on the testnet yet')).not.toBeInTheDocument();
});
it('mounts the body only after capabilities arrive and removes it after a failed poll', async () => {
  loading = true;
  const view = render(<Dashboard />);
  expect(global.fetch).not.toHaveBeenCalled();
  capability = 'operational'; loading = false;
  await act(async () => { view.rerender(<Dashboard />); });
  expect(global.fetch).toHaveBeenCalledTimes(3);
  error = new Error('offline');
  await act(async () => { view.rerender(<Dashboard />); });
  expect(screen.getByText('Not live on the testnet yet')).toBeInTheDocument();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(3);
});
