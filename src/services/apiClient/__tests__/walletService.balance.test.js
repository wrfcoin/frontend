import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { WalletService } from '../walletService';

const serviceUrls = {
  api: 'https://api.example.com',
  weather: 'https://api.example.com',
  earnings: 'https://api.example.com',
  governance: 'https://api.example.com',
  wallet: 'https://api.example.com/api/wallet',
  compute: 'https://api.example.com',
  validator: 'https://api.example.com',
};

describe('WalletService getBalance precision (issue #236)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('returns a quoted balance above 2^53 base units WITHOUT precision loss', async () => {
    const service = new WalletService(serviceUrls);

    // The producer contract is a quoted decimal string for u64/u128 base units.
    const bodyText =
      '{"success":true,"data":{"address":"0xabc","balance":"9000000000000000001","symbol":"WRF"}}';

    global.fetch.mockResolvedValueOnce(
      new Response(bodyText, { status: 200 }),
    );

    const result = await service.getBalance('0xabc');

    expect(result.balance).toBe('9000000000000000001');
    expect(result.symbol).toBe('WRF');
  });

  it('preserves the 2^53 boundary balance exactly', async () => {
    const service = new WalletService(serviceUrls);

    global.fetch.mockResolvedValueOnce(
      new Response(
        '{"success":true,"data":{"address":"0xabc","balance":"9007199254740993"}}',
        { status: 200 },
      ),
    );

    const result = await service.getBalance('0xabc');
    expect(result.balance).toBe('9007199254740993');
  });

  it('still returns small balances correctly', async () => {
    const service = new WalletService(serviceUrls);

    global.fetch.mockResolvedValueOnce(
      new Response(
        '{"success":true,"data":{"address":"0xabc","balance":"150000000"}}',
        { status: 200 },
      ),
    );

    const result = await service.getBalance('0xabc');
    expect(result.balance).toBe('150000000');
  });

  it('fails closed when the producer sends an unsafe bare number', async () => {
    const service = new WalletService(serviceUrls);

    global.fetch.mockResolvedValueOnce(
      new Response(
        '{"success":true,"data":{"address":"0xabc","balance":9007199254740993}}',
        { status: 200 },
      ),
    );

    await expect(service.getBalance('0xabc')).rejects.toThrow(
      'Unsafe bare numeric JSON value',
    );
  });
});

it('a missing wallet read stays unavailable without trying the unmounted wallets alias', async () => {
  global.fetch = jest.fn(async () => new Response(JSON.stringify({ error: 'Wallet unavailable' }), { status: 404 }));
  const service = new WalletService({ ...serviceUrls, wallet: '/api' });
  await expect(service.getBalance('synthetic-address')).rejects.toThrow();
  expect(global.fetch.mock.calls.map(([url]) => url)).toEqual(['/api/wallet/synthetic-address']);
  global.fetch.mockClear();
  await expect(service.getTransactions('synthetic-address')).rejects.toThrow();
  expect(global.fetch.mock.calls.map(([url]) => url)).toEqual(['/api/wallet/synthetic-address/transactions?limit=20&offset=0']);
});
