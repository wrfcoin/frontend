/**
 * Domain-separated envelope for GENERIC messages signed with the first-party
 * ed25519 key (frontend#373 security review, finding 1).
 *
 * The same key authorizes transfers and every other core4 protocol action, and
 * core4 verifies ed25519 over several preimage families: binary
 * "wrfcoin_*_vN" domains (transfer, stake, commit, ...), dotted
 * "wrfcoin.*.vN" tags (session keys, recovery, authorization), slash
 * "wrfcoin/core4/..." proof-of-possession challenges, and even the plain-text
 * "permissionless-v1|..." launch_api message. A raw "sign these bytes/this
 * text" primitive over that key is therefore a signing oracle for all of
 * them.
 *
 * Generic signatures are instead always taken over
 *   "wrfcoin_generic_message_v1\n" + <text>
 * so no generic signature can ever equal a signature over any protocol
 * preimage (none starts with this tag). In addition, text that itself looks
 * like a protocol or login preimage is refused outright, and non-text input
 * (raw bytes) is never signed.
 */

export const GENERIC_MESSAGE_DOMAIN = 'wrfcoin_generic_message_v1';

// Text that begins like a core4/login signing domain or any "<name>-vN|"
// pipe-framed preimage (core4 "wrfcoin-sign-v1|" domain_signing envelope,
// "governance-vote-v1|", launch_api "permissionless-v1|", ...). Refused even
// though the envelope already separates it, so a caller can never be tricked
// into "approving" protocol-looking text (frontend#373 review-trio note 1).
const PROTOCOL_LOOKING = /^(wrfcoin[-_./]|[a-z]+(?:-[a-z]+)*-v\d+\|)/i;

const encoder = new TextEncoder();

function refuse(reason: string): never {
  throw new Error(`Refusing to sign message with the wallet key: ${reason}.`);
}

/**
 * The exact bytes the wallet signs for a generic message. Throws for non-text
 * input and for protocol-looking text.
 */
export function genericMessageSigningBytes(message: unknown): Uint8Array {
  if (typeof message !== 'string') {
    refuse('only text messages can be signed, never raw bytes');
  }
  if (PROTOCOL_LOOKING.test(message.trimStart())) {
    refuse('text looks like a protocol signing preimage');
  }
  return encoder.encode(`${GENERIC_MESSAGE_DOMAIN}\n${message}`);
}
