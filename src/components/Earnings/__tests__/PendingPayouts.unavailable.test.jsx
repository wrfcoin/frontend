/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const state = { account: null, isConnected: false };
jest.unstable_mockModule('../../../hooks/useWalletData', () => ({ default: () => state }));
const get = jest.fn(async () => { throw new Error('404: pending rewards unavailable'); });
const post = jest.fn(async () => { throw new Error('404: claims unavailable'); });
jest.unstable_mockModule('../../../services/apiClient', () => ({ apiClient: { getWithFallback: get, postWithFallback: post } }));
const { default: PendingPayouts } = await import('../PendingPayouts');
afterEach(() => { cleanup(); get.mockClear(); post.mockClear(); });
it.each([null, 'synthetic-address'])('an unmounted pending rewards API cannot show a claim amount for %s', account => {
  state.account = account; state.isConnected = Boolean(account);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><PendingPayouts /></QueryClientProvider>);
  expect(screen.getByText('Pending rewards are unavailable')).toBeInTheDocument();
  expect(screen.queryByText('Available to Claim')).not.toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(get).not.toHaveBeenCalled(); expect(post).not.toHaveBeenCalled();
});
