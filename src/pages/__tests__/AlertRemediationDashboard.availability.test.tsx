/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
const get = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const post = jest.fn<(...args: unknown[]) => Promise<unknown>>();
jest.unstable_mockModule('axios', () => ({ default: { get, post } }));
const { default: Dashboard } = await import('../AlertRemediationDashboard');
beforeEach(() => { get.mockReset(); post.mockReset(); get.mockImplementation(async () => { throw new Error('HTTP404'); }); });
it('reports unavailable after an unsupported alert read without claiming zero alerts', async () => {
  render(<Dashboard />);
  expect(await screen.findByText('Remediation API unavailable')).toBeInTheDocument();
  expect(screen.queryByText('Active Alerts (0)')).not.toBeInTheDocument();
  expect(screen.getByText('Active Alerts: unavailable')).toBeInTheDocument();
  expect(screen.queryByText('No active alerts')).not.toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
});
it('does not claim a zero count while the required read is pending', () => {
  get.mockImplementation(() => new Promise(() => {}));
  render(<Dashboard />);
  expect(screen.queryByText('Active Alerts (0)')).not.toBeInTheDocument();
  expect(screen.getByText('Loading active alerts')).toBeInTheDocument();
});
it('preserves a real empty alert response', async () => {
  get.mockImplementation(async () => ({ data: { success: true, data: [] } }));
  render(<Dashboard />);
  expect(await screen.findByText('No active alerts')).toBeInTheDocument();
  expect(screen.getByText('Active Alerts (0)')).toBeInTheDocument();
});
it('preserves a real firing alert and its count', async () => {
  get.mockImplementation(async () => ({ data: { success: true, data: [{ id: 'synthetic-alert', alertName: 'Synthetic alert', severity: 'SEV2', status: 'firing', summary: 'Synthetic warning', startedAt: '2026-09-01T00:00:00Z' }] } }));
  render(<Dashboard />);
  expect(await screen.findByText('Synthetic alert')).toBeInTheDocument();
  expect(screen.getByText('Active Alerts (1)')).toBeInTheDocument();
});
