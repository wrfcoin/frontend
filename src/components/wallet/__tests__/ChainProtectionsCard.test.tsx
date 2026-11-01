/** @jest-environment jsdom */
import React from 'react';
import { jest, beforeEach, afterEach, it, expect } from '@jest/globals';
import { render, screen, fireEvent, waitFor, cleanup, act, within } from '@testing-library/react';

const owner = `0x${'1'.repeat(40)}`;
const a3 = `0x${'3'.repeat(40)}`;
const a5 = `0x${'5'.repeat(40)}`;
const submitAllowlistAction = jest.fn<(...args: unknown[]) => Promise<void>>();
const enableSecurityKey = jest.fn<(...args: unknown[]) => Promise<void>>();
await jest.unstable_mockModule('../../../services/walletCrypto/protectionActions', () => ({
  submitAllowlistAction, enableSecurityKey, addSecurityKey: jest.fn(), cancelSecurityKeyEscape: jest.fn(),
}));
await jest.unstable_mockModule('../../../services/walletCrypto/useChainProtections', () => {
  const { useEffect, useState } = React;
  return {
    useChainProtections: () => null,
    useNow: (active: boolean) => {
      const [now, setNow] = useState(() => Date.now());
      useEffect(() => { if (!active) return undefined; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [active]);
      return now;
    },
  };
});
await jest.unstable_mockModule('../../../services/addressBook/useAddressBook', () => ({
  useAddressBook: () => ({ book: { version: 1, contacts: [{ id: '1', name: 'Mom', address: a5, createdAt: 0, allowedFrom: 0 }], allowlist: { enabled: false, disableAt: null } } }),
}));
const { ChainProtectionsView } = await import('../ChainProtectionsCard');

const T0 = 1_800_000_000_000;
const skStatus = (over = {}) => ({
  address: owner, next_height: 1000, feature_active_at_next_height: true, next_nonce: 0, generation: 0, required_to_spend: false,
  keys: [], escape_delay_blocks: null, pending_escape: null, escape_matured: false, ...over,
});
const alRead = (over = {}) => ({
  feature_active_next_height: true, observed_at_height: 999,
  allowlist: {
    account: owner, next_action_nonce: 2, in_force: true, at_height: 1000, add_delay_blocks: 2244, enabled_at_height: 10,
    allowed: [a5], pending_additions: [{ address: a3, requested_at_height: 1000, effective_at_height: 3244 }],
    pending_disable: null, requests_blocked_until_height: null, ...over,
  },
});
const protections = (over: Record<string, unknown> = {}) => ({
  securityKey: skStatus(), allowlist: alRead(), fetchedAt: T0, loading: false, reload: jest.fn(async () => {}), ...over,
}) as any;

beforeEach(() => { cleanup(); submitAllowlistAction.mockReset().mockResolvedValue(undefined); enableSecurityKey.mockReset().mockResolvedValue(undefined); jest.useFakeTimers({ now: T0 }); });
afterEach(() => { jest.useRealTimers(); });

it('shows nothing at all while neither feature is active on chain (visitors never see a control)', () => {
  const { container } = render(<ChainProtectionsView owner={owner} protections={protections({ securityKey: null, allowlist: null })} />);
  expect(container.innerHTML).toBe('');
});

it('YubiKey: states the 7-day escape and the 2-key limit, and asks for the password before turning on', async () => {
  render(<ChainProtectionsView owner={owner} protections={protections({ allowlist: null })} />);
  expect(screen.getByTestId('security-key-escape').textContent).toContain('7-day wait');
  expect(screen.getByTestId('security-key-max').textContent).toContain('Up to 2 keys');
  expect(screen.getByText(/cannot bond a node yet/)).toBeTruthy();
  expect(screen.queryByTestId('chain-allowlist-section')).toBeNull();
  fireEvent.click(screen.getByTestId('security-key-enable'));
  const pw = screen.getByLabelText('Wallet password') as HTMLInputElement;
  fireEvent.change(pw, { target: { value: 'pw' } });
  fireEvent.click(within(screen.getByTestId('protection-confirm')).getByRole('button', { name: 'Turn on' }));
  expect(pw.value).toBe('');
  await waitFor(() => expect(enableSecurityKey).toHaveBeenCalledTimes(1));
  expect((enableSecurityKey.mock.calls[0][0] as any).password).toBe('pw');
  await screen.findByText(/once the next block includes it/);
});

it('allowlist: lists entries by contact name and counts down a pending addition live', () => {
  render(<ChainProtectionsView owner={owner} protections={protections({ securityKey: null })} />);
  expect(screen.getByTestId('chain-allowlist-allowed').textContent).toContain('Mom');
  expect(screen.getByTestId('chain-allowlist-delay').textContent).toContain('about 48 hours');
  // 2244 blocks × 77 s = 172,788 s = 1 d 23 h 59 m 48 s.
  expect(screen.getByTestId('chain-allowlist-countdown').textContent).toBe('1 d 23 h 59 m 48 s');
  act(() => { jest.advanceTimersByTime(3000); });
  expect(screen.getByTestId('chain-allowlist-countdown').textContent).toBe('1 d 23 h 59 m 45 s');
});

it('allowlist: add an address → signed request_add after the password', async () => {
  render(<ChainProtectionsView owner={owner} protections={protections({ securityKey: null })} />);
  fireEvent.change(screen.getByLabelText('Add an address'), { target: { value: ` 0x${'A'.repeat(40)} ` } });
  fireEvent.click(screen.getByTestId('chain-allowlist-add'));
  expect(screen.getByTestId('protection-confirm').textContent).toContain('about 48 hours');
  fireEvent.change(screen.getByLabelText('Wallet password'), { target: { value: 'pw' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign and send' }));
  await waitFor(() => expect(submitAllowlistAction).toHaveBeenCalledTimes(1));
  expect((submitAllowlistAction.mock.calls[0][0] as any).action).toEqual({ kind: 'request_add', address: `0x${'a'.repeat(40)}` });
});

it('allowlist: refuses a bad or duplicate address before asking for a password', () => {
  render(<ChainProtectionsView owner={owner} protections={protections({ securityKey: null })} />);
  fireEvent.change(screen.getByLabelText('Add an address'), { target: { value: a3 } });
  fireEvent.click(screen.getByTestId('chain-allowlist-add'));
  expect(screen.getByText('That address is already on the list.')).toBeTruthy();
  expect(screen.queryByTestId('protection-confirm')).toBeNull();
});

it('allowlist off: turning on uses the 48 h default and drops my own address from the list', async () => {
  render(<ChainProtectionsView owner={owner} protections={protections({ securityKey: null, allowlist: alRead({ in_force: false, allowed: [], pending_additions: [] }) })} />);
  fireEvent.click(screen.getByRole('button', { name: /Use my address book/ }));
  fireEvent.change(screen.getByLabelText('Addresses you can send to'), { target: { value: `${a5}\n${owner}` } });
  fireEvent.click(screen.getByTestId('chain-allowlist-enable'));
  fireEvent.change(screen.getByLabelText('Wallet password'), { target: { value: 'pw' } });
  fireEvent.click(within(screen.getByTestId('protection-confirm')).getByRole('button', { name: 'Turn on' }));
  await waitFor(() => expect(submitAllowlistAction).toHaveBeenCalledTimes(1));
  expect((submitAllowlistAction.mock.calls[0][0] as any).action).toEqual({ kind: 'enable', addDelayBlocks: 2244, allowed: [a5] });
});

it('a pending turn-off is shown with a way to keep the list on', () => {
  render(<ChainProtectionsView owner={owner} protections={protections({ securityKey: null, allowlist: alRead({ pending_disable: { requested_at_height: 990, effective_at_height: 1010 } }) })} />);
  expect(screen.getByTestId('chain-allowlist-disable-pending').textContent).toContain('12 m 50 s');
  expect(screen.getByRole('button', { name: 'Keep it on' })).toBeTruthy();
});
