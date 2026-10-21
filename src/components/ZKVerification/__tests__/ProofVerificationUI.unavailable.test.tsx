/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
const realStyles = await import('../../../../node_modules/@mui/material/esm/styles/index.js');
await jest.unstable_mockModule('@mui/material/styles', () => realStyles);
const flags = { demoSurfaces: false };
jest.unstable_mockModule('../../../config/features', () => ({ default: flags, FEATURES: flags }));
const { default: ProofVerificationUI } = await import('../ProofVerificationUI');
const originalFetch = global.fetch;
afterEach(() => { cleanup(); jest.useRealTimers(); global.fetch = originalFetch; });

it('the absent ZK backend renders a not-live notice without requesting proof history', () => {
  flags.demoSurfaces = false;
  global.fetch = jest.fn(async () => { throw new Error('unserved'); }) as unknown as typeof fetch;
  render(<ProofVerificationUI />);
  expect(screen.getByTestId('zk-proof-verification-not-live')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Verify Proof' })).not.toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});

it.each(['404', 'network', 'malformed input', 'malformed response'])('%s never becomes verified in the explicit preview', async mode => {
  flags.demoSurfaces = true;
  global.fetch = jest.fn(async (_url: unknown, options?: RequestInit) => {
    if (!options?.method) return { ok: true, json: async () => [] };
    if (mode === 'network') throw new Error('offline');
    return { ok: mode === 'malformed response', status: 404, json: async () => ({ valid: 'false' }) };
  }) as unknown as typeof fetch;
  render(<ProofVerificationUI />);
  if (mode === 'malformed input') fireEvent.change(screen.getByRole('textbox'), { target: { value: 'not-json' } });
  fireEvent.click(screen.getByRole('button', { name: 'Verify Proof' }));
  expect(await screen.findByText('Proof verification is unavailable')).toBeInTheDocument();
  expect(screen.queryByText('Proof Verified Successfully')).not.toBeInTheDocument();
  expect(screen.queryByText('Proof Verification Failed')).not.toBeInTheDocument();
});

it.each([true, false])('only a successful boolean verifier response gives a verdict: %s', async valid => {
  flags.demoSurfaces = true;
  global.fetch = jest.fn(async (_url: unknown, options?: RequestInit) => ({ ok: true, json: async () => options?.method ? { valid } : [] })) as unknown as typeof fetch;
  render(<ProofVerificationUI />);
  fireEvent.click(screen.getByRole('button', { name: 'Verify Proof' }));
  expect(await screen.findByText(valid ? 'Proof Verified Successfully' : 'Proof Verification Failed')).toBeInTheDocument();
});

it.each(['404', 'network', 'malformed', 'false', 'true'])('a slow %s response cannot animate a verification verdict', async mode => {
  jest.useFakeTimers();
  flags.demoSurfaces = true;
  let finish!: () => void;
  const pending = new Promise((fulfil, reject) => {
    finish = () => mode === 'network'
      ? reject(new Error('offline'))
      : fulfil({ ok: mode !== '404', json: async () => ({ valid: mode === 'malformed' ? 'false' : mode === 'true' }) });
  });
  global.fetch = jest.fn(async (_url: unknown, options?: RequestInit) => options?.method
    ? pending
    : { ok: true, json: async () => [] }) as unknown as typeof fetch;
  render(<ProofVerificationUI />);
  fireEvent.click(screen.getByRole('button', { name: 'Verify Proof' }));
  await act(async () => { await jest.advanceTimersByTimeAsync(4500); });
  expect(screen.getByText('Verified!')).not.toHaveClass('Mui-active');
  expect(screen.getByText('Verified!')).not.toHaveClass('Mui-completed');
  await act(async () => { finish(); });
  expect(screen.getByText('Verified!').classList.contains('Mui-active')).toBe(mode === 'true');
  expect(screen.getByText(mode === 'true' ? 'Proof Verified Successfully'
    : mode === 'false' ? 'Proof Verification Failed' : 'Proof verification is unavailable')).toBeInTheDocument();
});
