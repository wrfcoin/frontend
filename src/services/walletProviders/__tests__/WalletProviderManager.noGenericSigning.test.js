import { describe, expect, it, jest } from '@jest/globals';


const { walletProviderManager } = await import('../WalletProviderManager.js');

// frontend#374: no generic "sign this text" over the first-party ed25519 key through the manager.
describe('WalletProviderManager never offers generic signing of the first-party key', () => {
  it('refuses signMessage for the custom provider without calling its signer', async () => {
    const signMessage = jest.fn(async () => 'sig');
    walletProviderManager.activeProvider = { getType: () => 'custom', signMessage };
    await expect(walletProviderManager.signMessage('anything')).rejects.toThrow('not available with the first-party wallet key');
    expect(signMessage).not.toHaveBeenCalled();
  });

  it('still forwards signMessage for an injected EVM wallet', async () => {
    const signMessage = jest.fn(async () => '0xevm');
    walletProviderManager.activeProvider = { getType: () => 'metamask', signMessage };
    await expect(walletProviderManager.signMessage('hi')).resolves.toBe('0xevm');
  });

  it('signNftCreate uses the tagged signer for custom and falls back to personal_sign for EVM', async () => {
    const signNftCreate = jest.fn(async () => 'tagged');
    const signMessage = jest.fn(async () => 'generic');
    walletProviderManager.activeProvider = { getType: () => 'custom', signNftCreate, signMessage };
    await expect(walletProviderManager.signNftCreate('{}')).resolves.toBe('tagged');
    expect(signMessage).not.toHaveBeenCalled();
    walletProviderManager.activeProvider = { getType: () => 'metamask', signMessage };
    await expect(walletProviderManager.signNftCreate('{}')).resolves.toBe('generic');
  });
});
