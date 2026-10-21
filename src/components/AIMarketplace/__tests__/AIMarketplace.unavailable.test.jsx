/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
const flags = { demoSurfaces: false };
jest.unstable_mockModule('../../../config/features', () => ({ default: flags, FEATURES: flags }));
const get = jest.fn(async () => { throw new Error('404: no ai-marketplace API'); });
jest.unstable_mockModule('../../../services/apiClient', () => ({ apiClient: { get } }));
const { default: AIMarketplace } = await import('../AIMarketplace');
afterEach(() => { cleanup(); get.mockClear(); });
it('the unmounted model catalog cannot show fabricated usage, uptime or deployment controls', () => {
  flags.demoSurfaces = false;
  render(<AIMarketplace />);
  expect(screen.getByText('AI marketplace is unavailable')).toBeInTheDocument();
  expect(screen.queryByText('4.8M')).not.toBeInTheDocument();
  expect(screen.queryByText('99.7%')).not.toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(get).not.toHaveBeenCalled();
});
it('the retained marketplace is explicitly illustrative when demo surfaces are enabled', async () => {
  flags.demoSurfaces = true;
  render(<AIMarketplace />);
  expect(screen.getByTestId('ai-marketplace-sample-badge')).toHaveTextContent('Sample data');
  await waitFor(() => expect(get).toHaveBeenCalledWith('/ai-marketplace/models'));
  expect(screen.getByText('4.8M')).toBeInTheDocument();
});
