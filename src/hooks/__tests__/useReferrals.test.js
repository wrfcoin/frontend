/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { setAuthToken, clearAuthToken } from '../../services/authTokenStore';
const walletJwt = (wallet = '0xwallet') => `header.${btoa(JSON.stringify({ sub: wallet, address: wallet }))}.signature`;

import {
  useReferrals,
  captureReferralFromLocation,
  getPendingReferral,
} from '../useReferrals';

function makeOkResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('useReferrals', () => {
  beforeEach(() => {
    localStorage.clear();
    setAuthToken(walletJwt());
    jest.spyOn(window.history, 'replaceState').mockImplementation(() => {});
    global.fetch = jest.fn();
  });

  afterEach(() => {
    clearAuthToken();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('captures valid referral code from URL and strips only ref from visible path', () => {
    const location = new URL('https://wrfcoin.io/?ref=AbC_123&foo=bar#join');

    const captured = captureReferralFromLocation(location);

    expect(captured).toBe('AbC_123');
    expect(localStorage.getItem('wrfcoin:pending-referral')).toBe('AbC_123');
    expect(window.history.replaceState).toHaveBeenCalledWith(
      {},
      '',
      '/?foo=bar#join',
    );
  });

  it('ignores invalid referral code on URL input', () => {
    const location = new URL('https://wrfcoin.io/?ref=bad-code!!&foo=bar');

    const captured = captureReferralFromLocation(location);

    expect(captured).toBeNull();
    expect(localStorage.getItem('wrfcoin:pending-referral')).toBeNull();
    expect(window.history.replaceState).not.toHaveBeenCalled();
  });

  it('returns null when pending-referral storage value is invalid', () => {
    localStorage.setItem('wrfcoin:pending-referral', 'bad-code!!');

    expect(getPendingReferral()).toBeNull();
  });

  it('applies a pending referral only when wallet and valid pending code are present', async () => {
    localStorage.setItem('wrfcoin:pending-referral', 'VALID123');

    global.fetch
      .mockResolvedValueOnce(makeOkResponse({ data: { referralCode: 'OWNER_CODE' } }))
      .mockResolvedValueOnce(makeOkResponse({ data: { byStatus: { pending: 0, activated: 0 }, totalReferrals: 1 } }))
      .mockResolvedValueOnce(makeOkResponse({ success: true, data: { referralCode: 'VALID123', status: 'activated', rewardAmountWrf: null, reward: { state: 'not_paid' } } }))
      .mockResolvedValueOnce(makeOkResponse({ data: { byStatus: { pending: 0, activated: 1 }, totalReferrals: 2 } }));

    const { result } = renderHook(() => useReferrals('0xwallet'));

    await waitFor(() => {
      expect(result.current.referralCode).toBe('OWNER_CODE');
    });

    let applyResult;
    await act(async () => {
      applyResult = await result.current.applyPendingReferral();
    });

    expect(applyResult).toEqual({ applied: true, referralCode: 'VALID123' });
    expect(localStorage.getItem('wrfcoin:pending-referral')).toBeNull();
    const activateCalls = global.fetch.mock.calls.filter(([url, options]) => {
      return typeof url === 'string' &&
        url.includes('/api/referrals/activate') &&
        options?.method === 'POST';
    });
    expect(activateCalls).toHaveLength(1);
    for (const [url, options] of global.fetch.mock.calls.filter(([, options]) => options?.method === 'POST')) {
      expect(options.headers.Authorization).toBe(`Bearer ${walletJwt()}`);
    }
  });
});

describe('wallet-authenticated referral writes', () => {
  beforeEach(() => { localStorage.clear(); clearAuthToken(); global.fetch = jest.fn(async (url) => makeOkResponse({ data: url.includes('/stats/') ? { byStatus: { activated: 2 }, reward: { state: 'not_paid' } } : { referralCode: 'MINE' } })); });
  afterEach(() => { clearAuthToken(); jest.restoreAllMocks(); });
  it('does not POST without a matching wallet session, then reacts to login', async () => {
    const { result } = renderHook(() => useReferrals('0xwallet'));
    await act(async () => { await result.current.generateCode(); });
    expect(global.fetch.mock.calls.filter(([, o]) => o?.method === 'POST')).toHaveLength(0);
    await act(async () => { setAuthToken(walletJwt('0xother')); });
    await act(async () => { await result.current.generateCode(); });
    expect(global.fetch.mock.calls.filter(([, o]) => o?.method === 'POST')).toHaveLength(0);
    await act(async () => { setAuthToken(walletJwt()); });
    await waitFor(() => expect(result.current.referralCode).toBe('MINE'));
    await act(async () => { await result.current.generateCode(); });
    const posts=global.fetch.mock.calls.filter(([, o]) => o?.method === 'POST');
    expect(posts.length).toBeGreaterThanOrEqual(2);
    expect(posts.every(([, o]) => o.headers.Authorization === `Bearer ${walletJwt()}`)).toBe(true);
  });
  it('preserves pending attribution when activation has no matching wallet JWT', async () => {
    localStorage.setItem('wrfcoin:pending-referral','INVITE');
    setAuthToken(walletJwt('0xother'));
    const { result }=renderHook(() => useReferrals('0xwallet'));
    await expect(result.current.applyPendingReferral()).rejects.toThrow(/sign in/i);
    expect(localStorage.getItem('wrfcoin:pending-referral')).toBe('INVITE');
    expect(global.fetch.mock.calls.some(([url]) => url.includes('/activate'))).toBe(false);
  });
});


describe('public referral stats without write authentication', () => {
  afterEach(() => { clearAuthToken(); jest.restoreAllMocks(); });
  it.each([null, walletJwt('0xother')])('loads real public counts without a matching token (%s)', async token => {
    localStorage.clear();
    if (token) setAuthToken(token); else clearAuthToken();
    global.fetch = jest.fn(async () => makeOkResponse({data:{totalReferrals:9,byStatus:{pending:2,activated:7}}}));
    const {result}=renderHook(() => useReferrals('0xwallet'));
    await waitFor(() => expect(result.current.stats?.byStatus.activated).toBe(7));
    expect(result.current.stats.totalReferrals).toBe(9);
    expect(global.fetch.mock.calls.some(([url]) => url === '/api/referrals/stats/0xwallet')).toBe(true);
    expect(global.fetch.mock.calls.filter(([,o]) => o?.method === 'POST')).toHaveLength(0);
    expect(result.current.referralCode).toBeNull();
  });
});
