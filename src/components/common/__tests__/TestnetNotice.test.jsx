import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { jest } from '@jest/globals';
import TestnetNotice, { TestnetChip } from '../TestnetNotice';
import { DISMISSAL_KEY, WORDING_VERSION, resetDismissalCache } from '../testnetDisclaimerStore';

const DISCLAIMER = '/testnet-disclaimer.html';

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); resetDismissalCache(); });
afterEach(() => { cleanup(); jest.restoreAllMocks(); });

test('keeps the required meaning in one compact line and links the canonical disclaimer', () => {
  render(<TestnetNotice />);
  const banner = screen.getByRole('complementary', { name: 'Testnet expectations' });
  expect(banner).toHaveTextContent('Test network.');
  expect(banner).toHaveTextContent('Coins have no monetary value and the chain may be reset without notice.');
  expect(banner).toHaveTextContent('Read the testnet disclaimer');
  // the phone wording carries the same meaning (it is swapped in by CSS below 600 px)
  expect(banner).toHaveTextContent('Coins have no monetary value and may be reset without notice.');
  for (const link of screen.getAllByRole('link')) expect(link).toHaveAttribute('href', DISCLAIMER);
  expect(banner.querySelector('p').textContent.length).toBeLessThan(220);
});

test('dismissal is remembered on this device across remounts and shows the taskbar chip', () => {
  const first = render(<><TestnetNotice /><TestnetChip /></>);
  expect(screen.queryByTestId('testnet-chip')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /Dismiss/ }));
  expect(screen.queryByRole('complementary')).toBeNull();
  expect(screen.getByTestId('testnet-chip')).toHaveAttribute('href', DISCLAIMER);
  expect(localStorage.getItem(DISMISSAL_KEY)).toBe(WORDING_VERSION);
  first.unmount();
  resetDismissalCache();
  render(<><TestnetNotice /><TestnetChip /></>);
  expect(screen.queryByRole('complementary')).toBeNull();
  expect(screen.getByTestId('testnet-chip')).toBeVisible();
});

test('a dismissal recorded for older wording does not hide the new wording', () => {
  localStorage.setItem(DISMISSAL_KEY, '1');
  render(<TestnetNotice />);
  expect(screen.getByRole('complementary')).toBeVisible();
});

test('works when storage is unavailable: the banner shows, dismissal still hides it for this visit', () => {
  const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  render(<TestnetNotice />);
  expect(screen.getByRole('complementary')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: /Dismiss/ }));
  expect(screen.queryByRole('complementary')).toBeNull();
  expect(getItem).toHaveBeenCalled();
  expect(setItem).toHaveBeenCalled();
});

test('the global app shell mounts the notice outside page content and the taskbar carries the chip', () => {
  const app = readFileSync('src/App.jsx', 'utf8');
  expect(app).toContain('import TestnetNotice from \'./components/common/TestnetNotice\';');
  expect(app).toMatch(/<TestnetNotice \/>\s*<AppContent \/>/);
  const taskbar = readFileSync('src/components/Navigation/StartMenu.jsx', 'utf8');
  expect(taskbar).toContain('<TestnetChip />');
});

test('the canonical public document is bundled for invitees', () => {
  const page = readFileSync('public/testnet-disclaimer.html', 'utf8');
  expect(page).toContain('It may be reset without notice.');
  expect(page).toContain('Balances and tokens have no monetary value.');
  expect(page).toContain('No migration to mainnet is promised or implied.');
  expect(page).toContain('Please attach no production bridges, exchange listings or irreplaceable assets.');
  expect(page).toContain('attacked on a schedule.');
  expect(page).toContain('Generated from core4/docs/TESTNET_DISCLAIMER.md; sha256=');
});
