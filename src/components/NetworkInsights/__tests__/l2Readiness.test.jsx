import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';

const flags = { demoSurfaces: false };
let response;
const get = jest.fn(async () => []);
await jest.unstable_mockModule('../../../config/features', () => ({ FEATURES: flags, default: flags }));
await jest.unstable_mockModule('../../../hooks/useCapabilities', () => ({ useCapabilities: () => response }));
await jest.unstable_mockModule('../../../services/apiClient', () => ({ apiClient: { get } }));
await jest.unstable_mockModule('../../DesignSystem', () => ({ WrfCapabilityReadinessBadge: () => null }));
await jest.unstable_mockModule('react-chartjs-2', () => ({ Doughnut: () => null }));
const NetworkTopologyMap = (await import('../NetworkTopologyView')).default;
beforeEach(() => {
  flags.demoSurfaces = false;
  response = { loading: false, error: null, capabilities: { features: {
    l2Prover: { status: 'operational' }, l2Verifier: { status: 'degraded' }, l1Finality: { status: 'unavailable' },
  } } };
  get.mockClear();
  global.ResizeObserver = class { observe() {} disconnect() {} };
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});
afterEach(() => { cleanup(); jest.restoreAllMocks(); });
it('shows reported readiness with samples off, without mounting a topology or requesting nodes', () => {
  const { container } = render(<NetworkTopologyMap />);
  expect(screen.getByText('L2 Prover: operational')).toBeTruthy();
  expect(screen.getByText('L2 Verifier: degraded')).toBeTruthy();
  expect(screen.getByText('L1 Finality: unavailable')).toBeTruthy();
  expect(screen.getByTestId('network-topology-not-live')).toBeTruthy();
  expect(container.querySelector('canvas')).toBeNull();
  expect(get).not.toHaveBeenCalled();
});
it('keeps actual readiness separate from the labelled illustrative topology when samples are on', () => {
  flags.demoSurfaces = true;
  render(<NetworkTopologyMap />);
  const readiness = screen.getByTestId('l2-readiness');
  expect(readiness.textContent).toContain('L2 Prover: operational');
  expect(screen.getByTestId('network-topology-sample').contains(readiness)).toBe(false);
  expect(screen.getByTestId('network-topology-sample-badge').textContent).toBe('Sample data');
  expect(get).toHaveBeenCalledWith('/network/nodes');
});
it.each(['loading', 'error', 'missing'])('reports %s without inventing operational readiness from cached values', state => {
  response = { ...response, loading: state === 'loading', error: state === 'error' ? new Error('offline') : null,
    capabilities: state === 'missing' ? { features: {} } : response.capabilities };
  render(<NetworkTopologyMap />);
  const label = state === 'loading' ? 'checking' : state === 'error' ? 'not verified' : 'not reported';
  for (const signal of ['L2 Prover', 'L2 Verifier', 'L1 Finality']) expect(screen.getByText(`${signal}: ${label}`)).toBeTruthy();
  expect(screen.queryByText('L2 Prover: operational')).toBeNull();
});
it('updates reported status from operational to unavailable', () => {
  const { rerender } = render(<NetworkTopologyMap />);
  expect(screen.getByText('L2 Prover: operational')).toBeTruthy();
  response = { ...response, capabilities: { features: { l2Prover: { status: 'unavailable' } } } };
  rerender(<NetworkTopologyMap />);
  expect(screen.getByText('L2 Prover: unavailable')).toBeTruthy();
  expect(screen.queryByText('L2 Prover: operational')).toBeNull();
});
it('preserves weaker reported evidence without presenting it as operational', () => {
  response = { ...response, capabilities: { features: {
    l2Prover: { status: 'configured' }, l2Verifier: { status: 'reachable' }, l1Finality: { status: 'simulated' },
  } } };
  render(<NetworkTopologyMap />);
  for (const [signal, status] of [['L2 Prover', 'configured'], ['L2 Verifier', 'reachable'], ['L1 Finality', 'simulated']]) {
    expect(screen.getByText(`${signal}: ${status}`)).toBeTruthy();
  }
  expect(screen.queryByText(/: operational/)).toBeNull();
});
