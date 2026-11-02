/**
 * Reopen an existing passkey wallet in a browser that has never seen it. WebAuthn `get()` does not return
 * the public key, but a P-256 signature gives it back up to two candidates; a second assertion over a
 * fresh challenge leaves the one key that verifies both. Runs entirely in this browser: nothing here
 * talks to a server, and only `credentials.get` is ever called, so no new credential can be created.
 * The checks mirror core4 `verify_webauthn`, so a key recovered here is one the chain would accept.
 */
import { p256 } from '@noble/curves/nist.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { asBytes, bytesToHex, concat, derToLowS, type CredentialsLike, type PasskeyCredentialRecord } from './passkey';

export type PasskeyRecoveryFailure = 'DIFFERENT_CREDENTIAL' | 'NOT_RECOVERABLE';

export class PasskeyRecoveryError extends Error {
  constructor(readonly code: PasskeyRecoveryFailure) {
    super(code);
    this.name = 'PasskeyRecoveryError';
  }
}

/** One `get()` result, with the challenge it was asked to sign. */
export interface PasskeyRecoveryAssertion {
  credentialId: Uint8Array;
  challenge: Uint8Array;
  authenticatorData: Uint8Array;
  clientDataJSON: Uint8Array;
  signatureDer: Uint8Array;
}

const AUTHENTICATOR_DATA_MIN_LEN = 37;
const FLAG_USER_PRESENT = 0x01;
const FLAG_USER_VERIFIED = 0x04;

const base64urlNoPad = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const sameBytes = (a: Uint8Array, b: Uint8Array): boolean => bytesToHex(a) === bytesToHex(b);

/**
 * Ask for one assertion. The first touch names no credential, so the browser or password manager offers
 * the passkeys it holds for `rpId`; the second names the one chosen. Takes only `get` on purpose.
 * Cancelling rejects with the browser's own error (`NotAllowedError`).
 */
export async function requestPasskeyRecoveryAssertion(
  rpId: string,
  onlyCredentialId?: Uint8Array,
  credentials: Pick<CredentialsLike, 'get'> = navigator.credentials,
  random: (bytes: Uint8Array) => Uint8Array = (bytes) => crypto.getRandomValues(bytes),
): Promise<PasskeyRecoveryAssertion> {
  const challenge = random(new Uint8Array(32));
  const assertion = await credentials.get({
    publicKey: {
      challenge,
      rpId,
      ...(onlyCredentialId ? { allowCredentials: [{ type: 'public-key', id: onlyCredentialId }] } : {}),
      userVerification: 'required',
      timeout: 60_000,
    },
  });
  const r = assertion?.response;
  if (!r || !assertion.rawId) throw new PasskeyRecoveryError('NOT_RECOVERABLE');
  return {
    credentialId: asBytes(assertion.rawId).slice(),
    challenge,
    authenticatorData: asBytes(r.authenticatorData).slice(),
    clientDataJSON: asBytes(r.clientDataJSON).slice(),
    signatureDer: asBytes(r.signature).slice(),
  };
}

/** The message a WebAuthn assertion signs: authenticatorData || SHA-256(clientDataJSON). */
export const webAuthnSignedMessage = (authenticatorData: Uint8Array, clientDataJSON: Uint8Array): Uint8Array =>
  concat(authenticatorData, sha256(clientDataJSON));

/** Every raw `X ‖ Y` key that `signatureDer` could have come from. Normally two. */
export function recoverCandidateKeys(message: Uint8Array, signatureDer: Uint8Array): Uint8Array[] {
  const signature = p256.Signature.fromBytes(derToLowS(signatureDer), 'der');
  const digest = sha256(message);
  const found = new Map<string, Uint8Array>();
  for (const bit of [0, 1, 2, 3]) {
    try {
      const xy = signature.addRecoveryBit(bit).recoverPublicKey(digest).toBytes(false).slice(1);
      found.set(bytesToHex(xy), xy);
    } catch { /* this recovery bit names no point on the curve */ }
  }
  return [...found.values()];
}

function verifies(publicKeyXY: Uint8Array, message: Uint8Array, signatureDer: Uint8Array): boolean {
  try {
    return p256.verify(derToLowS(signatureDer), message, concat(Uint8Array.of(0x04), publicKeyXY), { format: 'der', lowS: true });
  } catch {
    return false;
  }
}

/** The same order of checks as core4 `verify_webauthn`, for what can be checked without the key. */
function isConformingAssertion(rpId: string, a: PasskeyRecoveryAssertion): boolean {
  let clientData: { type?: unknown; challenge?: unknown };
  try { clientData = JSON.parse(new TextDecoder().decode(a.clientDataJSON)); } catch { return false; }
  if (clientData?.type !== 'webauthn.get' || clientData.challenge !== base64urlNoPad(a.challenge)) return false;
  if (a.authenticatorData.length < AUTHENTICATOR_DATA_MIN_LEN) return false;
  if (!sameBytes(a.authenticatorData.slice(0, 32), sha256(new TextEncoder().encode(rpId)))) return false;
  const flags = a.authenticatorData[32];
  return (flags & FLAG_USER_PRESENT) !== 0 && (flags & FLAG_USER_VERIFIED) !== 0;
}

/**
 * The credential record the two assertions prove, in the same form creating a passkey stores. Fails closed:
 * different credential IDs, a repeated challenge, a non-conforming assertion, a signature that is not P-256
 * DER, or anything other than exactly one key verifying both all throw `PasskeyRecoveryError`.
 */
export function recoverPasskeyRecord(
  rpId: string,
  first: PasskeyRecoveryAssertion,
  second: PasskeyRecoveryAssertion,
): PasskeyCredentialRecord {
  if (first.credentialId.length === 0 || !sameBytes(first.credentialId, second.credentialId)) {
    throw new PasskeyRecoveryError('DIFFERENT_CREDENTIAL');
  }
  if (sameBytes(first.challenge, second.challenge)
    || !isConformingAssertion(rpId, first) || !isConformingAssertion(rpId, second)) {
    throw new PasskeyRecoveryError('NOT_RECOVERABLE');
  }
  const firstMessage = webAuthnSignedMessage(first.authenticatorData, first.clientDataJSON);
  const secondMessage = webAuthnSignedMessage(second.authenticatorData, second.clientDataJSON);
  let candidates: Uint8Array[];
  try { candidates = recoverCandidateKeys(firstMessage, first.signatureDer); } catch { throw new PasskeyRecoveryError('NOT_RECOVERABLE'); }
  const matches = candidates.filter((xy) => verifies(xy, firstMessage, first.signatureDer) && verifies(xy, secondMessage, second.signatureDer));
  if (matches.length !== 1) throw new PasskeyRecoveryError('NOT_RECOVERABLE');
  return { credentialId: first.credentialId, publicKeyXY: matches[0], rpId };
}
