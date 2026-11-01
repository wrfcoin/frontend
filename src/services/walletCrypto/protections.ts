/**
 * Reads, send checks and WebAuthn for the chain-enforced account protections (chainProtections.ts;
 * the password-signed actions are in protectionActions.ts):
 * "require my YubiKey to spend" (`security_key_spend`) and the send allowlist (`send_allowlist`).
 *
 * Both features are 12-word (ed25519) wallet features: every action is signed by the phrase key, so they
 * are offered only on the 12-word wallet page, never on a passkey wallet.
 *
 * Gate: the build flag `VITE_ENABLE_CHAIN_PROTECTIONS` (exact "true", default off) AND the node's own
 * answer: each read carries whether the feature is active at the next block, and nothing is offered unless
 * it says true. A read that fails hides the controls (fail closed).
 *
 * Relays (same-origin backend, like vaultTransfer.ts), mirroring core4's node routes:
 *   GET  /api/wallet/:address/security-key   → GET  /accounts/{address}/security-key
 *   POST /api/wallet/security-key/actions    → POST /accounts/security-key/actions
 *   GET  /api/wallet/:address/send-allowlist → GET  /accounts/{address}/send-allowlist
 *   POST /api/wallet/send-allowlist/actions  → POST /accounts/send-allowlist/submit (wrapped in a tx)
 */
import { sha256 } from '@noble/hashes/sha2.js';
import { ApiClient } from '../apiClient/client';
import { FEATURES } from '../../config/features';
import { bytesToHex, derToLowS, hexToBytes, passkeyRpId, publicKeyXYFromSpki } from './passkey';
import {
  ALLOWLIST_DEFAULT_DELAY_BLOCKS,
  ALLOWLIST_MAX_DELAY_BLOCKS,
  ALLOWLIST_MIN_DELAY_BLOCKS,
  SECONDS_PER_BLOCK,
  securityKeySpendChallenge,
  type SecurityKeyAssertionWire,
  type SecurityKeyWire,
} from './chainProtections';

export const protectionsClient = new ApiClient({ baseUrl: '/api' });

/** Canonical lowercase 0x address, or a thrown error. */
export function nativeAddress(value: string): string {
  if (!/^0x[0-9a-f]{40}$/.test(value)) throw new Error('Use a full lowercase 0x address (40 hex digits)');
  return value;
}
const encoder = new TextEncoder();

export const KEY_CANCELLED_MESSAGE = 'The security key did not answer. Plug it in, touch it when it blinks, and try again.';
export const KEY_WRONG_SITE_MESSAGE = 'Your security key was registered for a different website, so it cannot sign here. Use the WRFCoin CLI, or the site you registered it on.';

/** True only in a build that turned the screens on. The node still has to say each feature is active. */
export const protectionsBuildEnabled = (): boolean => FEATURES.chainProtections === true;

// ---------------------------------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------------------------------

export interface SecurityKeyStatus {
  address: string;
  next_height: number;
  feature_active_at_next_height: boolean;
  next_nonce: number;
  generation: number;
  required_to_spend: boolean;
  keys: SecurityKeyWire[];
  escape_delay_blocks: number | null;
  pending_escape: { initiated_at_height: number; executable_at_height: number; blocks_remaining: number } | null;
  escape_matured: boolean;
}

export interface PendingAddition {
  address: string;
  requested_at_height: number;
  effective_at_height: number;
}

export interface SendAllowlistView {
  account: string;
  next_action_nonce: number;
  in_force: boolean;
  at_height: number;
  add_delay_blocks: number | null;
  enabled_at_height: number | null;
  allowed: string[];
  pending_additions: PendingAddition[];
  pending_disable: { requested_at_height: number; effective_at_height: number } | null;
  requests_blocked_until_height: number | null;
}

export interface SendAllowlistRead {
  feature_active_next_height: boolean;
  observed_at_height: number;
  allowlist: SendAllowlistView;
}

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const isHex = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-fA-F]*$/.test(v);
const lowerAddr = (v: unknown): string | null => (typeof v === 'string' && /^0x[0-9a-fA-F]{40}$/.test(v) ? v.toLowerCase() : null);

/** Validates the node's status shape; anything unexpected is treated as "not available". */
export function parseSecurityKeyStatus(raw: unknown): SecurityKeyStatus {
  const r = raw as Partial<SecurityKeyStatus> | null;
  if (!r || typeof r !== 'object' || typeof r.feature_active_at_next_height !== 'boolean' || !isInt(r.next_height)
    || !isInt(r.next_nonce) || typeof r.required_to_spend !== 'boolean' || !Array.isArray(r.keys)) {
    throw new Error('Unexpected security-key status');
  }
  const keys = r.keys.filter((k): k is SecurityKeyWire =>
    !!k && isHex(k.public_key_p256) && k.public_key_p256.length === 128 && isHex(k.rp_id_hash) && k.rp_id_hash.length === 64
    && isHex(k.credential_id) && k.credential_id.length >= 2);
  const pe = r.pending_escape;
  return {
    address: String(r.address ?? ''),
    next_height: r.next_height,
    feature_active_at_next_height: r.feature_active_at_next_height,
    next_nonce: r.next_nonce,
    generation: isInt(r.generation) ? r.generation : 0,
    required_to_spend: r.required_to_spend,
    keys,
    escape_delay_blocks: isInt(r.escape_delay_blocks) ? r.escape_delay_blocks : null,
    pending_escape: pe && isInt(pe.executable_at_height) && isInt(pe.initiated_at_height)
      ? { initiated_at_height: pe.initiated_at_height, executable_at_height: pe.executable_at_height, blocks_remaining: isInt(pe.blocks_remaining) ? pe.blocks_remaining : 0 }
      : null,
    escape_matured: r.escape_matured === true,
  };
}

export function parseSendAllowlistRead(raw: unknown): SendAllowlistRead {
  const r = raw as Partial<SendAllowlistRead> | null;
  const v = r?.allowlist as Partial<SendAllowlistView> | undefined;
  if (!r || typeof r.feature_active_next_height !== 'boolean' || !isInt(r.observed_at_height) || !v
    || !isInt(v.next_action_nonce) || typeof v.in_force !== 'boolean' || !isInt(v.at_height)
    || !Array.isArray(v.allowed) || !Array.isArray(v.pending_additions)) {
    throw new Error('Unexpected send-allowlist read');
  }
  const allowed = v.allowed.map(lowerAddr).filter((a): a is string => a !== null);
  const pending = v.pending_additions
    .map(p => ({ address: lowerAddr(p?.address), requested_at_height: p?.requested_at_height, effective_at_height: p?.effective_at_height }))
    .filter((p): p is PendingAddition => p.address !== null && isInt(p.requested_at_height) && isInt(p.effective_at_height));
  const pd = v.pending_disable;
  return {
    feature_active_next_height: r.feature_active_next_height,
    observed_at_height: r.observed_at_height,
    allowlist: {
      account: String(v.account ?? ''),
      next_action_nonce: v.next_action_nonce,
      in_force: v.in_force,
      at_height: v.at_height,
      add_delay_blocks: isInt(v.add_delay_blocks) ? v.add_delay_blocks : null,
      enabled_at_height: isInt(v.enabled_at_height) ? v.enabled_at_height : null,
      allowed,
      pending_additions: pending,
      pending_disable: pd && isInt(pd.effective_at_height) && isInt(pd.requested_at_height) ? { ...pd } : null,
      requests_blocked_until_height: isInt(v.requests_blocked_until_height) ? v.requests_blocked_until_height : null,
    },
  };
}

export async function fetchSecurityKeyStatus(owner: string): Promise<SecurityKeyStatus> {
  return parseSecurityKeyStatus(await protectionsClient.get(`/wallet/${nativeAddress(owner.toLowerCase())}/security-key`));
}

export async function fetchSendAllowlist(owner: string): Promise<SendAllowlistRead> {
  return parseSendAllowlistRead(await protectionsClient.get(`/wallet/${nativeAddress(owner.toLowerCase())}/send-allowlist`));
}

// ---------------------------------------------------------------------------------------------------
// Send checks (run before anything is signed)
// ---------------------------------------------------------------------------------------------------

export type AllowlistDecision =
  | { kind: 'ok' }
  | { kind: 'pending'; effectiveAtHeight: number; etaMs: number }
  | { kind: 'blocked' };

/**
 * core4 `SendAllowlistPolicy::permits` at the read's height: a self-send, an allowed address, or a pending
 * addition that has matured. `null` read (feature off, flag off, or unreadable) → ok: nothing to enforce here,
 * and a send the chain refuses debits nothing.
 */
export function allowlistDecision(read: SendAllowlistRead | null, from: string, to: string, fetchedAtMs: number): AllowlistDecision {
  if (!read || !read.feature_active_next_height || !read.allowlist.in_force) return { kind: 'ok' };
  const a = to.trim().toLowerCase();
  if (a === from.toLowerCase() || read.allowlist.allowed.includes(a)) return { kind: 'ok' };
  const pending = read.allowlist.pending_additions.find(p => p.address === a);
  if (pending) {
    if (pending.effective_at_height <= read.allowlist.at_height) return { kind: 'ok' };
    return { kind: 'pending', effectiveAtHeight: pending.effective_at_height, etaMs: heightEtaMs(read.allowlist.at_height, pending.effective_at_height, fetchedAtMs) };
  }
  return { kind: 'blocked' };
}

/** Estimated wall time for `target` when the next block is `nextHeight` (at 77 s/block). */
export function heightEtaMs(nextHeight: number, target: number, fetchedAtMs: number): number {
  return fetchedAtMs + Math.max(0, target - nextHeight) * SECONDS_PER_BLOCK * 1000;
}

// ---------------------------------------------------------------------------------------------------
// Security keys (WebAuthn)
// ---------------------------------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any -- WebAuthn results are read field by field and checked */
export interface CredentialsLike {
  create?: (options: any) => Promise<any>;
  get: (options: any) => Promise<any>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const asBytes = (b: ArrayBuffer | ArrayBufferView): Uint8Array =>
  b instanceof Uint8Array ? b : ArrayBuffer.isView(b) ? new Uint8Array(b.buffer, b.byteOffset, b.byteLength) : new Uint8Array(b);

const currentRpId = (): string => passkeyRpId(typeof window === 'undefined' ? 'wrfcoin.com' : window.location.hostname);

/**
 * Register a NEW roaming security key (a YubiKey) for `owner`. Non-discoverable, so it does not use one of
 * the key's resident slots; ES256; PIN required. Returns the public wire form core4 stores.
 */
export async function createSecurityKey(owner: string, credentials: CredentialsLike = navigator.credentials): Promise<SecurityKeyWire> {
  if (!credentials?.create) throw new Error('WebAuthn is not available in this browser');
  const rpId = currentRpId();
  const created = await credentials.create({
    publicKey: {
      rp: { id: rpId, name: 'WRFCoin' },
      user: { id: crypto.getRandomValues(new Uint8Array(16)), name: `WRFCoin ${owner.slice(0, 10)}`, displayName: 'WRFCoin wallet' },
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      authenticatorSelection: { authenticatorAttachment: 'cross-platform', residentKey: 'discouraged', userVerification: 'required' },
      hints: ['security-key'],
      attestation: 'none',
      timeout: 120_000,
    },
  }).catch(() => null);
  const spki = created?.response?.getPublicKey?.();
  if (!created || !spki) throw new Error(KEY_CANCELLED_MESSAGE);
  return {
    public_key_p256: bytesToHex(publicKeyXYFromSpki(asBytes(spki))),
    rp_id_hash: bytesToHex(sha256(encoder.encode(rpId))),
    credential_id: bytesToHex(asBytes(created.rawId)),
  };
}

/**
 * One WebAuthn `get()` over `challenge` by any of `keys` (touch + PIN), as core4's assertion wire form.
 * Only keys registered for this site's RP ID can answer here.
 */
export async function assertSecurityKey(keys: readonly SecurityKeyWire[], challenge: Uint8Array, credentials: CredentialsLike = navigator.credentials): Promise<SecurityKeyAssertionWire> {
  const rpId = currentRpId();
  const rpHash = bytesToHex(sha256(encoder.encode(rpId)));
  const usable = keys.filter(k => k.rp_id_hash.toLowerCase() === rpHash);
  if (usable.length === 0) throw new Error(KEY_WRONG_SITE_MESSAGE);
  const assertion = await credentials.get({
    publicKey: {
      challenge,
      rpId,
      allowCredentials: usable.map(k => ({ type: 'public-key', id: hexToBytes(k.credential_id), transports: ['usb', 'nfc'] })),
      userVerification: 'required',
      timeout: 120_000,
    },
  }).catch(() => null);
  if (!assertion?.response) throw new Error(KEY_CANCELLED_MESSAGE);
  const usedId = bytesToHex(asBytes(assertion.rawId)).toLowerCase();
  const key = usable.find(k => k.credential_id.toLowerCase() === usedId);
  if (!key) throw new Error(KEY_CANCELLED_MESSAGE);
  const r = assertion.response;
  return {
    public_key_p256: key.public_key_p256.toLowerCase(),
    authenticator_data: bytesToHex(asBytes(r.authenticatorData)),
    client_data_json: bytesToHex(asBytes(r.clientDataJSON)),
    signature: bytesToHex(derToLowS(asBytes(r.signature))),
  };
}

/** Co-sign one transfer: the spend challenge over the exact ed25519 transfer preimage. */
export function securityKeySpendCoSigner(keys: readonly SecurityKeyWire[], credentials?: CredentialsLike) {
  return (from: string, debitMessage: Uint8Array) =>
    assertSecurityKey(keys, securityKeySpendChallenge(from, debitMessage), credentials);
}

// ---------------------------------------------------------------------------------------------------
// Delay helpers
// ---------------------------------------------------------------------------------------------------

export function clampAllowlistDelay(blocks: number): number {
  if (!Number.isFinite(blocks)) return ALLOWLIST_DEFAULT_DELAY_BLOCKS;
  return Math.min(ALLOWLIST_MAX_DELAY_BLOCKS, Math.max(ALLOWLIST_MIN_DELAY_BLOCKS, Math.round(blocks)));
}

/** Hours → blocks at 77 s/block, clamped to the chain's allowed range. */
export const hoursToDelayBlocks = (hours: number): number => clampAllowlistDelay(Math.ceil((hours * 3600) / SECONDS_PER_BLOCK));
