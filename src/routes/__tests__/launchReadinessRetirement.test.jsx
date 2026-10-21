/** @jest-environment node */
import { readFileSync } from 'node:fs';

import { jest } from '@jest/globals';
import React from 'react';

// Mock every feature flag ON, not off.
//
// With `default: {}` each `{FEATURES.x && <Route .../>}` in weatherRoutes.jsx is
// falsy and never enters the tree, so the traversal below saw only 13 of the 24
// declared routes. Eleven routes were invisible to a guard whose whole job is to
// assert that certain routes are absent -- and a path the guard cannot see is a
// path it always passes. Feature-gating is how routes are normally added in this
// file, so that was precisely the reintroduction route the guard had to cover.
jest.unstable_mockModule('../../config/features', () => ({
  default: new Proxy({}, { get: () => true }),
  FEATURES: new Proxy({}, { get: () => true }),
  isMvpMode: () => false,
}));

const { default: weatherRoutes } = await import('../weatherRoutes');
const { default: platformRoutes } = await import('../platformRoutes');

const retiredPaths = [
  '/dead-preview',
  '/forgotten-preview',
  '/data/explore',
  '/station/analytics',
  '/station/seasonal',
  '/station/environmental',
  '/station/contributions',
  '/station/benchmarks',
  '/station/peers',
  '/weather/coverage',
  '/weather/impact',
  '/weather/accuracy',
  '/weather/alerts',
  '/weather/growth',
  '/field/queue',
  '/field/entry',
  '/field/sync',
  '/field/cache',
  '/field/map',
];

function collectRoutePaths(node, paths = []) {
  if (!React.isValidElement(node)) return paths;

  if (typeof node.props.path === 'string') paths.push(node.props.path);
  React.Children.forEach(node.props.children, child => collectRoutePaths(child, paths));
  return paths;
}

describe('launch-readiness route retirement', () => {
  // Positive control.
  //
  // Every other assertion in this file is a `not.toContain`, which passes
  // trivially against an empty collection. If `collectRoutePaths` ever returns
  // `[]` -- a move to `createBrowserRouter`, a change in how children nest, a
  // mock that throws -- all seventeen retired paths would still "pass" while
  // proving nothing at all. This is the assertion that goes red in that case,
  // so the guard fails loudly instead of silently.
  it('collects a populated route tree (guards the guard)', () => {
    const paths = [...collectRoutePaths(weatherRoutes()), ...collectRoutePaths(platformRoutes())];

    expect(paths.length).toBeGreaterThan(20);
    expect(paths).toContain('/weather/dashboard');
    expect(paths).toContain('/developer');
  });

  it('does not expose retired synthetic routes in the runtime route tree', () => {
    const paths = [...collectRoutePaths(weatherRoutes()), ...collectRoutePaths(platformRoutes())];

    for (const path of retiredPaths) {
      expect(paths).not.toContain(path);
    }
  });

  it('does not advertise retired routes as owned surfaces', () => {
    const ownership = readFileSync(
      'src/ROUTE_OWNERSHIP.md',
      'utf8',
    );

    for (const path of retiredPaths) {
      expect(ownership).not.toContain(`\`${path}\``);
    }
  });

  it('does not link retired routes from the start menu or page navigation', () => {
    for (const file of [
      'src/components/Navigation/StartMenu.jsx',
      'src/hooks/usePageNavigation.js',
    ]) {
      const source = readFileSync(file, 'utf8');
      for (const path of retiredPaths) {
        expect(source).not.toContain(`'${path}'`);
      }
    }
  });
});
