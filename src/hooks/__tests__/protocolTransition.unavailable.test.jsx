/** @jest-environment jsdom */
// /api/protocol/transition is not a mounted backend family. Even a full-studio
// (internal) build must not poll it or invent a transition state: the hook
// answers "no transition known" without a request.
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { jest } from '@jest/globals';

await jest.unstable_mockModule('../../config/features', () => ({
  FEATURES: { fullStudio: true, publicReadonly: false },
}));
const { useProtocolTransition } = await import('../useProtocolTransition');
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
);

it.each([
  ['a 503', () => new Response('{}', { status: 503 })],
  ['an invented answer', () => new Response(JSON.stringify({ gateRiskyActions: true }), { status: 200 })],
])('full studio never asks for or adopts %s', async (_name, respond) => {
  global.fetch = jest.fn(async () => respond());
  const { result } = renderHook(() => useProtocolTransition(), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(global.fetch).not.toHaveBeenCalled();
  expect(result.current.transition).toBeNull();
  expect(result.current.error).toBeNull();
});
