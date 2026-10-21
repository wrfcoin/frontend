/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
const flags = { demoSurfaces: false };
jest.unstable_mockModule('../../../config/features', () => ({ default: flags, FEATURES: flags }));
// jsdom lacks canvas; chart rendering is outside the unavailable boundary.
jest.unstable_mockModule('react-chartjs-2', () => ({ Line: () => null }));
const { default: BacalhauPanel } = await import('../BacalhauPanel');
afterEach(() => { cleanup(); flags.demoSurfaces = false; jest.restoreAllMocks(); });
it('the unsupported network cannot show healthy status or generated compute nodes', () => {
  const request = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"error":"unavailable"}', { status: 404 }));
  render(<BacalhauPanel />);
  expect(screen.getByText('Bacalhau compute is unavailable')).toBeInTheDocument();
  expect(screen.queryByText('healthy')).not.toBeInTheDocument();
  expect(screen.queryByText('Bacalhau Compute Node Alpha')).not.toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(request).not.toHaveBeenCalled();
});

it('the enabled preview is labelled before exposing illustrative status', async () => {
  flags.demoSurfaces = true;
  const request = jest.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('{"error":"unavailable"}', { status: 404 }));
  render(<BacalhauPanel />);
  expect(screen.getByTestId('bacalhau-compute-sample-badge')).toHaveTextContent('Sample data');
  await waitFor(() => expect(request).toHaveBeenCalled());
});
