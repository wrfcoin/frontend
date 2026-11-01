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
  PASSKEY_WALLET_NAV_ENTRY,
  allPublicPolicyPaths,
  publicNavEntriesFor,
  publicNonMenuPathsFor,
} from '../../../config/publicNavigation';

const PUBLIC_ENV = { VITE_PUBLIC_READONLY_PATHS: 'true' };
const PASSKEY_ENV = { ...PUBLIC_ENV, VITE_ENABLE_PASSKEY_WALLET: 'true' };
const ALL_ENTRIES = [...PUBLIC_NAV_ENTRIES, PASSKEY_WALLET_NAV_ENTRY];
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
    .map(el => ALL_ENTRIES.find(e => `start-menu-item-${e.name}` === el.dataset.testid)?.path);

describe('StartMenu in the public build', () => {
  it('shows every main public route, and every rendered item passes the public predicate', () => {
    openMenu(PUBLIC_ENV);
    const items = screen.getAllByTestId(/^start-menu-item-/);
    const names = items.map(el => el.dataset.testid.replace('start-menu-item-', ''));
    expect(names).toEqual([
      'Home', 'Get started', 'Weather map', 'Explore', 'Nodes', 'Forecasters', 'Competition', 'Challenges', 'Duels', 'Search',
      'Leaderboard', 'Governance', 'Forecast', 'Forecast check', 'Wallet', 'Connect a station', 'Downloads', 'Terms', 'Privacy', 'API terms', 'Security',
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

  it.each([false, true])('with the passkey flag %s, every route the policy admits is exactly one of: a menu entry, or explicitly excluded', (passkeyOn) => {
    const entryPaths = new Set(publicNavEntriesFor(passkeyOn).map(e => e.path));
    const nonMenu = publicNonMenuPathsFor(passkeyOn);
    for (const path of allPublicPolicyPaths()) {
      expect([entryPaths.has(path), path in nonMenu]).toContain(true);
      expect(entryPaths.has(path) && path in nonMenu).toBe(false);
    }
    // Flag off: the passkey page is listed as a non-menu route. Flag on: it is a menu entry instead.
    expect('/wallet/passkey' in nonMenu).toBe(!passkeyOn);
    expect(entryPaths.has('/wallet/passkey')).toBe(passkeyOn);
    expect(publicNonMenuPathsFor(false)).toBe(PUBLIC_NON_MENU_PATHS);
    // The helper must not drift from the policy sets themselves.
    expect(new Set(allPublicPolicyPaths())).toEqual(
      new Set(['/', '/terms', '/privacy', '/api-terms', '/security', '/downloads', ...PUBLIC_READONLY_PATHS, ...PUBLIC_ONBOARDING_PATHS]),
    );
  });
});

describe('StartMenu with the passkey wallet flag', () => {
  it('flag on: shows "Passkey wallet" right after "Wallet", linking to /wallet/passkey', () => {
    openMenu(PASSKEY_ENV);
    const names = screen.getAllByTestId(/^start-menu-item-/).map(el => el.dataset.testid.replace('start-menu-item-', ''));
    expect(names.slice(names.indexOf('Wallet'), names.indexOf('Wallet') + 3)).toEqual(['Wallet', 'Passkey wallet', 'Connect a station']);
    const paths = renderedPaths();
    expect(paths).toContain('/wallet/passkey');
    for (const path of paths) expect(isPublicTestnetPath(path, false, true, false)).toBe(true);
    expect(PASSKEY_WALLET_NAV_ENTRY).toEqual({
      name: 'Passkey wallet', path: '/wallet/passkey', icon: 'bi-fingerprint', group: 'main',
      description: 'A wallet unlocked with your fingerprint, face or a YubiKey; free test coins built in.',
    });
  });

  it.each([{}, { VITE_ENABLE_PASSKEY_WALLET: 'false' }, { VITE_ENABLE_PASSKEY_WALLET: 'TRUE' }])('flag not exactly "true" (%o): no passkey entry', (extra) => {
    openMenu({ ...PUBLIC_ENV, ...extra });
    expect(screen.queryByTestId('start-menu-item-Passkey wallet')).not.toBeInTheDocument();
    expect(renderedPaths()).not.toContain('/wallet/passkey');
  });

  it('flag on without the read-only flag: still no passkey entry (the route policy does not admit it)', () => {
    openMenu({ VITE_ENABLE_PASSKEY_WALLET: 'true' });
    expect(renderedPaths()).toEqual(['/', '/downloads', '/terms', '/privacy', '/api-terms', '/security']);
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
