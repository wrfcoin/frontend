/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
const flags = { demoSurfaces: false };
jest.unstable_mockModule('../../../config/features', () => ({ default: flags, FEATURES: flags }));
const { default: Dashboard } = await import('../TatauCloudDashboard');
afterEach(() => { cleanup(); flags.demoSurfaces = false; jest.restoreAllMocks(); });
it('unsupported TatauCloud status cannot mount capacity readings or controls', () => {
  const request = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"error":"unavailable"}', { status: 404 }));
  render(<Dashboard />);
  expect(screen.getByText('Tatau compute is unavailable')).toBeInTheDocument();
  expect(screen.queryByText('Submit Job')).not.toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(request).not.toHaveBeenCalled();
});

it('the enabled preview is labelled before exposing illustrative status', async () => {
  flags.demoSurfaces = true;
  const request = jest.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('{"error":"unavailable"}', { status: 404 }));
  render(<Dashboard />);
  expect(screen.getByTestId('tatau-compute-sample-badge')).toHaveTextContent('Sample data');
  await waitFor(() => expect(request).toHaveBeenCalled());
});
