/**
 * Signing preimages for the two chain-enforced account protections (core4, both unscheduled until the
 * owner schedules them):
 *
 * - `send_allowlist` (core4#102, shared-protocol/src/accounts/send_allowlist.rs): consensus refuses a send
 *   from the account to any address that is not on its list. Additions wait the account's delay.
 * - `security_key_spend` (core4#103, shared-protocol/src/accounts/security_key.rs): every debit from a
 *   12-word wallet needs the phrase signature AND a WebAuthn assertion by a registered security key.
 *
 * Every function here is pure; the byte layouts are pinned by vectors generated from core4 itself
 * (`__tests__/chainProtections-vectors.json`). Both preimages frame each component with a u64 little-endian
 * length (unlike the transfer preimage, which uses u32 framing).
 */
import { sha3_256 } from '@noble/hashes/sha3.js';
import { bytesToHex, concat, hexToBytes, u64le } from './passkey';

const encoder = new TextEncoder();

export const SEND_ALLOWLIST_ACTION_DOMAIN = 'wrfcoin.send_allowlist_action.v1';
export const SECURITY_KEY_ACTION_DOMAIN = 'wrfcoin.security_key_action.v1';
export const SECURITY_KEY_SPEND_DOMAIN = 'wrfcoin.security_key_spend.v1';

/** Chain 888 block cadence (block-heartbeat service). Used only to turn block counts into times. */
export const SECONDS_PER_BLOCK = 77;

// send_allowlist.rs constants.
export const ALLOWLIST_MIN_DELAY_BLOCKS = 1_122; // ~24 h
export const ALLOWLIST_DEFAULT_DELAY_BLOCKS = 2_244; // ~48 h (owner default)
export const ALLOWLIST_MAX_DELAY_BLOCKS = 33_662; // ~30 days
export const ALLOWLIST_MAX_ADDRESSES = 64;
export const ALLOWLIST_MAX_PENDING = 8;

// security_key.rs constants.
export const SECURITY_KEY_MAX_KEYS = 2;
export const SECURITY_KEY_ESCAPE_DEFAULT_BLOCKS = 7_855; // ~7 days (owner decision)

/** u64-LE length prefix, then the bytes: core4's `push` in both modules. */
function push(...parts: Uint8Array[]): Uint8Array {
  return concat(...parts.flatMap(p => [u64le(BigInt(p.length)), p]));
}

const ADDRESS = /^0x[0-9a-f]{40}$/;

/** The 20 raw bytes of a canonical lowercase 0x address. */
export function addressBytes(address: string): Uint8Array {
  const a = address.trim().toLowerCase();
  if (!ADDRESS.test(a)) throw new Error('Use a full 0x address (40 hex digits)');
  return hexToBytes(a.slice(2));
}

// ---------------------------------------------------------------------------------------------------
// Send allowlist
// ---------------------------------------------------------------------------------------------------

export type SendAllowlistAction =
  | { kind: 'enable'; addDelayBlocks: number; allowed: string[] }
  | { kind: 'request_add'; address: string }
  | { kind: 'cancel_add'; address: string }
  | { kind: 'remove'; address: string }
  | { kind: 'raise_delay'; addDelayBlocks: number }
  | { kind: 'request_disable' }
  | { kind: 'cancel_disable' };

function encodeAllowlistAction(action: SendAllowlistAction): Uint8Array {
  switch (action.kind) {
  case 'enable':
    return concat(
      push(Uint8Array.of(0)),
      push(u64le(BigInt(action.addDelayBlocks))),
      push(u64le(BigInt(action.allowed.length))),
      ...action.allowed.map(a => push(addressBytes(a))),
    );
  case 'request_add': return push(Uint8Array.of(1), addressBytes(action.address));
  case 'cancel_add': return push(Uint8Array.of(2), addressBytes(action.address));
  case 'remove': return push(Uint8Array.of(3), addressBytes(action.address));
  case 'raise_delay': return push(Uint8Array.of(4), u64le(BigInt(action.addDelayBlocks)));
  case 'request_disable': return push(Uint8Array.of(5));
  case 'cancel_disable': return push(Uint8Array.of(6));
  }
}

/** `send_allowlist_action_message`: the exact bytes the account's ed25519 key signs. */
export function sendAllowlistActionMessage(chainId: string, account: string, action: SendAllowlistAction, actionNonce: bigint): Uint8Array {
  return push(
    encoder.encode(SEND_ALLOWLIST_ACTION_DOMAIN),
    encoder.encode(chainId),
    addressBytes(account),
    encodeAllowlistAction(action),
    u64le(actionNonce),
  );
}

/** core4 `Address` has derived serde: JSON is an array of 20 byte values. */
const addressJson = (address: string): number[] => Array.from(addressBytes(address));

/** serde's externally tagged form of `SendAllowlistAction`. */
function allowlistActionJson(action: SendAllowlistAction): unknown {
  switch (action.kind) {
  case 'enable': return { Enable: { add_delay_blocks: action.addDelayBlocks, allowed: action.allowed.map(addressJson) } };
  case 'request_add': return { RequestAdd: { address: addressJson(action.address) } };
  case 'cancel_add': return { CancelAdd: { address: addressJson(action.address) } };
  case 'remove': return { Remove: { address: addressJson(action.address) } };
  case 'raise_delay': return { RaiseDelay: { add_delay_blocks: action.addDelayBlocks } };
  case 'request_disable': return 'RequestDisable';
  case 'cancel_disable': return 'CancelDisable';
  }
}

/**
 * The `SignedSendAllowlistAction` JSON core4 parses from a SendAllowlist transaction's `data`
 * (field order as serde writes it).
 */
export function signedSendAllowlistAction(input: {
  chainId: string;
  account: string;
  action: SendAllowlistAction;
  actionNonce: bigint;
  publicKey: Uint8Array;
  sign: (message: Uint8Array) => Uint8Array;
}) {
  const account = input.account.toLowerCase();
  const message = sendAllowlistActionMessage(input.chainId, account, input.action, input.actionNonce);
  if (input.actionNonce > 9007199254740991n) throw new Error('Action nonce out of range');
  return {
    account: addressJson(account),
    action: allowlistActionJson(input.action),
    action_nonce: Number(input.actionNonce),
    public_key: bytesToHex(input.publicKey),
    signature: bytesToHex(input.sign(message)),
  };
}

// ---------------------------------------------------------------------------------------------------
// Security keys
// ---------------------------------------------------------------------------------------------------

/** Hex wire form of a key (`SecurityKeyWire`). */
export interface SecurityKeyWire {
  public_key_p256: string;
  rp_id_hash: string;
  credential_id: string;
}

/** Hex wire form of one assertion (`SecurityKeyAssertionWire`). */
export interface SecurityKeyAssertionWire {
  public_key_p256: string;
  authenticator_data: string;
  client_data_json: string;
  signature: string;
}

export type SecurityKeyActionBody =
  | { kind: 'enable'; key: SecurityKeyWire; escape_delay_blocks: number }
  | { kind: 'add_key'; key: SecurityKeyWire }
  | { kind: 'remove_key'; public_key_p256: string }
  | { kind: 'disable' }
  | { kind: 'begin_escape' }
  | { kind: 'cancel_escape' };

function wireKeyBytes(key: SecurityKeyWire): Uint8Array[] {
  const pub = hexToBytes(key.public_key_p256.trim());
  const rp = hexToBytes(key.rp_id_hash.trim());
  const cred = hexToBytes(key.credential_id.trim());
  if (pub.length !== 64 || rp.length !== 32 || cred.length < 1 || cred.length > 255) throw new Error('Malformed security key');
  return [pub, rp, cred];
}

function encodeSecurityKeyBody(body: SecurityKeyActionBody): Uint8Array {
  switch (body.kind) {
  case 'enable': return push(Uint8Array.of(1), ...wireKeyBytes(body.key), u64le(BigInt(body.escape_delay_blocks)));
  case 'add_key': return push(Uint8Array.of(2), ...wireKeyBytes(body.key));
  case 'remove_key': {
    const pub = hexToBytes(body.public_key_p256.trim());
    if (pub.length !== 64) throw new Error('Malformed security key');
    return push(Uint8Array.of(3), pub);
  }
  case 'disable': return push(Uint8Array.of(4));
  case 'begin_escape': return push(Uint8Array.of(5));
  case 'cancel_escape': return push(Uint8Array.of(6));
  }
}

/** `security_key::action_message`: what the phrase key signs for an action. */
export function securityKeyActionMessage(chainId: string, networkId: string, account: string, nonce: bigint, body: SecurityKeyActionBody): Uint8Array {
  return push(
    encoder.encode(SECURITY_KEY_ACTION_DOMAIN),
    encoder.encode(chainId),
    encoder.encode(networkId),
    addressBytes(account),
    u64le(nonce),
    encodeSecurityKeyBody(body),
  );
}

/** The WebAuthn challenge a key signs to co-sign an action: SHA3-256 of the action message. */
export const securityKeyActionChallenge = (actionMessage: Uint8Array): Uint8Array => sha3_256(actionMessage);

/**
 * The WebAuthn challenge a key signs to co-sign a spend: binds the account and the exact ed25519 debit
 * preimage (for a transfer, `transparentTransferMessage`).
 */
export function securityKeySpendChallenge(account: string, debitMessage: Uint8Array): Uint8Array {
  return sha3_256(push(encoder.encode(SECURITY_KEY_SPEND_DOMAIN), addressBytes(account), debitMessage));
}

/** The `SecurityKeyActionPayload` the node's `POST /accounts/security-key/actions` takes. */
export function securityKeyActionPayload(input: {
  account: string;
  nonce: bigint;
  action: SecurityKeyActionBody;
  ownerPublicKey: Uint8Array;
  ownerSignature: Uint8Array;
  keyAssertions: SecurityKeyAssertionWire[];
}) {
  if (input.nonce > 9007199254740991n) throw new Error('Action nonce out of range');
  return {
    account: input.account.toLowerCase(),
    nonce: Number(input.nonce),
    action: input.action,
    owner_public_key: bytesToHex(input.ownerPublicKey),
    owner_signature: bytesToHex(input.ownerSignature),
    key_assertions: input.keyAssertions,
  };
}

// ---------------------------------------------------------------------------------------------------
// Blocks → time
// ---------------------------------------------------------------------------------------------------

/** "about 48 hours" / "about 7 days" for a block count at 77 s/block. */
export function aboutBlocks(blocks: number): string {
  const hours = (Math.max(0, blocks) * SECONDS_PER_BLOCK) / 3600;
  if (hours < 72) {
    const h = Math.max(1, Math.round(hours));
    return `about ${h} hour${h === 1 ? '' : 's'}`;
  }
  const d = Math.round(hours / 24);
  return `about ${d} days`;
}

/** Live countdown text from a number of milliseconds left: "1 d 23 h 59 m 12 s". */
export function formatCountdown(msLeft: number): string {
  let s = Math.max(0, Math.floor(msLeft / 1000));
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  const parts = [d ? `${d} d` : '', d || h ? `${h} h` : '', `${m} m`, `${s} s`].filter(Boolean);
  return parts.join(' ');
}
