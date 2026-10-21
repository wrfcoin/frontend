/**
 * Public wallet-address helpers (backend#1361).
 *
 * The public leaderboard and the operator profile no longer hand anonymous callers a full wallet
 * address: they send a short form ("0xa1a1…a1a1") plus an opaque `profileKey` for links. The full
 * address is returned only to the operator and to the wallet's own login. These helpers keep every
 * page working with either shape and never turn a short address back into a link target.
 */

const FULL_ADDRESS_RE = /^(?:0x|wrf)[0-9a-fA-F]{40}$/;

export function isFullAddress(value) {
  return typeof value === 'string' && FULL_ADDRESS_RE.test(value);
}

/** First 6 + last 4 characters; idempotent, so it is safe on an already-short address. */
export function shortAddr(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/**
 * Proof that two values are the SAME wallet: only an exact, case-insensitive comparison of two
 * FULL addresses. A short form is 6 + 4 characters, so many different wallets share one; a short
 * match is never evidence of ownership (use the server's verified `isYou` for that).
 */
export function sameWallet(a, b) {
  if (!isFullAddress(a) || !isFullAddress(b)) return false;
  return a.toLowerCase() === b.toLowerCase();
}

/** Could these be the same wallet? True when either is short and the short forms agree. Ambiguity only. */
export function mayBeWallet(a, b) {
  if (!a || !b) return false;
  if (isFullAddress(a) && isFullAddress(b)) return sameWallet(a, b);
  return shortAddr(a).toLowerCase() === shortAddr(b).toLowerCase();
}

/** Route segment for a contributor's profile page, or null when none can be built safely. */
export function profileSegment(entry) {
  if (!entry) return null;
  if (typeof entry.profileKey === 'string' && entry.profileKey.length > 0) return entry.profileKey;
  return isFullAddress(entry.walletAddress) ? entry.walletAddress : null;
}

/** Default node name, from the hex before any ellipsis (at most 6 characters). */
export function defaultNodeName(addr) {
  const hex = String(addr ?? '').replace(/^(?:0x|wrf)/i, '').split('…')[0].slice(0, 6);
  return `WeatherNode-${hex.toUpperCase()}`;
}
