/** @jest-environment jsdom */
//
// frontend#293 — NFTShowcase must not present invented case studies
// ("Miami…", "Arizona…") or platform-wide stats as real. Real NFTs come from
// GET /api/nft; sample content is demo-surface only and labelled.
//
// frontend#394 — `fetch` is mocked, not `apiClient`, so the real request path
// runs. The old code went through ApiClient, whose envelope unwrapping dropped
// `pagination` and the list wrapper, so it showed 0 against a live backend
// while its apiClient-mocked test passed. The mock also enforces the bearer
// token that the NFT router's requireAuth demands.
import { jest } from '@jest/globals';
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const featuresMock = { demoSurfaces: false, nfts: true };

jest.unstable_mockModule('../../../config/features', () => ({
  default: featuresMock,
  FEATURES: featuresMock,
}));

const { default: NFTShowcase } = await import('../NFTShowcase');
const { setAuthToken, clearAuthToken } = await import('../../../services/authTokenStore');

const FABRICATED = ['Miami Climate Risk Assessment', 'Arizona Solar Farm Carbon Credits', '89,562', '167 Countries', '50,000 TPS', 'Run Live Demo'];
const TOKEN = 'session-token';

let nftResponse;
const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const nftCalls = () =>
  global.fetch.mock.calls.filter(([u]) => new URL(String(u), 'https://t').pathname === '/api/nft');

beforeEach(() => {
  featuresMock.demoSurfaces = false;
  nftResponse = () => json(200, { success: true, data: [], pagination: { total: 0 } });
  global.fetch = jest.fn(async (input, init = {}) => {
    const url = new URL(String(input), 'https://test.invalid');
    if (url.pathname === '/api/nft') {
      if (new Headers(init.headers).get('authorization') !== `Bearer ${TOKEN}`) {
        return json(401, { success: false, error: 'Authentication required' });
      }
      return nftResponse(url);
    }
    return json(404, { success: false, error: 'not mounted' });
  });
  setAuthToken(TOKEN);
});

afterEach(() => {
  clearAuthToken();
});

describe('NFTShowcase — demo mode OFF (default)', () => {
  it('lists real NFTs from /api/nft and shows the served minted total', async () => {
    nftResponse = () => json(200, {
      success: true,
      data: [{ id: 'nft-1', name: 'Station 42 Q3 Rainfall Model', description: 'Real minted NFT', category: 'Forecast' }],
      pagination: { limit: 6, offset: 0, total: 14, hasNext: true, hasPrev: false },
    });

    render(<NFTShowcase />);

    await waitFor(() => {
      expect(screen.getByTestId('nft-live-list')).toBeInTheDocument();
    });
    expect(screen.getByText('Station 42 Q3 Rainfall Model')).toBeInTheDocument();
    // The total comes from pagination.total (14), not from the page length (1).
    expect(screen.getByTestId('nft-live-count')).toHaveTextContent('14');
    for (const text of FABRICATED) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
    expect(screen.queryByTestId('nft-sample-banner')).not.toBeInTheDocument();
    expect(nftCalls()).toHaveLength(1);
    expect(new URL(String(nftCalls()[0][0]), 'https://t').searchParams.get('limit')).toBe('6');
  });

  it('shows an honest empty state when nothing is minted, and not-live when the API fails', async () => {
    const { unmount } = render(<NFTShowcase />);
    await waitFor(() => {
      expect(screen.getByText('No computational NFTs have been minted on the testnet yet')).toBeInTheDocument();
    });
    expect(screen.getByTestId('nft-live-count')).toHaveTextContent('0');
    unmount();

    nftResponse = () => json(503, { success: false, error: 'core4 unavailable' });
    render(<NFTShowcase />);
    await waitFor(() => {
      expect(screen.getByText('NFT listing unavailable')).toBeInTheDocument();
    });
    expect(screen.getByTestId('nft-live-count')).toHaveTextContent('—');
    for (const text of FABRICATED) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
  });

  it('a response without pagination.total is unavailable, not guessed from the page length', async () => {
    nftResponse = () => json(200, { success: true, data: [{ id: 'nft-1', name: 'One' }] });
    render(<NFTShowcase />);
    await waitFor(() => {
      expect(screen.getByText('NFT listing unavailable')).toBeInTheDocument();
    });
    expect(screen.getByTestId('nft-live-count')).toHaveTextContent('—');
  });

  it('signed out: no request, and an honest sign-in state instead of a number', async () => {
    clearAuthToken();
    render(<NFTShowcase />);
    await waitFor(() => {
      expect(screen.getAllByText('Sign in to see minted NFTs').length).toBeGreaterThan(0);
    });
    expect(screen.getByTestId('nft-live-count')).toHaveTextContent('—');
    expect(nftCalls()).toHaveLength(0);
  });

  it('signing in while mounted loads the listing with the new bearer', async () => {
    clearAuthToken();
    nftResponse = () => json(200, { success: true, data: [{ id: 'n', name: 'After sign-in' }], pagination: { total: 3 } });
    render(<NFTShowcase />);
    await waitFor(() => expect(screen.getAllByText('Sign in to see minted NFTs').length).toBeGreaterThan(0));
    await act(async () => {
      setAuthToken(TOKEN);
    });
    await waitFor(() => expect(screen.getByTestId('nft-live-count')).toHaveTextContent('3'));
    expect(screen.getByText('After sign-in')).toBeInTheDocument();
  });
});

describe('NFTShowcase — demo mode ON (explicit opt-in)', () => {
  it('renders the sample case studies only under the banner, labelled illustrative, without real-place names or integration claims', async () => {
    featuresMock.demoSurfaces = true;

    render(<NFTShowcase />);

    await waitFor(() => {
      expect(screen.getByTestId('nft-sample-banner')).toBeInTheDocument();
    });
    expect(screen.getAllByTestId('nft-sample-card-badge')).toHaveLength(3);
    expect(screen.getAllByText(/Illustrative sources \(not integrated\)/)).toHaveLength(3);
    expect(screen.getAllByText('Run sample walkthrough')).toHaveLength(3);
    expect(screen.queryByText('Miami Climate Risk Assessment')).not.toBeInTheDocument();
    expect(screen.queryByText('Run Live Demo')).not.toBeInTheDocument();
  });
});
