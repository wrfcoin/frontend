import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { clearAuthToken, setAuthToken } from '../authTokenStore';
import { applyPendingReferralForWallet } from '../referralAttribution';

const address = '0x1111111111111111111111111111111111111111';
const token = `header.${btoa(JSON.stringify({ sub: address }))}.signature`;
const key = 'wrfcoin:pending-referral';
beforeEach(() => { localStorage.clear(); setAuthToken(token); localStorage.setItem(key, 'INVITE123'); });
afterEach(() => { clearAuthToken(); localStorage.clear(); jest.restoreAllMocks(); });

it.each([400, 403, 410, 422])('permanent HTTP %s refusal clears attribution without a payout or next-login retry', async status => {
  global.fetch = jest.fn(async () => new Response(JSON.stringify({ error: { code: status === 400 ? 'SELF_REFERRAL_NOT_ALLOWED' : status === 403 ? 'REFERRAL_WALLET_MISMATCH' : 'SYNTHETIC_REFUSAL' } }), { status }));
  await expect(applyPendingReferralForWallet(address)).resolves.toMatchObject({ applied: false, reason: 'permanent-refusal' });
  expect(localStorage.getItem(key)).toBeNull();
  await expect(applyPendingReferralForWallet(address)).resolves.toMatchObject({ applied: false, reason: 'none-pending' });
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

it.each([401, 403, 404, 408, 425, 429, 500, 503])('retryable or ambiguous HTTP %s retains attribution', async status => {
  global.fetch = jest.fn(async () => new Response(JSON.stringify({ error: { code: 'SYNTHETIC_RETRY' } }), { status }));
  await expect(applyPendingReferralForWallet(address)).rejects.toThrow(/unavailable/);
  expect(localStorage.getItem(key)).toBe('INVITE123');
});

it('a refusal for an older code cannot clear a newly captured invite', async () => {
  global.fetch = jest.fn(async () => {
    localStorage.setItem(key, 'NEW_INVITE');
    return new Response(JSON.stringify({ error: { code: 'SELF_REFERRAL_NOT_ALLOWED' } }), { status: 400 });
  });
  await expect(applyPendingReferralForWallet(address)).resolves.toMatchObject({ applied: false });
  expect(localStorage.getItem(key)).toBe('NEW_INVITE');
});
