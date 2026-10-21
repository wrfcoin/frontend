import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const featuresMock = { walletSend: false };
await jest.unstable_mockModule('../../../config/features', () => ({
  default: featuresMock,
  FEATURES: featuresMock,
}));

const { WalletService } = await import('../walletService');

const serviceUrls = {
  api: 'https://api.example.com',
  weather: 'https://api.example.com',
  earnings: 'https://api.example.com',
  governance: 'https://api.example.com',
  wallet: 'https://api.example.com/api/wallet',
  compute: 'https://api.example.com',
  validator: 'https://api.example.com',
};

describe('WalletService sendSignedTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    featuresMock.walletSend = false;
    global.fetch = jest.fn();
  });

  it('fails closed before issuing a wallet send request', async () => {
    const service = new WalletService(serviceUrls);

    await expect(service.sendSignedTransaction({
      from: '0x1111111111111111111111111111111111111111',
      to: '0x2222222222222222222222222222222222222222',
      amount: '12.5',
      nonce: '7',
      auth_pubkey: 'ab'.repeat(32),
      auth_signature: 'cd'.repeat(64),
    })).rejects.toThrow('WALLET_SEND_UNAVAILABLE');

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('forwards only the signed body when the fail-closed gate is enabled', async () => {
    const service = new WalletService(serviceUrls);
    featuresMock.walletSend = true;
    global.fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          txHash: '0xrealbackendhash123',
          transaction: { status: 'pending' },
          message: 'Transaction submitted successfully',
        }),
        { status: 200 },
      ),
    );

    const result = await service.sendSignedTransaction({
      from: '0x1111111111111111111111111111111111111111',
      to: '0x2222222222222222222222222222222222222222',
      amount: '12.5',
      nonce: '7',
      auth_pubkey: 'ab'.repeat(32),
      auth_signature: 'cd'.repeat(64),
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/api/wallet/send',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          from: '0x1111111111111111111111111111111111111111',
          to: '0x2222222222222222222222222222222222222222',
          amount: '12.5',
          nonce: '7',
          auth_pubkey: 'ab'.repeat(32),
          auth_signature: 'cd'.repeat(64),
        }),
      }),
    );
    expect(result).toEqual({
      txHash: '0xrealbackendhash123',
      status: 'pending',
      message: 'Transaction submitted successfully',
    });
  });

  it('reads the sender nonce without fabricating a fallback', async () => {
    const service = new WalletService(serviceUrls);
    global.fetch.mockResolvedValueOnce(new Response(JSON.stringify({ nonce: '9' }), { status: 200 }));

    await expect(service.getNonce('0xsender')).resolves.toBe('9');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/api/wallet/0xsender/nonce',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('refuses the known legacy destination even for an already signed body; no HTTP request', async () => {
    featuresMock.walletSend = true;
    const service = new WalletService(serviceUrls);
    await expect(service.sendSignedTransaction({
      from: '0x1111111111111111111111111111111111111111',
      to: '0x465230af3383c16d024c5f4b87ed2d1b595be148',
      amount: '100000000', nonce: '7', auth_pubkey: 'ab'.repeat(32), auth_signature: 'cd'.repeat(64),
    })).rejects.toThrow('Ordinary Send is blocked');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
