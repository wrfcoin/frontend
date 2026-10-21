/** @jest-environment jsdom */
/**
 * frontend#353 — the real /nfts page. The header shows only the minted count
 * served by GET /api/nft (pagination.total). The marketplace and enterprise
 * demo tabs are not-live by default, and in the demo build their actions
 * cannot produce a success. Only fetch and feature flags are faked.
 */
import React from 'react';
import { jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const featureFlags = { demoSurfaces: false, fullStudio: true, publicReadonly: false };
await jest.unstable_mockModule('../../config/features', () => ({
  FEATURES: featureFlags,
  default: featureFlags,
  isMvpMode: () => false,
}));

const { default: EnhancedNFTPage } = await import('../EnhancedNFTPage');
const { setAuthToken, clearAuthToken } = await import('../../services/authTokenStore');

const TOKEN_A = 'token-a';
const TOKEN_B = 'token-b';

const FABRICATED = [
  '2,847', '245', 'TFLOPS', '89,562', '167', '98.7%', '350 WRF',
  '3M+', 'Environmental Readings Daily', '50K', 'TPS Processing', 'Countries Covered', '99.9%', 'Network Uptime',
];
let nftResponse;

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

beforeEach(() => {
  nftResponse = () => json(200, { success: true, data: [], pagination: { limit: 1, offset: 0, total: 5, hasNext: true, hasPrev: false } });
  // The backend NFT router applies requireAuth: enforce it here too.
  global.fetch = jest.fn(async (input, init = {}) => {
    const url = new URL(String(input), 'https://test.invalid');
    if (url.pathname === '/api/nft') {
      const auth = new Headers(init.headers).get('authorization');
      if (!auth || !/^Bearer token-[ab]$/.test(auth)) return json(401, { success: false, error: 'Authentication required' });
      return nftResponse(auth);
    }
    return json(404, { success: false, error: 'not mounted' });
  });
  setAuthToken(TOKEN_A);
  jest.spyOn(window, 'alert').mockImplementation(() => {});
  jest.spyOn(window, 'prompt').mockImplementation(() => null);
  jest.spyOn(window, 'confirm').mockImplementation(() => true);
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  clearAuthToken();
  jest.useRealTimers();
  jest.restoreAllMocks();
  featureFlags.demoSurfaces = false;
});

async function renderPage() {
  await act(async () => {
    render(<MemoryRouter><EnhancedNFTPage /></MemoryRouter>);
  });
}

const header = () => screen.getByTestId('nft-header-total');

describe('header', () => {
  it('shows the minted count from GET /api/nft and nothing invented', async () => {
    await renderPage();
    await waitFor(() => expect(header().textContent).toBe('5Minted NFTs'));
    expect(global.fetch.mock.calls.some(([u]) => new URL(String(u), 'https://t').pathname === '/api/nft')).toBe(true);
    const nftCalls = global.fetch.mock.calls.filter(([u]) => {
      const url = new URL(String(u), 'https://t');
      return url.pathname === '/api/nft' && url.searchParams.get('limit') === '1';
    });
    expect(new Headers(nftCalls[0][1].headers).get('authorization')).toBe(`Bearer ${TOKEN_A}`);
    for (const literal of FABRICATED) expect(document.body.textContent).not.toContain(literal);
    expect(document.body.textContent).not.toContain('Climate Oracle Network Active');
  });

  it('a failing count is shown as unavailable, never as a number', async () => {
    nftResponse = () => json(503, { success: false, error: 'core4 unavailable' });
    await renderPage();
    await waitFor(() => expect(header().textContent).toBe('—NFT count unavailable'));
  });

  it('a response without pagination.total is not guessed', async () => {
    nftResponse = () => json(200, { success: true, data: [{ id: 1 }] });
    await renderPage();
    await waitFor(() => expect(header().textContent).toBe('—NFT count unavailable'));
  });
});

describe('header session binding', () => {
  it('signed out: no request, and an honest sign-in label instead of a number', async () => {
    clearAuthToken();
    await renderPage();
    await waitFor(() => expect(header().textContent).toBe('—Sign in to see the NFT count'));
    // The header's count request is /api/nft?limit=1 (the showcase tab makes its own list read).
    const headerCalls = global.fetch.mock.calls.filter(([u]) => {
      const url = new URL(String(u), 'https://t');
      return url.pathname === '/api/nft' && url.searchParams.get('limit') === '1';
    });
    expect(headerCalls).toHaveLength(0);
  });

  it('an earlier session\'s slower count is not shown to the next session', async () => {
    let releaseA;
    nftResponse = auth =>
      auth === `Bearer ${TOKEN_A}`
        ? new Promise(r => { releaseA = () => r(json(200, { success: true, data: [], pagination: { total: 99 } })); })
        : json(200, { success: true, data: [], pagination: { total: 7 } });
    await renderPage();
    await act(async () => { setAuthToken(TOKEN_B); });
    await waitFor(() => expect(header().textContent).toBe('7Minted NFTs'));
    await act(async () => { releaseA(); });
    await new Promise(r => setTimeout(r, 20));
    expect(header().textContent).toBe('7Minted NFTs');
  });
});

describe('marketplace and enterprise demo tabs', () => {
  it.each([
    ['Marketplace', 'nft-marketplace'],
    ['Enterprise Demo', 'nft-enterprise-demo'],
  ])('%s default build: not-live', async (tab, testId) => {
    await renderPage();
    fireEvent.click(screen.getByRole('tab', { name: tab }));
    expect(await screen.findByTestId(`${testId}-not-live`)).not.toBeNull();
    expect(document.body.textContent).not.toContain('350 WRF');
  });

  it('demo marketplace: buy/bid/execute/mint are disabled and nothing reports success', async () => {
    featureFlags.demoSurfaces = true;
    await renderPage();
    fireEvent.click(screen.getByRole('tab', { name: 'Marketplace' }));
    const sample = await screen.findByTestId('nft-marketplace-sample');
    const actions = within(sample).queryAllByRole('button', { name: /^(Execute|Place Bid|Buy Now)$/ });
    expect(actions.length).toBeGreaterThan(0);
    for (const b of actions) {
      expect(b.disabled).toBe(true);
      fireEvent.click(b);
    }
    fireEvent.click(within(sample).getByRole('tab', { name: 'Create NFT' }));
    const mint = within(sample).getByRole('button', { name: /Create & Mint NFT/ });
    expect(mint.disabled).toBe(true);
    fireEvent.click(mint);
    expect(document.body.textContent).not.toMatch(/successful|minted successfully/i);
    expect(window.alert).not.toHaveBeenCalled();
    expect(window.prompt).not.toHaveBeenCalled();
    expect(window.confirm).not.toHaveBeenCalled();
  });

  it('demo enterprise walkthrough: run is disabled and no timer advances it', async () => {
    featureFlags.demoSurfaces = true;
    await renderPage();
    fireEvent.click(screen.getByRole('tab', { name: 'Enterprise Demo' }));
    const sample = await screen.findByTestId('nft-enterprise-demo-sample');
    const before = sample.textContent;
    // Codex round 17: manual navigation must not reach a success claim either.
    const continues = within(sample).getAllByRole('button', { name: 'Continue' });
    expect(continues.length).toBeGreaterThan(0);
    for (const button of continues) {
      expect(button.disabled).toBe(true);
      fireEvent.click(button);
      fireEvent.click(button);
    }
    expect(document.body.textContent).not.toMatch(/successfully generated/i);
    for (const button of within(sample).getAllByRole('button', { name: 'Reset Demo' })) expect(button.disabled).toBe(true);
    const run = within(sample).getAllByRole('button').find(b => b.title === 'Sample only: nothing is created or processed.');
    expect(run).toBeDefined();
    expect(run.disabled).toBe(true);
    jest.useFakeTimers();
    fireEvent.click(run);
    await act(async () => { jest.advanceTimersByTime(10_000); });
    expect(sample.textContent).toBe(before);
  });
});
