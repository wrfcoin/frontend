/**
 * Session keys with spending limits (core4 feature `session_keys`).
 *
 * A device key is a separate ed25519 key that the owner registers on chain
 * with limits: which methods it may use, which recipients, how much per send,
 * per window (about a day) and in total, and for how many blocks. It signs
 * small sends and sign-ins without the recovery phrase. Bytes here are pinned
 * by core4's `wallet_client_golden_vectors` (see
 * __fixtures__/session-key-golden-vectors.json).
 */
import { bytesToHex } from './firstPartyKeys';

const encoder = new TextEncoder();

export const SESSION_KEY_TRANSFER_DOMAIN = 'wrfcoin_session_key_transfer_auth_v1';
export const SESSION_KEY_REGISTER_DOMAIN = 'wrfcoin.session_key_register.v1';
export const SESSION_KEY_REVOKE_DOMAIN = 'wrfcoin.session_key_revoke.v1';
/** "Any recipient". An empty target list allows nobody. */
export const ANY_TARGET = `0x${'ff'.repeat(20)}`;

export const BASE_UNITS_PER_WRF = 100_000_000n;
/** ~1 day of blocks at chain 888's ~77 s cadence. */
export const BLOCKS_PER_DAY = 1122;
export const DEFAULT_LIFETIME_DAYS = 90;
export const DEFAULT_PER_SEND = 10n * BASE_UNITS_PER_WRF;
export const DEFAULT_PER_DAY = 10n * BASE_UNITS_PER_WRF;
export const DEFAULT_TOTAL = 300n * BASE_UNITS_PER_WRF;
export const DEFAULT_METHODS = ['transfer', 'wallet_login'] as const;

export interface SessionKeyGrant {
  publicKey: string;
  scope: {
    allowedMethods: readonly string[];
    allowedTargets: readonly string[];
    maxValuePerUse: bigint;
    maxTotalValue: bigint;
    window: { blocks: number; maxValue: bigint } | null;
  };
  validFrom: number;
  validUntil: number;
  maxUses: number | null;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) { out.set(p, offset); offset += p.length; }
  return out;
}

function u32le(value: number): Uint8Array {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value, true);
  return out;
}

function u64le(value: bigint | number): Uint8Array {
  const out = new Uint8Array(8);
  new DataView(out.buffer).setBigUint64(0, BigInt(value), true);
  return out;
}

function u128le(value: bigint): Uint8Array {
  if (value < 0n || value >= 1n << 128n) throw new Error('u128 out of range');
  return concat(u64le(value & 0xffffffffffffffffn), u64le(value >> 64n));
}

/** u32le(len) || utf8 — the transfer preimage framing. */
function framed32(value: string): Uint8Array {
  const bytes = encoder.encode(value);
  return concat(u32le(bytes.length), bytes);
}

/** u64le(len) || bytes — the register / revoke framing. */
function lp(bytes: Uint8Array): Uint8Array {
  return concat(u64le(bytes.length), bytes);
}

export function hexToBytes(hex: string): Uint8Array {
  if (!/^(?:[0-9a-fA-F]{2})*$/.test(hex)) throw new Error('invalid hex');
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function addressBytes(address: string): Uint8Array {
  if (!/^0x[0-9a-f]{40}$/.test(address)) throw new Error('expected a lowercase 0x address');
  return hexToBytes(address.slice(2));
}

/** core4 serde Address: a JSON array of 20 byte numbers. */
export function addressToByteArray(address: string): number[] {
  return Array.from(addressBytes(address));
}

export function sessionKeyTransferMessage(input: {
  chainId: string; networkId: string; from: string; to: string; amountBaseUnits: bigint; nonce: bigint; sessionPublicKey: string;
}): Uint8Array {
  return concat(
    encoder.encode(SESSION_KEY_TRANSFER_DOMAIN),
    framed32(input.chainId),
    framed32(input.networkId),
    framed32(input.from),
    framed32(input.to),
    u64le(input.amountBaseUnits),
    u64le(input.nonce),
    hexToBytes(input.sessionPublicKey),
  );
}

/** Signed by BOTH the owner's primary key and the device key. */
export function sessionKeyRegisterMessage(input: {
  chainId: string; owner: string; registrationNonce: number; grant: SessionKeyGrant;
}): Uint8Array {
  const { grant } = input;
  const { scope } = grant;
  return concat(
    lp(encoder.encode(SESSION_KEY_REGISTER_DOMAIN)),
    lp(encoder.encode(input.chainId)),
    lp(addressBytes(input.owner)),
    lp(u64le(input.registrationNonce)),
    lp(hexToBytes(grant.publicKey)),
    u64le(scope.allowedMethods.length),
    ...scope.allowedMethods.map(m => lp(encoder.encode(m))),
    u64le(scope.allowedTargets.length),
    ...scope.allowedTargets.map(addressBytes),
    u128le(scope.maxValuePerUse),
    u128le(scope.maxTotalValue),
    u64le(grant.validFrom),
    u64le(grant.validUntil),
    grant.maxUses === null ? new Uint8Array([0]) : concat(new Uint8Array([1]), u32le(grant.maxUses)),
    ...(scope.window ? [encoder.encode('window'), u64le(scope.window.blocks), u128le(scope.window.maxValue)] : []),
  );
}

/** Signed by the owner's primary key. */
export function sessionKeyRevokeMessage(input: {
  chainId: string; owner: string; sessionKey: string; registrationNonce: number;
}): Uint8Array {
  return concat(
    lp(encoder.encode(SESSION_KEY_REVOKE_DOMAIN)),
    lp(encoder.encode(input.chainId)),
    lp(addressBytes(input.owner)),
    lp(addressBytes(input.sessionKey)),
    lp(u64le(input.registrationNonce)),
  );
}

/** u128 limits go on the wire as JSON numbers (serde); refuse what JSON cannot carry exactly. */
function jsonU128(value: bigint): number {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('limit too large for this wallet');
  return Number(value);
}

export function registerActionBody(input: {
  chainId: string; owner: string; registrationNonce: number; grant: SessionKeyGrant;
  ownerPublicKey: string; ownerSign: (m: Uint8Array) => Uint8Array; sessionSignature: Uint8Array;
}) {
  const { grant } = input;
  const { scope } = grant;
  const message = sessionKeyRegisterMessage(input);
  return {
    action: {
      Register: {
        owner: addressToByteArray(input.owner),
        registration_nonce: input.registrationNonce,
        grant: {
          public_key: grant.publicKey,
          scope: {
            allowed_methods: [...scope.allowedMethods],
            allowed_targets: scope.allowedTargets.map(addressToByteArray),
            max_value_per_use: jsonU128(scope.maxValuePerUse),
            max_total_value: jsonU128(scope.maxTotalValue),
            window: scope.window ? { blocks: scope.window.blocks, max_value: jsonU128(scope.window.maxValue) } : null,
          },
          valid_from: grant.validFrom,
          valid_until: grant.validUntil,
          max_uses: grant.maxUses,
        },
        owner_public_key: input.ownerPublicKey,
        owner_signature: bytesToHex(input.ownerSign(message)),
        session_signature: bytesToHex(input.sessionSignature),
      },
    },
  };
}

export function revokeActionBody(input: {
  chainId: string; owner: string; sessionKey: string; registrationNonce: number;
  ownerPublicKey: string; ownerSign: (m: Uint8Array) => Uint8Array;
}) {
  return {
    action: {
      Revoke: {
        owner: addressToByteArray(input.owner),
        session_key: addressToByteArray(input.sessionKey),
        owner_public_key: input.ownerPublicKey,
        owner_signature: bytesToHex(input.ownerSign(sessionKeyRevokeMessage(input))),
      },
    },
  };
}

/** The everyday grant: 10 WRF a send, 10 WRF a day, 300 WRF in all, for 90 days. */
export function defaultGrant(input: { publicKey: string; nextHeight: number; recipients: readonly string[] | 'anyone' }): SessionKeyGrant {
  const targets = input.recipients === 'anyone' ? [ANY_TARGET] : [...new Set(input.recipients.map(r => r.trim().toLowerCase()))];
  if (targets.length === 0) throw new Error('Add at least one address, or allow anyone');
  if (targets.length > 64) throw new Error('At most 64 addresses');
  for (const t of targets) addressBytes(t);
  return {
    publicKey: input.publicKey,
    scope: {
      allowedMethods: [...DEFAULT_METHODS],
      allowedTargets: targets,
      maxValuePerUse: DEFAULT_PER_SEND,
      maxTotalValue: DEFAULT_TOTAL,
      window: { blocks: BLOCKS_PER_DAY, maxValue: DEFAULT_PER_DAY },
    },
    validFrom: input.nextHeight,
    validUntil: input.nextHeight + DEFAULT_LIFETIME_DAYS * BLOCKS_PER_DAY,
    maxUses: null,
  };
}

// ---- the node's list (GET /api/wallet/:address/session-keys) ---------------------

export interface SessionKeyRecord {
  session_key: string;
  public_key: string;
  registration_nonce: number;
  status: 'active' | 'revoked' | 'expired' | 'not_yet_valid' | 'exhausted' | string;
  allowed_methods: string[];
  any_target: boolean;
  allowed_targets: string[];
  max_value_per_use: string;
  max_total_value: string;
  total_remaining: string;
  window: { blocks: number; max_value: string; remaining: string; window_ends_at_height: number } | null;
  valid_from: number;
  valid_until: number;
  max_uses: number | null;
  uses_so_far: number;
  cumulative_value_used: string;
  revoked: boolean;
}

export interface SessionKeyList {
  owner: string;
  feature_active: boolean;
  next_height: number;
  next_registration_nonce: number;
  chain_id: string;
  session_keys: SessionKeyRecord[];
}

const units = (value: unknown): bigint | null =>
  typeof value === 'string' && /^(0|[1-9]\d{0,38})$/.test(value) ? BigInt(value) : null;

export type DeviceSendCheck =
  | { ok: true }
  | { ok: false; reason: 'feature-off' | 'no-key' | 'inactive' | 'recipient' | 'per-send' | 'daily' | 'total' | 'refused' };

/** Can this device's key authorize `amount` to `to` right now? Mirrors core4's check_transfer. */
export function checkDeviceSend(list: SessionKeyList | null, publicKey: string | null, to: string, amount: bigint): DeviceSendCheck {
  if (!list || list.feature_active !== true) return { ok: false, reason: 'feature-off' };
  const record = publicKey ? list.session_keys.find(r => r.public_key?.toLowerCase() === publicKey.toLowerCase()) : undefined;
  if (!record) return { ok: false, reason: 'no-key' };
  if (record.status !== 'active' || !record.allowed_methods?.includes('transfer')) return { ok: false, reason: 'inactive' };
  const target = to.toLowerCase();
  if (!record.any_target && !record.allowed_targets?.map(t => t.toLowerCase()).includes(target)) return { ok: false, reason: 'recipient' };
  const perUse = units(record.max_value_per_use);
  if (perUse === null || amount > perUse) return { ok: false, reason: 'per-send' };
  if (record.window) {
    const left = units(record.window.remaining);
    if (left === null || amount > left) return { ok: false, reason: 'daily' };
  }
  const total = units(record.total_remaining);
  if (total === null || amount > total) return { ok: false, reason: 'total' };
  return { ok: true };
}

export function findDeviceRecord(list: SessionKeyList | null, publicKey: string | null): SessionKeyRecord | null {
  if (!list || !publicKey) return null;
  return list.session_keys.find(r => r.public_key?.toLowerCase() === publicKey.toLowerCase()) ?? null;
}

export function formatWrf(baseUnits: bigint): string {
  const whole = baseUnits / BASE_UNITS_PER_WRF;
  const frac = (baseUnits % BASE_UNITS_PER_WRF).toString().padStart(8, '0').replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole.toString();
}

export function wrfLabel(value: string | null | undefined): string {
  const v = units(value);
  return v === null ? '—' : `${formatWrf(v)} WRF`;
}
