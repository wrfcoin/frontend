/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import ComputeContributionPage from '../ComputeContributionPage';
const originalFetch = global.fetch;
afterEach(() => { cleanup(); global.fetch = originalFetch; localStorage.clear(); });
it.each([null, 'synthetic-retained-node'])('unsupported compute contribution has no earnings or node controls (%s)', async node => {
  if (node) localStorage.setItem('computeNodeId', node);
  global.fetch = jest.fn(async () => ({ ok: false, status: 404, json: async () => ({}) }));
  render(<ComputeContributionPage />);
  expect(await screen.findByText('Compute contribution is unavailable')).toBeInTheDocument();
  expect(screen.queryByText(/Earning Potential|Success Rate|Total Earnings/)).not.toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});
