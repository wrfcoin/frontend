/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const get = jest.fn();
jest.unstable_mockModule('axios', () => ({ default: { get } }));
const { default: ComputationalNFTList } = await import('../ComputationalNFTList.jsx');
const endpoint = '/api/computational/nfts';
const realNFT = { id: 'served-nft-41', name: 'Served observation model', computationType: 'Observation', executionEnvironment: 'cloud', status: 'ready', creator: 'synthetic-test-owner', created: '2026-10-02T00:00:00Z' };
const mount = () => render(<MemoryRouter><ComputationalNFTList /></MemoryRouter>);
const expectNoInventedResults = () => {
  for (const name of ['Weather Forecast Model', 'Climate Analysis Pipeline', 'Air Quality Predictor']) expect(screen.queryByRole('heading', { name })).not.toBeInTheDocument();
  expect(document.querySelector('.nft-card')).toBeNull();
  expect(screen.queryByText('No computational NFTs found.')).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Create NFT' })).not.toBeInTheDocument();
};
beforeEach(() => {
  get.mockReset();
  get.mockImplementation(async path => {
    if (path === endpoint) throw new Error('404: computational NFTs unavailable');
    return { data: [] };
  });
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { cleanup(); jest.restoreAllMocks(); });
it('failed list reads show unavailable and Retry without synthetic or empty-success results', async () => {
  mount();
  expect(await screen.findByRole('heading', { name: 'Computational NFTs unavailable' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  expectNoInventedResults();
  expect(get).toHaveBeenCalledWith(endpoint);
});
it('pending list reads show loading without synthetic or empty-success results', () => {
  get.mockImplementation(path => path === endpoint ? new Promise(() => {}) : Promise.resolve({ data: [] }));
  mount(); expect(screen.getByText('Loading computational NFTs...')).toBeInTheDocument(); expectNoInventedResults();
});
it.each([[], { nfts: [] }])('a served empty list remains a genuine empty result (%j)', async data => {
  get.mockImplementation(async path => ({ data: path === endpoint ? data : [] }));
  mount(); expect(await screen.findByText('No computational NFTs found.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
});
it('renders actual served NFT records without substituting samples', async () => {
  get.mockImplementation(async path => ({ data: path === endpoint ? { nfts: [realNFT] } : [] }));
  mount(); expect(await screen.findByRole('link', { name: /Served observation model/ })).toHaveAttribute('href', '/nfts/computational/served-nft-41');
  expect(screen.queryByText('Weather Forecast Model')).not.toBeInTheDocument();
});
it.each([{}, [null], [{ id: 'missing-name' }]])('a malformed successful list remains unavailable (%j)', async data => {
  get.mockImplementation(async path => ({ data: path === endpoint ? data : [] })); mount();
  expect(await screen.findByRole('heading', { name: 'Computational NFTs unavailable' })).toBeInTheDocument(); expectNoInventedResults();
});
it('Retry re-fetches the real list and renders its actual response', async () => {
  let attempts = 0;
  get.mockImplementation(async path => {
    if (path !== endpoint) return { data: [] };
    if (++attempts === 1) throw new Error('temporary failure');
    return { data: [realNFT] };
  });
  mount(); fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
  expect(await screen.findByRole('link', { name: /Served observation model/ })).toBeInTheDocument();
  expect(attempts).toBe(2); expect(screen.queryByText('Weather Forecast Model')).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Computational NFTs unavailable' })).not.toBeInTheDocument();
});
it('a failed Retry stays unavailable without synthetic items', async () => {
  mount(); fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(get.mock.calls.filter(([path]) => path === endpoint)).toHaveLength(2));
  expect(await screen.findByRole('heading', { name: 'Computational NFTs unavailable' })).toBeInTheDocument(); expectNoInventedResults();
});
