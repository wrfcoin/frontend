/** @jest-environment jsdom */
/**
 * frontend#353 — the real Cortex AI page. No backend route serves models,
 * jobs or training. Default build: not-live. Demo build: every action is
 * disabled, and no timer produces "submitted".
 */
import React from 'react';
import { jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

const featureFlags = { demoSurfaces: false };
await jest.unstable_mockModule('../../../config/features', () => ({ FEATURES: featureFlags, default: featureFlags }));

const { default: CortexAIIntegration } = await import('../CortexAIIntegration');

afterEach(() => {
  cleanup();
  jest.useRealTimers();
  featureFlags.demoSurfaces = false;
});

it('default build: honest not-live state and no sample jobs or models', async () => {
  await act(async () => { render(<CortexAIIntegration />); });
  expect(screen.getByTestId('cortex-ai-not-live').textContent).toMatch(/not live on the testnet/);
  expect(screen.queryByText('Computing Resources')).toBeNull();
});

it('demo build: actions disabled; submitting never reports success, even after 10 s', async () => {
  featureFlags.demoSurfaces = true;
  jest.useFakeTimers();
  await act(async () => { render(<CortexAIIntegration />); });
  expect(screen.getByTestId('cortex-ai-sample-badge').textContent).toBe('Sample data');
  expect(screen.queryByText(/INITIALIZING|Loading/i)).toBeNull();
  for (const name of [/View All Jobs/, /Deploy/]) {
    for (const b of screen.queryAllByRole('button', { name })) expect(b.disabled).toBe(true);
  }
  fireEvent.click(screen.getByRole('button', { name: 'Train Model' }));
  const start = screen.getByRole('button', { name: /Start Training/ });
  expect(start.disabled).toBe(true);
  fireEvent.submit(start.closest('form'));
  await act(async () => { jest.advanceTimersByTime(10_000); });
  expect(screen.queryByText(/submitted successfully/i)).toBeNull();
  expect(screen.getByRole('button', { name: /Upload Model/ }).disabled).toBe(true);
});
