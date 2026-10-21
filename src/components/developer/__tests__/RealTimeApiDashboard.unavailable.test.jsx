/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
const flags = { demoSurfaces: false };
const ws = { subscribe: jest.fn(), connect: jest.fn(), on: jest.fn(() => () => {}), status: 'connected' };
jest.unstable_mockModule('../../../config/features', () => ({ default: flags, FEATURES: flags }));
jest.unstable_mockModule('../../../services/websocketService', () => ({ getWebSocketClient: () => ws }));
const { default: Dashboard } = await import('../RealTimeApiDashboard');
afterEach(() => { cleanup(); flags.demoSurfaces = false; jest.clearAllMocks(); jest.restoreAllMocks(); });
it('unsupported API monitoring is unavailable without transport or empty-history claims', () => {
  const request = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"error":"unavailable"}', { status: 404 }));
  render(<Dashboard userId="synthetic-developer" />);
  expect(screen.getByText('API monitoring is unavailable')).toBeInTheDocument();
  expect(screen.queryByText('Real-time monitoring active')).not.toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(request).not.toHaveBeenCalled(); expect(ws.subscribe).not.toHaveBeenCalled(); expect(ws.connect).not.toHaveBeenCalled();
});
it('the enabled illustrative monitor is labelled before unsupported reads', async () => {
  flags.demoSurfaces = true;
  const request = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"error":"unavailable"}', { status: 404 }));
  render(<Dashboard userId="synthetic-developer" />);
  expect(screen.getByTestId('api-monitoring-sample-badge')).toHaveTextContent('Sample data');
  await waitFor(() => expect(request).toHaveBeenCalled()); expect(ws.subscribe).toHaveBeenCalledWith('api-monitoring');
});
