/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';
import ServiceManagementPage from '../ServiceManagementPage';
const originalFetch = global.fetch;
afterEach(() => { cleanup(); global.fetch = originalFetch; });
it('the absent service/system APIs cannot produce earnings, telemetry or controls', async () => {
  global.fetch = jest.fn(async () => ({ ok: false, status: 404, json: async () => ({}) }));
  render(<ServiceManagementPage />);
  expect(await screen.findByText('Service management is unavailable')).toBeInTheDocument();
  expect(screen.getByText(/service-management API is not served/)).toBeInTheDocument();
  expect(screen.queryByText(/2\.50/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Services Running|Critical Services|Last Updated/)).not.toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});
