
import { getAuthToken } from './authTokenStore';
import { readJwtSubject } from './walletJwtSubject';

const PENDING_REFERRAL_KEY = 'wrfcoin:pending-referral';
const REFERRAL_CODE = /^[a-z0-9_-]{3,64}$/i;

export function captureReferralFromLocation(location = window.location) {
  const code = new URLSearchParams(location.search).get('ref')?.trim() ?? null;
  if (!code || !REFERRAL_CODE.test(code)) return null;
  localStorage.setItem(PENDING_REFERRAL_KEY, code);
  // Keep attribution, but remove the code from the visible URL before wallet
  // connection and subsequent navigation.
  const url = new URL(location.href);
  url.searchParams.delete('ref');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  return code;
}

export function getPendingReferral() {
  const code = localStorage.getItem(PENDING_REFERRAL_KEY);
  return code && REFERRAL_CODE.test(code) ? code : null;
}

const pendingWrites = new Map();

/** Apply attribution after wallet login; activation never represents a payout. */
export async function applyPendingReferralForWallet(walletAddress) {
  const referralCode = getPendingReferral();
  if (!referralCode || !walletAddress) return { applied: false, reason: 'none-pending' };
  const token = getAuthToken();
  if (!token || readJwtSubject(token)?.toLowerCase() !== walletAddress.toLowerCase()) {
    throw new Error('Sign in with the connected wallet to use referrals.');
  }
  const key = `${walletAddress.toLowerCase()}:${referralCode}`;
  if (pendingWrites.has(key)) return pendingWrites.get(key);

  const controller = new AbortController();
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error('Referral activation timed out'));
    }, 3000);
  });
  const request = (async () => {
    const res = await Promise.race([fetch('/api/referrals/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ referralCode, walletAddress }),
      signal: controller.signal,
    }), timeout]);
    // A response from a superseded wallet session must not consume attribution.
    if (getAuthToken() !== token) return { applied: false, reason: 'session-changed' };
    const body = await Promise.race([res.json(), timeout]);
    if (getAuthToken() !== token) return { applied: false, reason: 'session-changed' };
    const unavailable = res.status === 404 && body?.error?.code === 'REFERRAL_CODE_NOT_FOUND_OR_ACTIVATED';
    const alreadyAttributed = res.status === 409;
    // Auth expiry, a missing route and throttling/timeouts can recover. Other
    // client refusals (including self-referral) must not recur on every login.
    const permanentRefusal = (res.status === 403 && body?.error?.code === 'REFERRAL_WALLET_MISMATCH') ||
      (res.status >= 400 && res.status < 500 &&
       ![401, 403, 404, 408, 409, 425, 429].includes(res.status));
    if (!unavailable && !alreadyAttributed && !permanentRefusal && (!res.ok || body?.success !== true ||
        body?.data?.referralCode !== referralCode || body?.data?.rewardAmountWrf !== null ||
        body?.data?.status !== 'activated' || body?.data?.reward?.state !== 'not_paid')) {
      throw new Error(`Referral activation unavailable (HTTP ${res.status})`);
    }
    if (getPendingReferral() === referralCode) localStorage.removeItem(PENDING_REFERRAL_KEY);
    if (unavailable || alreadyAttributed || permanentRefusal) {
      return { applied: false, reason: unavailable ? 'code-unavailable' : alreadyAttributed ? 'already-attributed' : 'permanent-refusal' };
    }
    return { applied: true, referralCode };
  })();
  pendingWrites.set(key, request);
  try {
    return await request;
  } finally {
    clearTimeout(timeoutId);
    if (pendingWrites.get(key) === request) pendingWrites.delete(key);
  }
}
