/**
 * @jest-environment jsdom
 *
 * The taskbar shows the wallet button only in a multi-wallet build: VITE_ENABLE_MULTI_WALLET="true" AND the
 * passkey wallet served. Any other value, or the passkey wallet off, leaves the taskbar as it is today.
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { isMultiWalletEnabled } from '../../../config/publicNavigation';

// The chip reads FEATURES; the taskbar reads the env. In a real build both come from the same two variables.
const features = { passkeyWallet: true, multiWallet: true };
await jest.unstable_mockModule('../../../config/features', () => ({ FEATURES: features, default: features }));
await jest.unstable_mockModule('../../../services/websocketService', () => ({ getWebSocketClient: () => ({ on: () => () => {}, subscribe: () => () => {} }) }));
const { default: StartMenu } = await import('../StartMenu');

const PUBLIC_ENV = { VITE_PUBLIC_READONLY_PATHS: 'true' };
const mount = env => {
  globalThis.__VITE_ENV__ = env;
  return render(<MemoryRouter initialEntries={['/']}><StartMenu darkMode toggleDarkMode={() => {}} /></MemoryRouter>);
};
afterEach(() => { cleanup(); delete globalThis.__VITE_ENV__; });

describe('taskbar wallet button', () => {
  it('flag rule: exact "true" for both, nothing else', () => {
    expect(isMultiWalletEnabled('true', 'true')).toBe(true);
    for (const [passkey, multi] of [['true', undefined], ['true', 'false'], ['true', '1'], ['true', 'TRUE'], [undefined, 'true'], ['false', 'true']]) {
      expect(isMultiWalletEnabled(passkey, multi)).toBe(false);
    }
  });

  it('on: the wallet button is in the taskbar', async () => {
    mount({ ...PUBLIC_ENV, VITE_ENABLE_PASSKEY_WALLET: 'true', VITE_ENABLE_MULTI_WALLET: 'true' });
    // The button is a lazy chunk (it pulls in the wallet context), so allow it time to load.
    expect(await screen.findByTestId('wallet-chip', {}, { timeout: 20_000 })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Taskbar' })).toHaveClass('taskbar--wallet');
  }, 30_000);

  it.each([
    ['flag unset', { ...PUBLIC_ENV, VITE_ENABLE_PASSKEY_WALLET: 'true' }],
    ['passkey wallet off', { ...PUBLIC_ENV, VITE_ENABLE_MULTI_WALLET: 'true' }],
  ])('%s: the taskbar is unchanged', async (_name, env) => {
    mount(env);
    await Promise.resolve();
    expect(screen.queryByTestId('wallet-chip')).toBeNull();
    expect(screen.getByRole('navigation', { name: 'Taskbar' })).not.toHaveClass('taskbar--wallet');
  });
});
