/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const flags = { demoSurfaces: false };
const get = jest.fn(async () => { throw new Error('404: unsupported contributor routes'); });
jest.unstable_mockModule('../../config/features', () => ({ default: flags, FEATURES: flags }));
jest.unstable_mockModule('../apiClient', () => ({ apiClient: { get } }));
const { default: Profile } = await import('../../components/Leaderboard/ContributorProfile');
afterEach(() => { cleanup(); flags.demoSurfaces = false; get.mockClear(); });
it('existing default contributor gate prevents private data requests', () => {
  render(<MemoryRouter><Profile userId="synthetic-contributor" /></MemoryRouter>);
  expect(screen.getByText('Contributor profiles are not live')).toBeInTheDocument();
  expect(get).not.toHaveBeenCalled();
});
it('the opt-in contributor preview remains labelled before unsupported reads', async () => {
  flags.demoSurfaces = true;
  render(<MemoryRouter><Profile userId="synthetic-contributor" /></MemoryRouter>);
  expect(screen.getByTestId('contributor-profile-sample-badge')).toHaveTextContent('Sample data');
  await waitFor(() => expect(get).toHaveBeenCalled());
});
