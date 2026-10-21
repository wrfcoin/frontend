import { MetaMaskProvider } from '../MetaMaskProvider.js';
import { WalletConnectProviderClass } from '../WalletConnectProvider.js';
import { WalletProviderManager } from '../WalletProviderManager.js';
import { jest } from '@jest/globals';

describe('wallet provider compatibility', () => {
  const originalWindow = global.window;

  afterEach(() => {
    global.window = originalWindow;
    jest.restoreAllMocks();
  });

  it('does not register the unavailable WalletConnect provider', () => {
    const manager = new WalletProviderManager();
    expect(manager.getAvailableProviders().map(provider => provider.type)).toEqual(['metamask', 'custom']);
  });

  it('fails MetaMask connect with explicit message when extension is unavailable', async () => {
    global.window = {};
    const provider = new MetaMaskProvider();

    await expect(provider.connect()).rejects.toThrow(
      'Failed to connect to MetaMask: MetaMask is not installed or not available',
    );
  });

  it('uses ethers v6-compatible tx params in MetaMask sendTransaction', async () => {
    const provider = new MetaMaskProvider();
    provider.account = '0x1111111111111111111111111111111111111111';

    let capturedTx = null;
    provider.ethersProvider = {
      getSigner: async () => ({
        sendTransaction: async tx => {
          capturedTx = tx;
          return { hash: '0xhash' };
        },
      }),
    };

    const hash = await provider.sendTransaction({
      to: '0x2222222222222222222222222222222222222222',
      value: '1.5',
      gasLimit: 21000,
      gasPrice: 2,
      data: '0x',
    });

    expect(hash).toBe('0xhash');
    expect(capturedTx.value).toBe(1500000000000000000n);
    expect(capturedTx.gasLimit).toBe('0x5208');
    expect(capturedTx.gasPrice).toBe(2000000000n);
  });

  it('sends hex chain id when switching chain in MetaMask', async () => {
    const provider = new MetaMaskProvider();
    const request = jest.fn(async () => true);
    provider.provider = { request };

    await expect(provider.switchChain('1')).resolves.toBe(true);
    expect(request).toHaveBeenCalledWith({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x1' }],
    });
  });

  // Constructed WITH an infuraId on purpose. The constructor sets `configError`
  // when neither infuraId nor rpc is supplied, and connect() throws that first —
  // so a bare `new WalletConnectProviderClass()` never reaches the package check
  // and this test was asserting a message the code can no longer produce there.
  //
  // Satisfying the precondition re-targets the test at the behaviour it claims
  // rather than rewriting the assertion to match whatever now happens, which
  // would have quietly dropped the missing-package guard from coverage.
  it('fails WalletConnect connect with actionable missing-package error', async () => {
    const provider = new WalletConnectProviderClass({ infuraId: 'test-infura-project-id' });

    await expect(provider.connect()).rejects.toThrow(
      'WalletConnect provider package is not installed',
    );
  });

  // The guard the test above was hitting by accident. Covering it explicitly so
  // the re-target above does not lose it.
  it('fails WalletConnect connect with an actionable config error when no infuraId or rpc is supplied', async () => {
    const provider = new WalletConnectProviderClass();

    await expect(provider.connect()).rejects.toThrow(
      'VITE_INFURA_PROJECT_ID is required for WalletConnect',
    );
  });
});
