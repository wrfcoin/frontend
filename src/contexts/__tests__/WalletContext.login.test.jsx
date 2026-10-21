/**
 * frontend#346 / backend#1205: WalletContext.authenticateWallet routes a
 * first-party (custom) wallet with an ed25519 identity to the ed25519 login,
 * and keeps every other wallet (MetaMask, WalletConnect, legacy/receive-only
 * custom accounts) on the EVM personal_sign path.
 */
import React from 'react';
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Challenge timestamps relative to now: the client refuses expired challenges.
const ISSUED_AT = new Date(Date.now() - 1_000).toISOString();
const EXPIRES_AT = new Date(Date.now() + 5 * 60_000).toISOString();

const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const VECTOR_ADDRESS = '0x3f995ceb27e8177077dbed8b1e4f696af74da492';
const VECTOR_PUBKEY = 'e96b1c6b8769fdb0b34fbecfdf85c33b053cecad9517e1ab88cba614335775c1';
const EVM_ADDRESS = '0x2222222222222222222222222222222222222222';
const ORIGIN = 'https://wrfcoin-testnet.taila1c049.ts.net';
const loginChallenge = () => [
  'wrfcoin_wallet_login_ed25519_v1',
  'wrfcoin-testnet.taila1c049.ts.net wants you to sign in with your WRFCoin ed25519 account:',
  VECTOR_ADDRESS,
  '',
  'Sign in to WRFCoin Testnet.',
  '',
  `URI: ${ORIGIN}`,
  'Version: 1',
  'Scheme: ed25519',
  'Chain ID: 777',
  'Network: testnet',
  `Nonce: ${'cd'.repeat(32)}`,
  `Issued At: ${ISSUED_AT}`,
  `Expiration Time: ${EXPIRES_AT}`,
].join('\n');

const loginWalletWithEd25519 = jest.fn(async address => ({ address }));
const loginWalletWithSigner = jest.fn(async address => ({ address }));
const clearWalletAuthSession = jest.fn();

await jest.unstable_mockModule('../../services/walletAuthService.ts', () => ({
  loginWalletWithEd25519,
  loginWalletWithSigner,
  clearWalletAuthSession,
}));
await jest.unstable_mockModule('../../utils/walletUtils.ts', () => ({
  walletManager: { currentWallet: null },
}));
await jest.unstable_mockModule('../../services/apiClient/index.ts', () => ({
  walletService: { getBalance: jest.fn(async () => ({ balance: '0' })), getNonce: jest.fn() },
}));

const { walletProviderManager } = await import('../../services/walletProviders/WalletProviderManager.js');
const { WalletProvider, useWallet } = await import('../WalletContext.jsx');

function fakeEvmProvider(type, { spuriousIdentity = false } = {}) {
  return {
    account: null,
    isConnected: false,
    getType: () => type,
    getName: () => type,
    getIcon: () => 'wallet',
    isAvailable: () => true,
    async connect() {
      this.account = EVM_ADDRESS;
      this.isConnected = true;
      return { address: EVM_ADDRESS, chainId: 1, provider: type };
    },
    async disconnect() {
      this.isConnected = false;
      return true;
    },
    signMessage: jest.fn(async () => '0xevmsig'),
    getBalance: jest.fn(async () => '0'),
    getAccount() { return this.account; },
    getChainId: () => 1,
    on: () => {},
    off: () => {},
    supportsOperation: () => true,
    // An injected wallet must never be routed to ed25519, even if something
    // on it looks like a login identity.
    ...(spuriousIdentity
      ? { getLoginIdentity: () => ({ scheme: 'ed25519', address: EVM_ADDRESS, publicKeyHex: VECTOR_PUBKEY }) }
      : {}),
  };
}

let wallet;
function Capture() {
  wallet = useWallet();
  return null;
}

async function renderProvider() {
  await act(async () => {
    render(<WalletProvider><Capture /></WalletProvider>);
  });
}

describe('WalletContext.authenticateWallet key-scheme routing', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await walletProviderManager.disconnect().catch(() => {});
    walletProviderManager.providers.set('metamask', fakeEvmProvider('metamask'));
    walletProviderManager.providers.set(
      'walletconnect',
      fakeEvmProvider('walletconnect', { spuriousIdentity: true }),
    );
  });

  it('logs a first-party ed25519 wallet in with loginWithEd25519 and the vector identity', async () => {
    await renderProvider();
    await act(async () => {
      await wallet.connectWallet('custom', { walletData: { address: VECTOR_ADDRESS, mnemonic } });
    });

    expect(loginWalletWithSigner).not.toHaveBeenCalled();
    expect(loginWalletWithEd25519).toHaveBeenCalledTimes(1);
    const [addr, pubkey, sign] = loginWalletWithEd25519.mock.calls[0];
    expect(addr).toBe(VECTOR_ADDRESS);
    expect(pubkey).toBe(VECTOR_PUBKEY);
    expect(wallet.account).toBe(VECTOR_ADDRESS);

    // The signer handed to the ed25519 login is the provider's validating
    // signLoginChallenge, never the generic signMessage.
    const custom = walletProviderManager.getProvider('custom');
    const genericSign = jest.spyOn(custom, 'signMessage');
    custom.config = { walletAuthOrigin: ORIGIN, walletAuthChainId: '777', walletAuthNetwork: 'testnet' };
    await expect(sign('hello')).rejects.toThrow('Refusing to sign wallet login challenge');
    await expect(sign(loginChallenge())).resolves.toMatch(/^[0-9a-f]{128}$/);
    expect(genericSign).not.toHaveBeenCalled();
  });

  it.each(['metamask', 'walletconnect'])('keeps %s on the EVM login path', async type => {
    await renderProvider();
    await act(async () => {
      await wallet.connectWallet(type);
    });

    expect(loginWalletWithEd25519).not.toHaveBeenCalled();
    expect(loginWalletWithSigner).toHaveBeenCalledTimes(1);
    expect(loginWalletWithSigner.mock.calls[0][0]).toBe(EVM_ADDRESS);
    await loginWalletWithSigner.mock.calls[0][1]('challenge');
    expect(walletProviderManager.getProvider(type).signMessage).toHaveBeenCalledWith('challenge');
  });

  it('gives a legacy receive-only custom account a null identity and never signs a login with its key', async () => {
    await renderProvider();
    const custom = walletProviderManager.getProvider('custom');
    const genericSign = jest.spyOn(custom, 'signMessage');
    let error;
    await act(async () => {
      error = await wallet
        .connectWallet('custom', { walletData: { address: '0x1111111111111111111111111111111111111111', mnemonic } })
        .catch(e => e);
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain('receive-only');
    expect(loginWalletWithEd25519).not.toHaveBeenCalled();
    // No EVM fallback: the generic signMessage (the ed25519 transfer key) is never offered a server message.
    expect(loginWalletWithSigner).not.toHaveBeenCalled();
    expect(genericSign).not.toHaveBeenCalled();
    expect(clearWalletAuthSession).toHaveBeenCalled();
    expect(walletProviderManager.getActiveProvider()).toBeNull();
    expect(wallet.isConnected).toBe(false);
  });

  it('manager passthrough returns null with no active provider', () => {
    expect(walletProviderManager.getLoginIdentity()).toBeNull();
  });

  it('an EVM provider cannot sign a login challenge and never falls back to signMessage', async () => {
    await renderProvider();
    await act(async () => {
      await wallet.connectWallet('metamask');
    });
    const evm = walletProviderManager.getProvider('metamask');

    await expect(walletProviderManager.signLoginChallenge(loginChallenge())).rejects.toThrow(
      'cannot sign an ed25519 login challenge',
    );
    expect(evm.signMessage).not.toHaveBeenCalled();
  });
});
