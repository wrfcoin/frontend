import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { clearAuthToken, setAuthToken } from '../../services/authTokenStore';

const ADDRESS = '0x1111111111111111111111111111111111111111';
const OTHER = '0x2222222222222222222222222222222222222222';
const KEY = 'wrfcoin:pending-referral';
const jwt = (address = ADDRESS) => `header.${btoa(JSON.stringify({ sub: address, address }))}.signature`;
const login = jest.fn();
let activeType = 'metamask';
const manager = {
  getAvailableProviders: () => [],
  autoConnect: jest.fn(async () => null),
  connect: jest.fn(async () => ({ address: ADDRESS, chainId: '777', provider: 'metamask' })),
  disconnect: jest.fn(async () => true),
  getActiveProvider: () => ({ getType: () => activeType }),
  getLoginIdentity: () => ({ scheme: 'ed25519', address: ADDRESS, publicKeyHex: 'ab'.repeat(32) }),
  signLoginChallenge: jest.fn(),
  signMessage: jest.fn(),
  getBalance: jest.fn(async () => '0'),
  on: jest.fn(), off: jest.fn(),
};
await jest.unstable_mockModule('../../services/walletProviders/WalletProviderManager.js', () => ({ walletProviderManager: manager }));
await jest.unstable_mockModule('../../services/walletAuthService.ts', () => ({
  WalletAuthService: class {},
  loginWalletWithSigner: login,
  loginWalletWithEd25519: login,
  clearWalletAuthSession: clearAuthToken,
}));
const { WalletProvider, useWallet } = await import('../WalletContext.jsx');
const { captureReferralFromLocation, getPendingReferral } = await import('../../hooks/useReferrals');

let wallet;
const Capture = () => { wallet = useWallet(); return null; };
const response = (status = 200, body = {
  success: true,
  data: { referralCode: 'INVITE123', status: 'activated', rewardAmountWrf: null, reward: { state: 'not_paid' } },
}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
async function mount() {
  await act(async () => { render(<WalletProvider><Capture /></WalletProvider>); });
}
async function connect() {
  await act(async () => { await wallet.connectWallet('metamask'); });
}

beforeEach(() => {
  jest.clearAllMocks();
  activeType = 'metamask';
  localStorage.clear();
  clearAuthToken();
  login.mockImplementation(async address => { setAuthToken(jwt(address)); return { address }; });
  manager.autoConnect.mockResolvedValue(null);
  global.fetch = jest.fn(async () => response());
  captureReferralFromLocation(new URL('https://example.invalid/?ref=INVITE123'));
});
afterEach(() => { cleanup(); clearAuthToken(); jest.restoreAllMocks(); });

describe('captured referral at the real wallet login transition', () => {
  it('does not activate before login; login activates once with its JWT, then reload stays idle', async () => {
    await mount();
    expect(global.fetch).not.toHaveBeenCalled();
    await connect();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/referrals/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt()}` },
      body: JSON.stringify({ referralCode: 'INVITE123', walletAddress: ADDRESS }),
      signal: expect.anything(),
    });
    expect(getPendingReferral()).toBeNull();
    cleanup();
    await mount();
    await connect();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('restored-wallet login also applies the captured code', async () => {
    manager.autoConnect.mockResolvedValue({ address: ADDRESS, chainId: '777', provider: 'metamask' });
    await mount();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(getPendingReferral()).toBeNull();
  });

  it('a first-party ed25519 login applies the captured code too', async () => {
    activeType = 'custom';
    await mount();
    await connect();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(getPendingReferral()).toBeNull();
    expect(login.mock.calls[0][0]).toBe(ADDRESS);
  });

  it.each([401, 403, 500])('HTTP %s keeps attribution without undoing successful login or retrying', async status => {
    global.fetch.mockResolvedValue(response(status, { error: { code: 'FAILED' } }));
    await mount();
    await connect();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(getPendingReferral()).toBe('INVITE123');
    expect(wallet.isConnected).toBe(true);
    expect(manager.disconnect).not.toHaveBeenCalled();
  });

  it('network failure keeps attribution and the authenticated wallet', async () => {
    global.fetch.mockRejectedValue(new TypeError('synthetic offline'));
    await mount();
    await connect();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(getPendingReferral()).toBe('INVITE123');
    expect(wallet.isConnected).toBe(true);
  });

  it.each([
    [409, { error: { code: 'ALREADY_ATTRIBUTED' } }],
    [404, { error: { code: 'REFERRAL_CODE_NOT_FOUND_OR_ACTIVATED' } }],
  ])('terminal HTTP %s clears without claiming a newly activated referral', async (status, body) => {
    global.fetch.mockResolvedValue(response(status, body));
    await mount();
    await connect();
    expect(getPendingReferral()).toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(wallet.isConnected).toBe(true);
  });

  it.each([
    [404, { error: { code: 'NOT_FOUND' } }],
    [200, { success: true }],
    [200, { success: true, data: { status: 'rewarded' } }],
  ])('unexpected response %s retains pending attribution', async (status, body) => {
    global.fetch.mockResolvedValue(response(status, body));
    await mount();
    await connect();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(getPendingReferral()).toBe('INVITE123');
  });

  it('failed login never posts an activation', async () => {
    login.mockRejectedValue(new Error('synthetic login failure'));
    await mount();
    await act(async () => { await expect(wallet.connectWallet('metamask')).rejects.toThrow('login failure'); });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(getPendingReferral()).toBe('INVITE123');
  });

  it('login completing with another wallet JWT cannot attribute this wallet', async () => {
    login.mockImplementation(async () => { setAuthToken(jwt(OTHER)); return { address: ADDRESS }; });
    await mount();
    await connect();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(getPendingReferral()).toBe('INVITE123');
  });

  it('concurrent login transitions share one activation request', async () => {
    let complete;
    global.fetch.mockImplementation(() => new Promise(r => { complete = r; }));
    await mount();
    await act(async () => {
      const first = wallet.authenticateWallet(ADDRESS);
      const second = wallet.authenticateWallet(ADDRESS);
      for (let i = 0; i < 20 && !complete; i++) await Promise.resolve();
      expect(global.fetch).toHaveBeenCalledTimes(1);
      complete(response());
      await Promise.all([first, second]);
    });
    expect(getPendingReferral()).toBeNull();
  });

  it('a changed session cannot consume the pending code from an old response', async () => {
    global.fetch.mockImplementation(async () => { setAuthToken(jwt(OTHER)); return response(); });
    await mount();
    await connect();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(getPendingReferral()).toBe('INVITE123');
  });

  it('a newer captured code survives an older successful response', async () => {
    global.fetch.mockImplementation(async () => { localStorage.setItem(KEY, 'NEWCODE'); return response(); });
    await mount();
    await connect();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(getPendingReferral()).toBe('NEWCODE');
  });
});
