/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
const flags = { demoSurfaces: false };
jest.unstable_mockModule('../../../config/features', () => ({ default: flags, FEATURES: flags }));
const { default: NamingService } = await import('../NamingService');
const originalFetch = global.fetch;
afterEach(() => { cleanup(); global.fetch = originalFetch; flags.demoSurfaces = false; });
it('the absent naming service cannot advertise fees or local name availability', () => {
  global.fetch = jest.fn(async () => ({ ok: false, status: 404 })) as unknown as typeof fetch;
  render(<NamingService />);
  expect(screen.getByText('Identity names are unavailable')).toBeInTheDocument();
  expect(screen.queryByText(/12\.5/)).not.toBeInTheDocument();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});
it('name and fee controls exist only in a labelled illustrative preview', async () => {
  flags.demoSurfaces = true;
  global.fetch = jest.fn(async () => ({ ok: false, status: 404 })) as unknown as typeof fetch;
  render(<NamingService />);
  expect(screen.getByTestId('identity-names-sample-badge')).toHaveTextContent('Sample data');
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
});
