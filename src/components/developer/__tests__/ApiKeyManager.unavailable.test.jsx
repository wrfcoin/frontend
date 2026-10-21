/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
const flags = { demoSurfaces: false };
jest.unstable_mockModule('../../../config/features', () => ({ default: flags, FEATURES: flags }));
const { default: Manager } = await import('../ApiKeyManager');
afterEach(() => { cleanup(); flags.demoSurfaces = false; jest.restoreAllMocks(); });
it('unsupported developer keys are unavailable without an empty-key or management claim', () => {
  const request = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"error":"unavailable"}', { status: 404 }));
  render(<Manager userId="synthetic-developer" />);
  expect(screen.getByText('Developer API keys are unavailable')).toBeInTheDocument();
  expect(screen.queryByText('No API Keys Yet')).not.toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(request).not.toHaveBeenCalled();
});
it('the enabled illustrative key manager is labelled before unsupported reads', async () => {
  flags.demoSurfaces = true;
  const request = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"error":"unavailable"}', { status: 404 }));
  render(<Manager userId="synthetic-developer" />);
  expect(screen.getByTestId('developer-keys-sample-badge')).toHaveTextContent('Sample data');
  await waitFor(() => expect(request).toHaveBeenCalled());
});
