import { sanitizeWalletDataForStorage } from '../walletMetadataSanitizer.js';

describe('WalletCreationModal secret handling', () => {
  it('strips secret fields from persisted wallet metadata', () => {
    const createdAt = '2026-03-05T00:00:00.000Z';
    const walletInfo = {
      name: 'My Wallet',
      address: 'wrf123',
      publicKey: 'pub',
      sessionId: 'session_1',
      type: 'created',
      mnemonic: 'secret phrase',
      privateKey: '0xsecret',
      password: 'p@ssword',
      confirmPassword: 'p@ssword',
      recoveryPhrase: 'secret phrase',
      nested: {
        mnemonic: 'nested mnemonic',
        key: 'non-secret',
      },
      accounts: [
        {
          index: 0,
          privateKey: 'nested-private-key',
          address: 'wrf_nested',
        },
      ],
    };

    const sanitized = sanitizeWalletDataForStorage({
      walletInfo,
      isEncrypted: true,
      createdAt,
    });

    expect(sanitized).toEqual({
      name: 'My Wallet',
      address: 'wrf123',
      publicKey: 'pub',
      sessionId: 'session_1',
      type: 'created',
      nested: {
        key: 'non-secret',
      },
      accounts: [
        {
          index: 0,
          address: 'wrf_nested',
        },
      ],
      encrypted: true,
      balance: 0,
      created: createdAt,
    });

    expect(sanitized.mnemonic).toBeUndefined();
    expect(sanitized.privateKey).toBeUndefined();
    expect(sanitized.password).toBeUndefined();
  });
});
