/**
 * Passkey (WebAuthn P-256) account support for chain 888 (#2169). Mirrors core4
 * `shared-protocol/src/accounts/passkey.rs`; pinned by `__tests__/passkey.test.ts` against vectors
 * emitted from that code. A passkey account is self-certifying: its address derives from the
 * credential, nothing is registered on-chain, and every transfer carries the credential plus an
 * assertion over a challenge bound to from|to|amount|nonce.
 *
 * NOTE: core4's `hash_bytes` is SHA3-256 (not blake3, as the module docs say); address and challenge
 * both use it.
 */
import { sha256 } from '@noble/hashes/sha2.js';
import { sha3_256 } from '@noble/hashes/sha3.js';

const encoder = new TextEncoder();
const TRANSFER_DOMAIN = encoder.encode('wrfcoin_passkey_transfer_auth_v1');
const ADDRESS_DOMAIN = encoder.encode('wrfcoin.passkey_address.v1');
/** NIST P-256 group order. */
const P256_N = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;

export const bytesToHex = (bytes: Uint8Array): string => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

export function hexToBytes(hex: string): Uint8Array {
  if (!/^(?:[0-9a-fA-F]{2})*$/.test(hex)) throw new Error('Invalid hex');
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
}

const u32le = (n: number): Uint8Array => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n, true); return b; };
export const u64le = (n: bigint): Uint8Array => { const b = new Uint8Array(8); new DataView(b.buffer).setBigUint64(0, n, true); return b; };
export const framed = (s: string): Uint8Array => { const b = encoder.encode(s); return concat(u32le(b.length), b); };

export interface PasskeyTransferFields {
  chainId: string;
  networkId: string;
  from: string;
  to: string;
  amountBaseUnits: bigint;
  nonce: bigint;
}

export interface PasskeyAuthJson {
  public_key_p256: string;
  rp_id_hash: string;
  authenticator_data: string;
  client_data_json: string;
  signature: string;
}

/** `0x` + hex(SHA3-256(domain ‖ rp_id_hash ‖ 0x04 ‖ X ‖ Y)[..20]). */
export function passkeyAddress(rpIdHash: Uint8Array, publicKeyXY: Uint8Array): string {
  if (rpIdHash.length !== 32 || publicKeyXY.length !== 64) throw new Error('Bad passkey credential sizes');
  const digest = sha3_256(concat(ADDRESS_DOMAIN, rpIdHash, Uint8Array.of(0x04), publicKeyXY));
  return `0x${bytesToHex(digest.slice(0, 20))}`;
}

export function passkeyTransferMessage(f: PasskeyTransferFields): Uint8Array {
  return concat(TRANSFER_DOMAIN, framed(f.chainId), framed(f.networkId), framed(f.from), framed(f.to), u64le(f.amountBaseUnits), u64le(f.nonce));
}

/** The 32-byte WebAuthn challenge: SHA3-256(message). */
export const passkeyTransferChallenge = (message: Uint8Array): Uint8Array => sha3_256(message);

/** Raw `X ‖ Y` from the SubjectPublicKeyInfo `AuthenticatorAttestationResponse.getPublicKey()` returns for ES256. */
export function publicKeyXYFromSpki(spki: Uint8Array): Uint8Array {
  // Fixed 26-byte SPKI header for id-ecPublicKey + prime256v1 + BIT STRING(0x00 uncompressed 0x04).
  const header = hexToBytes('3059301306072a8648ce3d020106082a8648ce3d030107034200');
  if (spki.length !== header.length + 65) throw new Error('Not a P-256 SubjectPublicKeyInfo');
  for (let i = 0; i < header.length; i++) if (spki[i] !== header[i]) throw new Error('Not a P-256 SubjectPublicKeyInfo');
  if (spki[header.length] !== 0x04) throw new Error('Expected an uncompressed P-256 point');
  return spki.slice(header.length + 1);
}

function readDerInt(der: Uint8Array, at: number): { value: bigint; next: number } {
  if (der[at] !== 0x02) throw new Error('Malformed DER signature');
  const len = der[at + 1];
  if (len === undefined || len === 0 || len > 33 || at + 2 + len > der.length) throw new Error('Malformed DER signature');
  return { value: BigInt(`0x${bytesToHex(der.slice(at + 2, at + 2 + len))}`), next: at + 2 + len };
}

function derInt(value: bigint): Uint8Array {
  let hex = value.toString(16);
  if (hex.length % 2) hex = `0${hex}`;
  let bytes = hexToBytes(hex);
  if (bytes[0] & 0x80) bytes = concat(Uint8Array.of(0), bytes);
  return concat(Uint8Array.of(0x02, bytes.length), bytes);
}

/**
 * core4 accepts only low-s signatures (malleability). Re-encode an authenticator's DER
 * ECDSA-Sig-Value with s := n − s when s > n/2. Already-low signatures round-trip unchanged.
 */
export function derToLowS(der: Uint8Array): Uint8Array {
  if (der[0] !== 0x30 || der[1] !== der.length - 2) throw new Error('Malformed DER signature');
  const r = readDerInt(der, 2);
  const s = readDerInt(der, r.next);
  if (s.next !== der.length) throw new Error('Malformed DER signature');
  if (r.value === 0n || s.value === 0n || r.value >= P256_N || s.value >= P256_N) throw new Error('Signature out of range');
  const lowS = s.value > P256_N / 2n ? P256_N - s.value : s.value;
  const body = concat(derInt(r.value), derInt(lowS));
  return concat(Uint8Array.of(0x30, body.length), body);
}

export function buildPasskeyAuth(input: {
  publicKeyXY: Uint8Array;
  rpIdHash: Uint8Array;
  authenticatorData: Uint8Array;
  clientDataJSON: Uint8Array;
  signatureDer: Uint8Array;
}): PasskeyAuthJson {
  return {
    public_key_p256: bytesToHex(input.publicKeyXY),
    rp_id_hash: bytesToHex(input.rpIdHash),
    authenticator_data: bytesToHex(input.authenticatorData),
    client_data_json: bytesToHex(input.clientDataJSON),
    signature: bytesToHex(derToLowS(input.signatureDer)),
  };
}

/** The registrable domain every wrfcoin.com host pins its passkeys to. */
export const WRFCOIN_PASSKEY_RP_ID = 'wrfcoin.com';

/**
 * The WebAuthn RP ID for a new passkey on `hostname`. The account address is derived from the RP ID, so
 * every wrfcoin.com host (the bare domain, www, any subdomain) uses the registrable domain and gives the
 * same account. Any other host (localhost, a preview or Tailscale name) keeps its own hostname. Only an
 * exact "wrfcoin.com" or a name ending in ".wrfcoin.com" maps; look-alikes such as "evilwrfcoin.com" or
 * "wrfcoin.com.evil.net" do not. Signing never calls this: it uses the RP ID saved with the credential.
 */
export function passkeyRpId(hostname: string): string {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '');
  if (host === WRFCOIN_PASSKEY_RP_ID || host.endsWith(`.${WRFCOIN_PASSKEY_RP_ID}`)) return WRFCOIN_PASSKEY_RP_ID;
  return hostname;
}

/** True when `rpId` is the shared wrfcoin.com RP ID (the www / bare-domain split no longer applies). */
export const isWrfcoinPasskeyRpId = (rpId: string): boolean => rpId === WRFCOIN_PASSKEY_RP_ID;

/** What is kept locally for a registered passkey (public material only). */
export interface PasskeyCredentialRecord {
  credentialId: Uint8Array;
  publicKeyXY: Uint8Array;
  rpId: string;
}

export const passkeyRecordAddress = (r: PasskeyCredentialRecord): string =>
  passkeyAddress(sha256(encoder.encode(r.rpId)), r.publicKeyXY);

interface CredentialsLike {
  create?: (options: any) => Promise<any>;
  get: (options: any) => Promise<any>;
}

const asBytes = (b: ArrayBuffer | ArrayBufferView): Uint8Array =>
  b instanceof Uint8Array ? b : ArrayBuffer.isView(b) ? new Uint8Array(b.buffer, b.byteOffset, b.byteLength) : new Uint8Array(b);

/**
 * Where the new passkey should live. `any` lets the browser offer whatever it has (this device's
 * screen lock, a phone, a security key). `security-key` asks for a roaming hardware key such as a
 * YubiKey: `authenticatorAttachment: 'cross-platform'` plus the WebAuthn Level 3 `hints` member, which
 * browsers that do not know it ignore.
 */
export type PasskeyAuthenticatorChoice = 'any' | 'security-key';

/**
 * The `publicKey` options for `navigator.credentials.create()`. ES256 only, a discoverable credential,
 * and user verification required (biometric, screen lock or the key's PIN) whichever authenticator is
 * chosen; the choice only adds where the credential should live.
 */
export function passkeyCreationOptions(
  rpId: string,
  label: string,
  choice: PasskeyAuthenticatorChoice = 'any',
  random: (bytes: Uint8Array) => Uint8Array = (bytes) => crypto.getRandomValues(bytes),
) {
  const securityKey = choice === 'security-key';
  return {
    rp: { id: rpId, name: 'WRFCoin' },
    user: { id: random(new Uint8Array(16)), name: label, displayName: label },
    challenge: random(new Uint8Array(32)),
    pubKeyCredParams: [{ type: 'public-key' as const, alg: -7 }],
    authenticatorSelection: {
      ...(securityKey ? { authenticatorAttachment: 'cross-platform' as const } : {}),
      residentKey: 'required' as const,
      userVerification: 'required' as const,
    },
    ...(securityKey ? { hints: ['security-key'] } : {}),
    attestation: 'none' as const,
  };
}

/** WebAuthn `create()` for a new chain account. Requires user verification; ES256 only. */
export async function registerPasskey(
  rpId: string,
  label: string,
  credentials: CredentialsLike = navigator.credentials,
  choice: PasskeyAuthenticatorChoice = 'any',
): Promise<PasskeyCredentialRecord> {
  if (!credentials.create) throw new Error('WebAuthn is not available in this browser');
  const created = await credentials.create({ publicKey: passkeyCreationOptions(rpId, label, choice) });
  if (!created) throw new Error('Passkey registration was cancelled');
  const spki = created.response?.getPublicKey?.();
  if (!spki) throw new Error('This authenticator did not return a P-256 public key');
  return { credentialId: asBytes(created.rawId), publicKeyXY: publicKeyXYFromSpki(asBytes(spki)), rpId };
}

/**
 * One WebAuthn `get()` over `challenge` with the saved credential (user verification required), returned
 * as the `passkey_auth` wire form core4 and the backend verify. Shared by transfers and signed requests.
 */
export async function assertPasskey(
  record: PasskeyCredentialRecord,
  challenge: Uint8Array,
  credentials: CredentialsLike = navigator.credentials,
): Promise<PasskeyAuthJson> {
  const assertion = await credentials.get({
    publicKey: {
      challenge,
      rpId: record.rpId,
      allowCredentials: [{ type: 'public-key', id: record.credentialId }],
      userVerification: 'required',
      timeout: 60_000,
    },
  });
  if (!assertion?.response) throw new Error('Passkey signing was cancelled');
  const r = assertion.response;
  return buildPasskeyAuth({
    publicKeyXY: record.publicKeyXY,
    rpIdHash: sha256(encoder.encode(record.rpId)),
    authenticatorData: asBytes(r.authenticatorData),
    clientDataJSON: asBytes(r.clientDataJSON),
    signatureDer: asBytes(r.signature),
  });
}

/** Ask the authenticator to authorize one transfer; returns the exact `/send-passkey` request body. */
export async function signPasskeyTransfer(
  record: PasskeyCredentialRecord,
  fields: PasskeyTransferFields,
  credentials: CredentialsLike = navigator.credentials,
) {
  const rpIdHash = sha256(encoder.encode(record.rpId));
  if (fields.from.toLowerCase() !== passkeyAddress(rpIdHash, record.publicKeyXY).toLowerCase()) {
    throw new Error('Sender does not match the passkey account');
  }
  const passkeyAuth = await assertPasskey(record, passkeyTransferChallenge(passkeyTransferMessage(fields)), credentials);
  return {
    from: fields.from,
    to: fields.to,
    amount: fields.amountBaseUnits.toString(),
    nonce: fields.nonce.toString(),
    passkey_auth: passkeyAuth,
  };
}
