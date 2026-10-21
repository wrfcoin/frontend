/**
 * @jest-environment jsdom
 */
// W28: only the visitor's own signing first-party wallet counts, by the same rule as /wallet (frontend#457).
import { jest } from '@jest/globals';
import React from 'react';
import { renderHook } from '@testing-library/react';

await jest.unstable_mockModule('../../services/apiClient/index.ts', () => ({
  walletService: { getBalance: jest.fn(async () => ({ balance: '0' })), getNonce: jest.fn() },
}));

const { default: WalletContext } = await import('../../contexts/WalletContext.jsx');
const { walletProviderManager } = await import('../../services/walletProviders/WalletProviderManager.js');
const { useOwnedFirstPartyAddress } = await import('../useOwnedFirstPartyAddress');

const ADDRESS = `0x${'Ab'.repeat(20)}`;
const SIGNED_IN = { isConnected: true, activeProvider: 'custom', receiveOnly: false, account: ADDRESS };

function run(value: Record<string, unknown> | null, identity: unknown) {
  jest.spyOn(walletProviderManager, 'getLoginIdentity').mockReturnValue(identity as never);
  const wrapper = ({ children }: { children?: React.ReactNode }) =>
    value === null ? <>{children}</> : <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
  return renderHook(() => useOwnedFirstPartyAddress(), { wrapper }).result.current;
}

describe('useOwnedFirstPartyAddress', () => {
  const ed = { scheme: 'ed25519', address: ADDRESS.toLowerCase() };
  afterEach(() => jest.restoreAllMocks());

  it('returns the lowercase address of the signed-in, signing first-party wallet', () => {
    expect(run(SIGNED_IN, ed)).toBe(ADDRESS.toLowerCase());
  });

  it.each([
    ['outside any WalletProvider', null, ed],
    ['not connected', { ...SIGNED_IN, isConnected: false }, ed],
    ['an injected EVM wallet', { ...SIGNED_IN, activeProvider: 'metamask' }, ed],
    ['a receive-only (legacy) account', { ...SIGNED_IN, receiveOnly: true }, ed],
    ['no login identity', SIGNED_IN, null],
    ['a non-ed25519 identity', SIGNED_IN, { scheme: 'secp256k1', address: ADDRESS.toLowerCase() }],
    ['an identity for another address', SIGNED_IN, { scheme: 'ed25519', address: `0x${'11'.repeat(20)}` }],
  ])('is null for %s', (_label, value, identity) => {
    expect(run(value as Record<string, unknown> | null, identity)).toBeNull();
  });
});
