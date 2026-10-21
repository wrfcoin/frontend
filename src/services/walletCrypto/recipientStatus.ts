/**
 * Positive owner evidence only; this is not a recipient directory or a
 * spendability oracle. See sol-rev-b-legacy-address.md, owner ruling 2026-10-15.
 * No replacement is inferred, and absence from this set means UNKNOWN.
 */
const KNOWN_LEGACY_RECEIVE_ONLY = new Set([
  '0x465230af3383c16d024c5f4b87ed2d1b595be148',
]);

export const LEGACY_RECIPIENT_MESSAGE =
  'This address is positively known to be legacy receive-only. Ordinary Send is blocked. Ask the recipient for their verified current address.';
export const UNKNOWN_RECIPIENT_MESSAGE =
  'Recipient status is unknown. Address format does not establish that the recipient can spend.';

export function recipientStatus(address: string): 'known-legacy-receive-only' | 'unknown' {
  // The older web modal accepts wrf<40hex> as a lossless 0x prefix alias.
  const canonical = address.trim().toLowerCase().replace(/^wrf([0-9a-f]{40})$/, '0x$1');
  return KNOWN_LEGACY_RECEIVE_ONLY.has(canonical)
    ? 'known-legacy-receive-only' : 'unknown';
}

export function assertOrdinarySendRecipient(address: string): void {
  if (recipientStatus(address) === 'known-legacy-receive-only') {
    throw new Error(LEGACY_RECIPIENT_MESSAGE);
  }
}
