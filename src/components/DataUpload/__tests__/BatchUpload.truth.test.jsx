/** @jest-environment jsdom */
/**
 * frontend#353 — the real /data/upload page. No backend route accepts uploads
 * or cloud imports, so the default build is not-live. The demo sample's
 * import and connect actions are disabled, and no timer can produce a
 * "complete" or "connected" state.
 */
import React from 'react';
import { jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';

const featureFlags = { demoSurfaces: false };
const apiGet = jest.fn();

await jest.unstable_mockModule('../../../config/features', () => ({ FEATURES: featureFlags, default: featureFlags }));
await jest.unstable_mockModule('../../../services/apiClient', () => ({ apiClient: { get: apiGet } }));

const { default: BatchUploadPage } = await import('../BatchUploadPage');

const PLATFORM = { id: 'ambient', name: 'Ambient Weather', connected: false, availableDateRange: null, recordCount: null };

beforeEach(() => {
  apiGet.mockResolvedValue([PLATFORM]);
});
afterEach(() => {
  cleanup();
  jest.useRealTimers();
  jest.clearAllMocks();
  featureFlags.demoSurfaces = false;
});

async function renderPage() {
  await act(async () => { render(<BatchUploadPage />); });
}

it('default build: honest not-live state, no sample, no upload route read', async () => {
  await renderPage();
  expect(screen.getByTestId('data-upload-not-live').textContent).toMatch(/not live on the testnet/);
  expect(screen.queryByText('Cloud Platform Connections')).toBeNull();
  expect(apiGet).not.toHaveBeenCalled();
});

it('demo build: cloud connect is disabled and no timer ever reports connected', async () => {
  featureFlags.demoSurfaces = true;
  jest.useFakeTimers();
  await renderPage();
  expect(screen.getByTestId('data-upload-sample-badge').textContent).toBe('Sample data');
  const card = (await screen.findByText('Ambient Weather')).closest('.MuiPaper-root');
  const connect = within(card).getByRole('button', { name: /Connect/ });
  expect(connect.disabled).toBe(true);
  fireEvent.click(connect);
  await act(async () => { jest.advanceTimersByTime(10_000); });
  expect(screen.queryByText(/42,000|records/)).toBeNull();
  expect(within(card).getByText('Not connected')).not.toBeNull();
});

it('demo build: no enabled Start Import, and no timer ever reports complete', async () => {
  featureFlags.demoSurfaces = true;
  jest.useFakeTimers();
  await renderPage();
  const input = document.querySelector('input[type="file"]');
  await act(async () => {
    fireEvent.change(input, { target: { files: [new File(['t,h\n1,2'], 'obs.csv', { type: 'text/csv' })] } });
  });
  fireEvent.click(screen.getByRole('button', { name: /Detect Format/ }));
  for (const start of screen.queryAllByRole('button', { name: /Start Import/ })) {
    expect(start.disabled).toBe(true);
    fireEvent.click(start);
  }
  await act(async () => { jest.advanceTimersByTime(10_000); });
  expect(screen.queryByText(/import complete|complete!/i)).toBeNull();
  expect(screen.queryByTestId('import-progress')).toBeNull();
});
