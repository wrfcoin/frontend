/** @jest-environment jsdom */
// frontend#415: three station views call backend routes that have no handler
// (/api/leaderboard/profile/:id/*, /api/weather/stations/nearby,
// /api/weather/intelligence/*). In the default build (demoSurfaces off) each
// must render the honest not-live state and make no request. Every other flag is
// mocked ON so the routes are in the tree and absence cannot pass vacuously.
import React, { Suspense } from 'react';
import { jest } from '@jest/globals';
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const flags = { demoSurfaces: false };
const features = new Proxy(flags, { get: (t, p) => (p in t ? t[p] : true) });
await jest.unstable_mockModule('../../config/features', () => ({
  default: features,
  FEATURES: features,
  isMvpMode: () => false,
}));
const { default: communityRoutes } = await import('../communityRoutes');
const { default: CoverageGapMap } = await import('../../components/WeatherIntelligence');

function routes(node, out = new Map()) {
  if (!React.isValidElement(node)) return out;
  if (node.props.path) out.set(node.props.path, node.props.element);
  React.Children.forEach(node.props.children, n => routes(n, out));
  return out;
}

async function renderRoute(path) {
  const tree = routes(communityRoutes({ isFeatureEnabled: () => true }));
  expect(tree.has('/leaderboard')).toBe(true);
  expect(tree.has(path)).toBe(true);
  await act(async () => {
    render(<MemoryRouter><Suspense fallback={null}>{tree.get(path)}</Suspense></MemoryRouter>);
  });
}

beforeEach(() => {
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({}) }));
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  flags.demoSurfaces = false;
  jest.restoreAllMocks();
});

describe('default build (demoSurfaces=false)', () => {
  it.each([
    ['/leaderboard/profile/:address', 'contributor-profile'],
    ['/leaderboard/nearby', 'nearby-stations'],
  ])('%s traverses to the not-live state and requests nothing', async (path, id) => {
    await renderRoute(path);
    expect(await screen.findByTestId(`${id}-not-live`)).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('CoverageGapMap renders the not-live state and requests nothing', async () => {
    await act(async () => {
      render(<MemoryRouter><CoverageGapMap /></MemoryRouter>);
    });
    expect(await screen.findByTestId('coverage-gap-map-not-live')).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('demo build (demoSurfaces=true)', () => {
  it('the contributor profile route mounts the sample under a Sample data badge', async () => {
    flags.demoSurfaces = true;
    await renderRoute('/leaderboard/profile/:address');
    expect(await screen.findByTestId('contributor-profile-sample-badge')).toBeTruthy();
  });
});
