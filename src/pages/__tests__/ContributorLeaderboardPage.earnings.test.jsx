/** @jest-environment jsdom */
/**
 * backend#1456: the contributor leaderboard opens on chain earnings, shows exact WRF from base units
 * (BigInt, never Number), and shows "unavailable" + Retry instead of a partial list. #1361 rules hold.
 */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const state = { entries: [], account: null, unavailable: false, error: null, calls: [], refetch: jest.fn(), regionsEnabled: false };

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
  LEADERBOARD_REGIONS: ['Global', 'Europe'],
  useWeatherLeaderboard: (opts) => {
    state.calls.push(opts);
    return { entries: state.entries, loading: false, error: state.error, unavailable: state.unavailable, updatedAt: null, refetch: state.refetch };
  },
}));
await jest.unstable_mockModule('../../config/features', () => ({ FEATURES: { get leaderboardRegions() { return state.regionsEnabled; } } }));
const { default: Page } = await import('../ContributorLeaderboardPage');

const KEY = 'c_0123456789abcdef01234567';
const entry = (over) => ({
  rank: 1, displayName: 'Tony', value: 15.24, badgeLevel: 'bronze', country: null, city: null,
  walletAddress: '0xd4d4…d4d4', profileKey: KEY, isYou: false,
  earningsBaseUnits: '1524000000', earningsWrf: '15.24', ...over,
});
beforeEach(() => { state.entries = []; state.account = null; state.unavailable = false; state.error = null; state.calls = []; state.refetch = jest.fn(); state.regionsEnabled = false; });
afterEach(cleanup);

test('opens on the earnings metric and shows a WRF column', () => {
  state.entries = [entry()];
  const { container } = render(<Page />);
  expect(state.calls[0].metric).toBe('earnings');
  expect(screen.getByRole('tab', { name: /earnings/i }).getAttribute('aria-selected')).toBe('true');
  expect(screen.getByText('WRF earned (lifetime)')).toBeTruthy();
  expect(container.querySelector('td.lb-td--num').textContent).toBe('15.24 WRF');
});

test('amounts are exact base units: 1 base unit and > 2^53 do not round', () => {
  state.entries = [
    entry({ earningsBaseUnits: '9007199254740993', earningsWrf: '90071992.54740993', profileKey: 'c_a' }),
    entry({ rank: 2, earningsBaseUnits: '1', earningsWrf: '0.00000001', profileKey: 'c_b' }),
  ];
  const { container } = render(<Page />);
  const cells = [...container.querySelectorAll('td.lb-td--num')].map(c => c.textContent).filter(t => /WRF/.test(t));
  expect(cells).toEqual(['90,071,992.54740993 WRF', '0.00000001 WRF']);
});

test('unavailable shows the notice and Retry, never rows or an empty-list message', () => {
  state.unavailable = true;
  state.entries = [entry()];
  render(<Page />);
  expect(screen.getByText(/unavailable/i)).toBeTruthy();
  expect(screen.queryByText('Tony')).toBeNull();
  expect(screen.queryByText(/No contributors found/)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /retry/i }));
  expect(state.refetch).toHaveBeenCalled();
});

test('other tabs keep working and ask for their own metric with the period', () => {
  state.entries = [entry({ value: 90 })];
  render(<Page />);
  fireEvent.click(screen.getByRole('tab', { name: 'Readings' }));
  expect(state.calls.at(-1)).toMatchObject({ metric: 'submissions', period: '7d' });
});

test('regions ON lets non-earnings tabs select a region but never filters earnings', () => {
  state.regionsEnabled = true;
  render(<Page />);
  expect(screen.queryByRole('combobox', { name: 'Region' })).toBeNull();
  expect(state.calls.at(-1).region).toBeUndefined();
  fireEvent.click(screen.getByRole('tab', { name: 'Readings' }));
  fireEvent.change(screen.getByRole('combobox', { name: 'Region' }), { target: { value: 'Europe' } });
  expect(state.calls.at(-1)).toMatchObject({ metric: 'submissions', region: 'Europe' });
  fireEvent.click(screen.getByRole('tab', { name: 'Earnings' }));
  expect(screen.queryByRole('combobox', { name: 'Region' })).toBeNull();
  expect(state.calls.at(-1)).toMatchObject({ metric: 'earnings', region: undefined });
});

test('regions ON renders location only when the API supplies it', () => {
  state.regionsEnabled = true;
  state.entries = [entry({ country: 'FR', city: 'Paris' })];
  const { rerender } = render(<Page />);
  expect(screen.getByRole('columnheader', { name: /location/i })).toBeTruthy();
  expect(screen.getByRole('cell', { name: /Paris\s*,\s*FR/ })).toBeTruthy();
  state.entries = [entry()];
  rerender(<Page />);
  expect(screen.queryByRole('columnheader', { name: /location/i })).toBeNull();
});

test('#1361: short address + profileKey link; full address only on the caller own row', () => {
  const full = '0xd4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4';
  state.entries = [entry(), entry({ rank: 2, displayName: 'Me', walletAddress: full, isYou: true, profileKey: 'c_me' })];
  const { container } = render(<Page />);
  const hrefs = [...container.querySelectorAll('a.lb-contributor-link')].map(a => a.getAttribute('href'));
  expect(hrefs).toEqual([`/impact/${KEY}`, '/impact/c_me']);
  expect(container.querySelectorAll('tr.lb-row--user')).toHaveLength(1);
});

test('a failed earnings read that is not flagged unavailable (error only) still shows unavailable + Retry: no empty copy, no pinned own row', () => {
  state.error = 'HTTP 500';
  state.entries = [];
  state.account = '0xc3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3';
  const { container } = render(<Page />);
  expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy();
  expect(screen.getByText(/unavailable/i)).toBeTruthy();
  expect(screen.queryByText(/No contributor has earned/)).toBeNull();
  expect(container.querySelector('tr.lb-row--pinned')).toBeNull();
  expect(container.textContent).not.toMatch(/not among the top 25/);
});

describe.each([['submissions', 'Readings'], ['quality_score', 'Quality'], ['streak', 'Streak']])(
  'a failed read on the %s tab',
  (_metric, tabName) => {
    test('shows the error with Retry, never the empty copy or the pinned own row', () => {
      state.error = 'HTTP 500';
      state.entries = [];
      state.account = '0xc3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3';
      const { container } = render(<Page />);
      fireEvent.click(screen.getByRole('tab', { name: tabName }));
      expect(screen.getByText(/HTTP 500/)).toBeTruthy();
      expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy();
      expect(screen.queryByText(/No contributors found/)).toBeNull();
      expect(container.querySelector('tr.lb-row--pinned')).toBeNull();
      expect(container.textContent).not.toMatch(/not in top 25/);
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));
      expect(state.refetch).toHaveBeenCalled();
    });
  },
);
