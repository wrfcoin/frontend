/**
 * @jest-environment jsdom
 *
 * S0: the public build's start menu lists every public menu-worthy route, each
 * one passes the route policy predicate, and no hidden route appears. The
 * studio build keeps its existing menu.
 */
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from '@jest/globals';
import '@testing-library/jest-dom';
import StartMenu from '../StartMenu';
import {
  PUBLIC_READONLY_PATHS,
  PUBLIC_ONBOARDING_PATHS,
  isPublicTestnetPath,
} from '../../../config/contractSurfacePolicy';
import {
  PUBLIC_NON_MENU_PATHS,
  PUBLIC_NAV_ENTRIES,
  allPublicPolicyPaths,
} from '../../../config/publicNavigation';

const PUBLIC_ENV = { VITE_PUBLIC_READONLY_PATHS: 'true' };
const HIDDEN = [
  '/dashboard',
  '/oracle',
  '/governance',
  '/wallet/send',
  '/fleet',
  '/weather/dashboard',
  '/earnings',
  '/partners',
  '/developer',
];

afterEach(() => {
  cleanup();
  delete globalThis.__VITE_ENV__;
});

function openMenu(env) {
  globalThis.__VITE_ENV__ = env;
  render(
    <MemoryRouter>
      <StartMenu darkMode={false} toggleDarkMode={() => {}} />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByText('Start'));
}

const renderedPaths = () =>
  screen
    .getAllByTestId(/^start-menu-item-/)
    .map(el => PUBLIC_NAV_ENTRIES.find(e => `start-menu-item-${e.name}` === el.dataset.testid)?.path);

describe('StartMenu in the public build', () => {
  it('shows every main public route, and every rendered item passes the public predicate', () => {
    openMenu(PUBLIC_ENV);
    const items = screen.getAllByTestId(/^start-menu-item-/);
    const names = items.map(el => el.dataset.testid.replace('start-menu-item-', ''));
    expect(names).toEqual([
      'Home', 'Get started', 'Weather map', 'Explore', 'Search',
      'Leaderboard', 'Governance', 'Forecast', 'Wallet', 'Connect a station', 'Downloads', 'Terms', 'Privacy', 'API terms', 'Security',
    ]);
    const paths = renderedPaths();
    expect(paths).not.toContain(undefined);
    for (const path of paths) {
      expect(isPublicTestnetPath(path, false, true, false)).toBe(true);
    }
    for (const required of ['/', '/map', '/explore', '/search',
      '/leaderboard/contributors', '/wallet', '/onboarding', '/connect-station',
      '/terms', '/privacy', '/security']) {
      expect(paths).toContain(required);
    }
  });

  it('never shows a hidden route or a studio section', () => {
    openMenu(PUBLIC_ENV);
    const paths = renderedPaths();
    for (const hidden of HIDDEN) expect(paths).not.toContain(hidden);
    // /explorer only redirects to /explore: one menu entry for one page (frontend#561).
    expect(paths).not.toContain('/explorer');
    expect(paths.filter(path => path === '/explore')).toHaveLength(1);
    expect(screen.queryByText('Mission Control')).not.toBeInTheDocument();
    expect(screen.queryByText('Weather Hub')).not.toBeInTheDocument();
  });

  it('without the read-only flag, shows only core routes (no unreachable link)', () => {
    openMenu({});
    const paths = renderedPaths();
    expect(paths).toEqual(['/', '/downloads', '/terms', '/privacy', '/api-terms', '/security']);
    for (const path of paths) expect(isPublicTestnetPath(path, false, false, false)).toBe(true);
  });

  it('every route the policy admits is a menu entry or explicitly excluded', () => {
    const entryPaths = new Set(PUBLIC_NAV_ENTRIES.map(e => e.path));
    for (const path of allPublicPolicyPaths()) {
      expect(entryPaths.has(path) || path in PUBLIC_NON_MENU_PATHS).toBe(true);
    }
    // The helper must not drift from the policy sets themselves.
    expect(new Set(allPublicPolicyPaths())).toEqual(
      new Set(['/', '/terms', '/privacy', '/api-terms', '/security', '/downloads', ...PUBLIC_READONLY_PATHS, ...PUBLIC_ONBOARDING_PATHS]),
    );
  });
});

describe('StartMenu in the full-studio build', () => {
  it('keeps the existing studio menu', () => {
    openMenu({ VITE_ENABLE_FULL_STUDIO: 'true', VITE_PUBLIC_READONLY_PATHS: 'true' });
    expect(screen.getByTestId('start-menu-item-Weather Hub')).toBeInTheDocument();
    expect(screen.getByTestId('start-menu-item-Weather Map')).toBeInTheDocument();
    expect(screen.queryByTestId('start-menu-item-Explore')).not.toBeInTheDocument();
  });
});
