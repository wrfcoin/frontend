import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const walletManager = { currentWallet: null };
const getSecureWallet = jest.fn();
const wallet = { address: '0x1111111111111111111111111111111111111111' };

await jest.unstable_mockModule('../../../utils/walletUtils.ts', () => ({ walletManager }));
await jest.unstable_mockModule('../../secureWalletStorage.ts', () => ({ getSecureWallet }));
await jest.unstable_mockModule('../../apiClient/index.ts', () => ({ walletService: {} }));
const { CustomWalletProvider } = await import('../CustomWalletProvider.js');

const originalEnv = globalThis.__VITE_ENV__;
beforeEach(() => {
  jest.clearAllMocks();
  getSecureWallet.mockReturnValue(wallet);
  walletManager.currentWallet = null;
  globalThis.__VITE_ENV__ = {};
});
afterEach(() => {
  globalThis.__VITE_ENV__ = originalEnv;
});

describe.each(['provided wallet', 'stored wallet'])('custom chain id: %s', path => {
  it.each([
    ['testnet build', {}, { VITE_WRFCOIN_CHAIN_ID: '777' }, '777'],
    ['trimmed build id', {}, { VITE_WRFCOIN_CHAIN_ID: ' 777 ' }, '777'],
    ['provider override', { chainId: 888 }, { VITE_WRFCOIN_CHAIN_ID: '777' }, '888'],
    ['unconfigured build', {}, {}, null],
    ['blank build id', {}, { VITE_WRFCOIN_CHAIN_ID: '  ' }, null],
    ['explicit empty override', { chainId: '' }, { VITE_WRFCOIN_CHAIN_ID: '777' }, null],
  ])('reports %s to the connection and provider consumers', async (_label, config, env, expected) => {
    globalThis.__VITE_ENV__ = env;
    const provider = new CustomWalletProvider(config);
    const result = await provider.connect(path === 'provided wallet' ? wallet : null);

    expect(result.chainId).toBe(expected);
    expect(provider.getChainId()).toBe(expected);
    expect(result.address).toBe(wallet.address);
    expect(result.receiveOnly).toBe(true);
    expect(getSecureWallet).toHaveBeenCalledTimes(path === 'stored wallet' ? 1 : 0);
    await provider.disconnect();
    expect(provider.getChainId()).toBeNull();
  });
});
