/** @jest-environment jsdom */
import React from 'react';
import { readFileSync } from 'node:fs';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import PublicTestnetLandingPage from '../PublicTestnetLandingPage';

const STATUS = { blockHeight: 12345, network: 'testnet' };
const BLOCKS = {
  blocks: [{ height: 12345, timestamp: '2026-09-09T04:05:06Z' }],
};
const ZONES = { zones: [{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }] };

function jsonOnce(payload) {
  return Promise.resolve({ ok: true, status: 200, json: async () => payload });
}

/** Route the mocked fetch by path so ordering changes cannot silently pass. */
function mockEdge(handler) {
  global.fetch = jest.fn(url => handler(String(url)));
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <PublicTestnetLandingPage />
    </MemoryRouter>,
  );

afterEach(() => {
  jest.restoreAllMocks();
  delete global.fetch;
});

describe('PublicTestnetLandingPage', () => {
  it('states what the testnet is and that its tokens are worthless', async () => {
    mockEdge(() => Promise.reject(new Error('offline')));
    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: /Public weather-data testnet/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/personal weather stations\s+contribute observations/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Testnet WRF has no monetary value, the network may reset, and no mainnet migration is promised/i),
    ).toBeInTheDocument();

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });

  it('reads live numbers only from the three routes the public edge admits', async () => {
    mockEdge(url => {
      if (url.startsWith('/api/blockchain/status')) return jsonOnce(STATUS);
      if (url.startsWith('/api/blockchain/blocks')) return jsonOnce(BLOCKS);
      if (url.startsWith('/api/weather/coverage-zones')) return jsonOnce(ZONES);
      throw new Error(`unexpected request: ${url}`);
    });

    renderPage();

    expect(await screen.findByText('12,345')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(
      document.querySelector('time[datetime="2026-09-09T04:05:06.000Z"]'),
    ).toBeInTheDocument();

    const requested = global.fetch.mock.calls.map(([url]) => String(url).split('?')[0]);
    expect(new Set(requested)).toEqual(
      new Set([
        '/api/blockchain/status',
        '/api/blockchain/blocks',
        '/api/weather/coverage-zones',
      ]),
    );
  });

  it('says live numbers are unavailable rather than inventing them', async () => {
    mockEdge(() => Promise.resolve({ ok: false, status: 404, json: async () => ({}) }));
    renderPage();

    expect(await screen.findByText(/Live numbers unavailable/i)).toBeInTheDocument();
    // Nothing numeric may stand in for a value we could not read.
    expect(screen.queryByText(/^[\d,]+$/)).not.toBeInTheDocument();
  });

  it('marks a single missing number unavailable without blanking the others', async () => {
    mockEdge(url => {
      if (url.startsWith('/api/blockchain/status')) return jsonOnce(STATUS);
      if (url.startsWith('/api/blockchain/blocks')) return Promise.reject(new Error('nope'));
      if (url.startsWith('/api/weather/coverage-zones')) return jsonOnce(ZONES);
      throw new Error(`unexpected request: ${url}`);
    });

    renderPage();

    expect(await screen.findByText('12,345')).toBeInTheDocument();
    expect(screen.getByText('unavailable')).toBeInTheDocument();
    expect(document.querySelector('time')).not.toBeInTheDocument();
  });

  it('shows a loading state before the edge answers', () => {
    mockEdge(() => new Promise(() => {}));
    renderPage();

    expect(screen.getByText(/Reading live numbers from the testnet/i)).toBeInTheDocument();
  });

  it('links every main public destination and the four policy routes, nothing off-site', async () => {
    globalThis.__VITE_ENV__ = { VITE_PUBLIC_READONLY_PATHS: 'true' };
    mockEdge(() => Promise.reject(new Error('offline')));
    renderPage();

    const hrefs = screen
      .getAllByRole('link')
      .map(link => link.getAttribute('href'));
    expect(hrefs).toEqual([
      '/onboarding',
      '/map',
      '/explore',
      '/search',
      '/leaderboard/contributors',
      '/governance/public',
      '/weather/forecast',
      '/wallet',
      '/connect-station',
      '/downloads',
      '/terms',
      '/privacy',
      '/api-terms',
      '/security',
    ]);
    hrefs.forEach(href => expect(href.startsWith('/')).toBe(true));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    delete globalThis.__VITE_ENV__;
  });

  it('without the public read-only flag, links only the core policy routes', async () => {
    delete globalThis.__VITE_ENV__;
    mockEdge(() => Promise.reject(new Error('offline')));
    renderPage();

    const hrefs = screen
      .getAllByRole('link')
      .map(link => link.getAttribute('href'));
    expect(hrefs).toEqual(['/downloads', '/terms', '/privacy', '/api-terms', '/security']);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });

  it('carries no sign-up funnel, marketing claim, or unpublished URL', () => {
    const source = readFileSync(
      new URL('../PublicTestnetLandingPage.jsx', import.meta.url),
      'utf8',
    );

    // The owner has not published a public URL, an invite link, or a sign-up
    // flow. None of them may appear on the one page anonymous visitors see.
    expect(source).not.toMatch(/https?:\/\//);
    expect(source).not.toMatch(/sign\s?up|join now|get started|waitlist|discord|telegram/i);
    // Extracted product families that this testnet does not put in front of
    // the public (see NEVER_PUBLIC_PATH_PREFIXES and OPERATOR_PREVIEW_PATH_PREFIXES).
    expect(source).not.toMatch(/\bDeFi\b|\bNFT\b|trading|yield|staking rewards/i);
  });
});
