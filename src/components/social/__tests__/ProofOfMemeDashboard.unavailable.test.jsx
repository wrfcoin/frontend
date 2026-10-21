/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { ProofOfMemeDashboard } from '../ProofOfMemeDashboard';
import { useProofOfMeme } from '../../../hooks/useProofOfMeme';
const originalFetch = global.fetch;
beforeEach(() => { global.fetch = jest.fn(async () => ({ status: 404, ok: false })); });
afterEach(() => { cleanup(); global.fetch = originalFetch; });
it.each([false, true])('the absent social API shows unavailable rather than default rewards (compact=%s)', async compact => {
  render(<ProofOfMemeDashboard walletAddress="synthetic-wallet" compact={compact} />);
  expect(await screen.findByText('Proof-of-Meme rewards are unavailable')).toBeInTheDocument();
  expect(screen.queryByText(/1\.00|1\.0x/)).not.toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});
it('the hook exposes unknown reward data instead of a multiplier or zero counts', () => {
  const { result } = renderHook(() => useProofOfMeme('synthetic-wallet'));
  expect(result.current.available).toBe(false);
  expect(result.current.multiplier).toBeNull();
  expect(result.current.postsTracked).toBeNull();
  expect(result.current.totalEngagement).toBeNull();
  expect(result.current.error).toMatch(/unavailable/);
  expect(global.fetch).not.toHaveBeenCalled();
});
