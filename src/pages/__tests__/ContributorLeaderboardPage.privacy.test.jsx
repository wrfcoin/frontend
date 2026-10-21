/** @jest-environment jsdom */
/**
 * backend#1361: the public leaderboard sends short addresses and an opaque profileKey. The page must
 * link to the key, never build a link from a short address, and never show a full address.
 */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';

const state = { entries: [], account: null };

await jest.unstable_mockModule('react-router-dom', () => ({
  Link: ({ to, children, className }) => <a href={to} className={className}>{children}</a>,
}));
await jest.unstable_mockModule('../../contexts/WalletContext.jsx', () => ({
  useOptionalWallet: () => ({ account: state.account }),
}));
// These tests cover the operator build (profile and impact links reachable); the public build is in
// ContributorLeaderboardPage.public.test.jsx.
globalThis.__VITE_ENV__ = { VITE_ENABLE_FULL_STUDIO: 'true' };
await jest.unstable_mockModule('../../hooks/useWeatherLeaderboard', () => ({
  LEADERBOARD_REGIONS: ['Global'],
  useWeatherLeaderboard: () => ({ entries: state.entries, loading: false, error: null, updatedAt: null }),
}));
await jest.unstable_mockModule('../../config/features', () => ({ FEATURES: { leaderboardRegions: false } }));

const { default: ContributorLeaderboardPage } = await import('../ContributorLeaderboardPage');

const KEY_A = 'c_0123456789abcdef01234567';
const KEY_B = 'c_89abcdef0123456789abcdef';
const entry = (over) => ({
  rank: 1, displayName: 'Alice', value: 90, badgeLevel: 'gold', country: null, city: null,
  walletAddress: '0xa1a1…a1a1', profileKey: KEY_A, isYou: false, ...over,
});

afterEach(cleanup);

describe('ContributorLeaderboardPage with short addresses', () => {
  test('links each row to its opaque key and shows only the short address', () => {
    state.account = null;
    state.entries = [entry({}), entry({ rank: 2, displayName: 'Bob', walletAddress: '0xb2b2…b2b2', profileKey: KEY_B })];
    const { container } = render(<ContributorLeaderboardPage />);
    const hrefs = [...container.querySelectorAll('a.lb-contributor-link')].map(a => a.getAttribute('href'));
    expect(hrefs).toEqual([`/impact/${KEY_A}`, `/impact/${KEY_B}`]);
    expect(container.textContent).toContain('0xa1a1…a1a1');
    expect(container.innerHTML).not.toMatch(/(?:0x|wrf)[0-9a-f]{40}/i);
  });

  test('a row without a key and with only a short address is not a link at all', () => {
    state.account = null;
    state.entries = [entry({ profileKey: null })];
    const { container } = render(<ContributorLeaderboardPage />);
    expect(container.querySelectorAll('a.lb-contributor-link')).toHaveLength(0);
    expect(container.querySelector('span.lb-contributor-link').textContent).toContain('Alice');
  });

  test('a full address from the server (operator or own row) still links, by key when present', () => {
    state.account = null;
    const full = '0xa1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1';
    state.entries = [entry({ walletAddress: full, profileKey: null })];
    const { container } = render(<ContributorLeaderboardPage />);
    expect(container.querySelector('a.lb-contributor-link').getAttribute('href')).toBe(`/impact/${full}`);
  });

  test('"you" comes from the verified isYou only; a short-form match is not proof', () => {
    state.account = '0xB2B2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2';
    state.entries = [entry({}), entry({ rank: 2, displayName: 'Bob', walletAddress: '0xb2b2\u2026b2b2', profileKey: KEY_B })];
    const { container } = render(<ContributorLeaderboardPage />);
    expect(container.querySelector('tr.lb-row--user')).toBeNull();
    expect(screen.queryByText('you')).toBeNull();
    // ...and the ambiguous match also withholds the "not in top 25" claim
    expect(container.querySelector('tr.lb-row--pinned')).toBeNull();

    cleanup();
    state.account = null;
    state.entries = [entry({ isYou: true })];
    const second = render(<ContributorLeaderboardPage />);
    expect(second.container.querySelector('tr.lb-row--user')).not.toBeNull();
  });

  test('COLLISION: a connected full address never marks ANOTHER full wallet with the same short form as "you"', () => {
    const mine = `0xa1a1${'11'.repeat(16)}a1a1`;
    const other = `0xa1a1${'22'.repeat(16)}a1a1`;
    state.account = mine;
    state.entries = [entry({ walletAddress: other, profileKey: null, isYou: false })];
    const { container } = render(<ContributorLeaderboardPage />);
    // the OTHER wallet's real row is neither styled nor labelled as the viewer's (the pinned row is the viewer's own)
    expect(container.querySelector('tr.lb-row--user:not(.lb-row--pinned)')).toBeNull();
    expect(screen.queryByText('you')).toBeNull();
    // the same two addresses are NOT ambiguous (both full and different): the pinned row is shown
    expect(container.querySelector('tr.lb-row--pinned')).not.toBeNull();
  });

  test('an old-backend row with the connected FULL address is still recognised exactly', () => {
    const mine = `0xa1a1${'11'.repeat(16)}a1a1`;
    state.account = mine.toUpperCase().replace('0X', '0x');
    state.entries = [entry({ walletAddress: mine, profileKey: null })];
    const { container } = render(<ContributorLeaderboardPage />);
    expect(container.querySelector('tr.lb-row--user')).not.toBeNull();
    expect(container.querySelector('tr.lb-row--pinned')).toBeNull();
  });

  test('no match at all: the pinned "not in top 25" row is shown', () => {
    state.account = '0xc3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3';
    state.entries = [entry({})];
    const { container } = render(<ContributorLeaderboardPage />);
    expect(container.querySelector('tr.lb-row--pinned')).not.toBeNull();
  });
});
