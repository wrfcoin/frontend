/** @jest-environment jsdom */
/**
 * frontend#353 — ModelDeploy. No backend route deploys models (no
 * /api/ai-marketplace is mounted). Default build: not-live. Demo build:
 * Deploy Now is disabled, and no timer produces "Deployment Successful".
 */
import React from 'react';
import { jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

const featureFlags = { demoSurfaces: false };
const apiGet = jest.fn();
await jest.unstable_mockModule('../../../config/features', () => ({ FEATURES: featureFlags, default: featureFlags }));
await jest.unstable_mockModule('../../../services/apiClient', () => ({ apiClient: { get: apiGet } }));

const { default: ModelDeploy } = await import('../ModelDeploy');

const MODEL = { id: 'm1', name: 'Storm Nowcast', version: '1.0', category: 'forecast', author: 'x', tags: [] };
const STATION = { id: 'st-1', name: 'Hilltop station', location: 'Ridge' };

beforeEach(() => {
  apiGet.mockImplementation(async path => (path.includes('stations') ? [STATION] : []));
});
afterEach(() => {
  cleanup();
  jest.useRealTimers();
  jest.clearAllMocks();
  featureFlags.demoSurfaces = false;
});

it('default build: not-live, and no ai-marketplace route is read', async () => {
  await act(async () => { render(<ModelDeploy model={MODEL} allModels={[MODEL]} onBack={() => {}} />); });
  expect(screen.getByTestId('ai-model-deploy-not-live').textContent).toMatch(/not live on the testnet/);
  expect(apiGet).not.toHaveBeenCalled();
});

it('demo build: Deploy Now is disabled and nothing reports a deployment, even after 10 s', async () => {
  featureFlags.demoSurfaces = true;
  await act(async () => { render(<ModelDeploy model={MODEL} allModels={[MODEL]} onBack={() => {}} />); });
  fireEvent.click(await screen.findByText('Hilltop station (Ridge)'));
  fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
  fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
  const deploy = screen.getByRole('button', { name: /Deploy Now/ });
  expect(deploy.disabled).toBe(true);
  jest.useFakeTimers();
  fireEvent.click(deploy);
  await act(async () => { jest.advanceTimersByTime(10_000); });
  expect(screen.queryByText(/Deployment Successful/)).toBeNull();
  expect(screen.queryByText(/is now running/)).toBeNull();
});
