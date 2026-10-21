/** @jest-environment jsdom */
//
// frontend#304 review follow-up — PR #312 wrongly said FilecoinPanel did not
// exist. It does (routed at /integrations/filecoin) and is a real client for
// /api/filecoin/*, which no backend mounts. This pins the honest behaviour
// #304 asks for: with the API absent it shows no provider, no "online" status
// and no capacity/price figure — only the error and empty states.
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGet = jest.fn(() => Promise.reject(new Error('connect ECONNREFUSED /api/filecoin')));
jest.unstable_mockModule('axios', () => ({
  default: { get: mockGet, post: jest.fn(() => Promise.reject(new Error('no route'))) },
}));

const { default: FilecoinPanel } = await import('../FilecoinPanel');

describe('FilecoinPanel with no /api/filecoin/* route (frontend#304)', () => {
  it('renders only the error and empty states, never an invented provider or status', async () => {
    render(<FilecoinPanel />);

    await waitFor(() => {
      expect(screen.getByText('Error connecting to Filecoin network')).toBeInTheDocument();
    });
    expect(mockGet).toHaveBeenCalledWith('/api/filecoin/status');
    expect(screen.getByText('No data available. Please try refreshing.')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/online|TiB|PiB|\$\d|\d+(\.\d+)? FIL/i);
  });
});
