/** @jest-environment jsdom */
//
// Fabricated-surface containment. (frontend#214)
//
// TWO SEPARATE QUESTIONS, TESTED SEPARATELY — because conflating them is how the
// original #214 inventory nearly sent someone to fix the wrong files:
//
//   1. Does the component actually RENDER fabricated content?  -> direct render
//   2. Can a user REACH it in a default build?                 -> route traversal
//
// (1) alone proves nothing about exposure: `DataExplorer` carries 22 mock markers
// and is unreachable, so fixing it would have been wasted work. (2) alone proves
// nothing about fabrication: a declared route to an honest page is fine.
//
// The traversal in (2) is the technique from launchReadinessRetirement.test.jsx,
// which is proven to work here. An earlier version of this file tried to assert
// reachability by rendering the whole route tree through <Routes>; it produced an
// empty body and would have "passed" by rendering nothing, so it was replaced.
import { jest } from '@jest/globals';
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import StationOfTheDay from '../../components/Leaderboard/StationOfTheDay';

// ---------------------------------------------------------------------------
// 1. FABRICATION — proven by rendering the component itself.
// ---------------------------------------------------------------------------
describe('fabrication (direct render)', () => {
  it('StationOfTheDay direct default discloses unavailable awards without sample data', () => {
    render(<MemoryRouter><StationOfTheDay /></MemoryRouter>);
    // The illustrative corpus remains behind the leaf's explicit demo gate.
    expect(document.body.textContent).toContain('Station awards unavailable.');
    expect(document.body.textContent).not.toContain('Eagle Ridge Observatory');
  });
});

// ---------------------------------------------------------------------------
// 2. CONTAINMENT — the route must be absent unless demoSurfaces is explicitly on.
//
// Every OTHER flag is mocked ON, deliberately: with flags off the routes never
// enter the tree and an absence assertion passes vacuously. #268 found exactly
// that bug in the sibling guard, where 11 of 24 routes were invisible to a guard
// whose whole job was asserting absence.
// ---------------------------------------------------------------------------
const GATED_PATH = '/leaderboard/station-of-the-day';

function collectPaths(node, paths = []) {
  if (!React.isValidElement(node)) return paths;
  if (typeof node.props.path === 'string') paths.push(node.props.path);
  React.Children.forEach(node.props.children, child => collectPaths(child, paths));
  return paths;
}

async function pathsWithDemoSurfaces(demoSurfaces) {
  jest.resetModules();
  jest.unstable_mockModule('../../config/features', () => {
    const flags = new Proxy({ demoSurfaces }, {
      get: (target, prop) => (prop in target ? target[prop] : true),
    });
    return { default: flags, FEATURES: flags };
  });
  const { default: communityRoutes } = await import('../communityRoutes');
  return collectPaths(communityRoutes({ isFeatureEnabled: () => true }));
}

describe('containment (route traversal)', () => {
  it('is NOT reachable when demoSurfaces is false — the default', async () => {
    const paths = await pathsWithDemoSurfaces(false);
    // Guard against a vacuous pass: the sibling leaderboard routes must still be
    // present, or "absent" would just mean the tree failed to build.
    expect(paths).toContain('/leaderboard');
    expect(paths).toContain('/leaderboard/nearby');
    expect(paths).not.toContain(GATED_PATH);
  });

  it('IS reachable when demoSurfaces is explicitly enabled', async () => {
    const paths = await pathsWithDemoSurfaces(true);
    expect(paths).toContain(GATED_PATH);
  });
});
