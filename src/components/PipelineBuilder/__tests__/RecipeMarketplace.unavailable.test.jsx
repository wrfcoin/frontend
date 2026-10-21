/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
const flags = { demoSurfaces: false };
jest.unstable_mockModule('../../../config/features', () => ({ default: flags, FEATURES: flags }));
const get = jest.fn(async () => { throw new Error('404: pipeline catalog unavailable'); });
jest.unstable_mockModule('../../../services/apiClient', () => ({ apiClient: { get } }));
const { default: RecipeMarketplace } = await import('../RecipeMarketplace');
afterEach(() => { cleanup(); flags.demoSurfaces = false; get.mockClear(); });
it('an absent recipe API is unavailable rather than an empty live catalog', () => {
  render(<RecipeMarketplace onUseTemplate={jest.fn()} />);
  expect(screen.getByText('Pipeline recipes are unavailable')).toBeInTheDocument();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(get).not.toHaveBeenCalled();
});

it('an enabled recipe preview carries a sample badge', async () => {
  flags.demoSurfaces = true;
  render(<RecipeMarketplace onUseTemplate={jest.fn()} />);
  expect(screen.getByTestId('pipeline-recipes-sample-badge')).toHaveTextContent('Sample data');
  await waitFor(() => expect(get).toHaveBeenCalledWith('/pipeline/recipes'));
});
