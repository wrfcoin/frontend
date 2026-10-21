import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

await jest.unstable_mockModule('../../DesignSystem', () => ({
  WrfButton: ({ children, variant, ...props }) => <button {...props}>{children}</button>,
}));
const UsageAnalytics = (await import('../UsageAnalytics')).default;
const data = { overview: { totalRequests: 321, requestsToday: 17, activeApiKeys: 1,
  averageResponseTime: 25, successRate: 98, requestsThisMonth: 321 }, apiKeys: [] };
const served = () => ({ ok: true, json: async () => ({ data }) });
beforeEach(() => { global.fetch = jest.fn(async () => served()); });
afterEach(() => { cleanup(); jest.restoreAllMocks(); });
it('retains the served overview without offering inert export, report, or email actions', async () => {
  render(<UsageAnalytics userId="synthetic-user" />);
  expect((await screen.findAllByText('Total Requests')).length).toBeGreaterThan(0);
  expect(screen.getAllByText('321').length).toBeGreaterThan(0);
  for (const name of ['Export CSV', 'Generate Report', 'Email Summary']) {
    expect(screen.queryByRole('button', { name })).toBeNull();
  }
  expect(screen.queryByText('Export Data')).toBeNull();
});
it('keeps the error-state Retry action functional', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  global.fetch.mockResolvedValueOnce({ ok: false });
  render(<UsageAnalytics userId="synthetic-user" />);
  fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
  expect((await screen.findAllByText('Total Requests')).length).toBeGreaterThan(0);
  expect(global.fetch).toHaveBeenCalledTimes(2);
});
