import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { WalletAuthService } from '../walletAuthService';
import { StationRegistrationService } from '../apiClient/stationRegistrationService';
import { clearAuthToken, getAuthToken, setAuthToken } from '../authTokenStore';
import { applyPendingReferralForWallet } from '../referralAttribution';

const ADDRESS = '0x3f995ceb27e8177077dbed8b1e4f696af74da492';
const PUBKEY = 'e96b1c6b8769fdb0b34fbecfdf85c33b053cecad9517e1ab88cba614335775c1';
const TOKEN = `header.${btoa(JSON.stringify({ sub: ADDRESS, address: ADDRESS }))}.signature`;
const KEY = 'wrfcoin:pending-referral';
const NOW = Date.parse('2026-10-02T12:00:00Z');
const challenge = [
  'wrfcoin_wallet_login_ed25519_v1',
  'wallet.example.invalid wants you to sign in with your WRFCoin ed25519 account:',
  ADDRESS, '', 'Sign in to WRFCoin Testnet.', '',
  'URI: https://wallet.example.invalid', 'Version: 1', 'Scheme: ed25519',
  'Chain ID: 777', 'Network: testnet', `Nonce: ${'ab'.repeat(32)}`,
  'Issued At: 2026-10-02T11:59:00.000Z', 'Expiration Time: 2026-10-02T12:05:00.000Z',
].join('\n');
const response = data => new Response(JSON.stringify({ success: true, data }), { status: 200 });
const activated = () => response({ referralCode: 'INVITE123', status: 'activated', rewardAmountWrf: null, reward: { state: 'not_paid' } });
let services = [];

beforeEach(() => {
  localStorage.clear();
  clearAuthToken();
  localStorage.setItem(KEY, 'INVITE123');
  global.fetch = jest.fn(async url => {
    if (url.includes('/auth/nonce/')) return response({ nonce: 'ab'.repeat(32), message: challenge, scheme: 'ed25519' });
    if (url.endsWith('/auth/wallet-login')) return response({ jwt: TOKEN, refreshToken: 'synthetic-refresh', expiresIn: 900 });
    if (url === '/api/referrals/activate') return activated();
    throw new Error(`Unexpected synthetic path: ${url}`);
  });
});
afterEach(() => {
  for (const service of services) service.clearSession();
  services = [];
  clearAuthToken();
  localStorage.clear();
  jest.restoreAllMocks();
});

describe('shared login attribution', () => {
  it('actual station-onboarding ed25519 login activates without WalletContext', async () => {
    const service = new StationRegistrationService({ api: '/api', weather: '/api', wallet: '/api' });
    services.push(service.walletAuth);
    await service.loginWithEd25519(ADDRESS, PUBKEY, async () => 'ab'.repeat(64), {
      address: ADDRESS, origin: 'https://wallet.example.invalid', chainId: '777', network: 'testnet', nowMs: NOW,
    });
    // Optional attribution completes separately from the authenticated login.
    for (let i = 0; i < 30 && localStorage.getItem(KEY); i++) await Promise.resolve();
    const posts = global.fetch.mock.calls.filter(([url]) => url === '/api/referrals/activate');
    expect(posts).toHaveLength(1);
    expect(posts[0][1].headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(getAuthToken()).toBe(TOKEN);
  });

  it('shared login returns its session while optional attribution is still pending', async () => {
    let complete;
    const originalFetch = global.fetch.getMockImplementation();
    global.fetch.mockImplementation(url => url === '/api/referrals/activate'
      ? new Promise(r => { complete = r; }) : originalFetch(url));
    const service = new WalletAuthService('/api');
    services.push(service);
    const session = await service.loginWithSignature({ address: ADDRESS, nonce: 'synthetic', signature: 'synthetic' });
    expect(session.jwt).toBe(TOKEN);
    expect(complete).toEqual(expect.any(Function));
    complete(activated());
    for (let i = 0; i < 30 && localStorage.getItem(KEY); i++) await Promise.resolve();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it.each(['response', 'body'])('a stalled attribution %s has a finite budget and preserves pending state and JWT', async stage => {
    setAuthToken(TOKEN);
    let receivedSignal;
    global.fetch.mockImplementation((_url, options) => {
      receivedSignal = options.signal;
      // Even a transport that ignores abort must settle the caller.
      return stage === 'response' ? new Promise(() => {})
        : Promise.resolve({ ok: true, status: 200, json: () => new Promise(() => {}) });
    });
    const request = applyPendingReferralForWallet(ADDRESS);
    expect(receivedSignal).toBeDefined();
    await expect(request).rejects.toThrow(/timed out/i);
    expect(receivedSignal.aborted).toBe(true);
    expect(localStorage.getItem(KEY)).toBe('INVITE123');
    expect(getAuthToken()).toBe(TOKEN);
    // Timeout releases the request slot, so a later explicit action can proceed.
    global.fetch.mockResolvedValue(activated());
    await expect(applyPendingReferralForWallet(ADDRESS)).resolves.toMatchObject({ applied: true });
  }, 10_000);
});
