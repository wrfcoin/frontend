import { WRFCOIN_CHAIN_ID } from '../../config/network';
import { ed25519 } from '@noble/curves/ed25519.js';
import { sha3_256 } from '@noble/hashes/sha3.js';
import { bytesToHex, type FirstPartyAccount } from './firstPartyKeys';

export type OwnerAction = 'report_stolen' | 'unfreeze' | 'deactivate' | 'reactivate';
interface StationFields { chainId: string; networkId: 'testnet'; stationId: string }
export interface VoteFields { proposalId: string; approve: boolean }
export interface SecurityFields extends StationFields {
  ownerAddress: string; action: OwnerAction; actionNonce: bigint; expiresAtHeight: bigint;
}
export interface TransferFields extends StationFields {
  fromOwnerAddress: string; toOwnerAddress: string; toOwnerPubkey: string;
  transferNonce: bigint; expiresAtHeight: bigint;
}
export interface AcceptFields extends TransferFields { senderPublicKey: string; senderSignature: string }
/** core4 `SubmitterClass` (transaction.rs): frozen discriminants Device = 1, Relay = 2. */
export type SubmitterClass = 'device' | 'relay';
/** `set_submitter_key` (`station_submitter_key`): approve one key of a class, or `null` to clear the station's key. */
export interface SubmitterKeyFields extends StationFields {
  ownerAddress: string; actionNonce: bigint; expiresAtHeight: bigint;
  submitter: { pubkey: string; class: SubmitterClass } | null;
}
export interface S10Fields {
  vote: VoteFields; stationSecurity: SecurityFields; stationTransfer: TransferFields; stationAccept: AcceptFields;
  /** The website signs Relay approvals and clears only; a Device key is approved from the phone. */
  stationSubmitterKey: SubmitterKeyFields;
}
const encoder = new TextEncoder();
const tags = { transfer: 'wrfcoin_station_owner_transfer_v1', accept: 'wrfcoin_station_owner_transfer_accept_v1', security: 'wrfcoin_station_owner_action_v1' };
const actions: Record<OwnerAction, number> = { report_stolen: 1, unfreeze: 2, deactivate: 3, reactivate: 4 };
/** core4 StationOwnerActionKind::SetSubmitterKey discriminant. */
const SET_SUBMITTER_KEY = 5;
const submitterClasses: Record<SubmitterClass, number> = { device: 1, relay: 2 };
function fail(): never { throw new Error('Invalid typed S10 signing request'); }
function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) { out.set(p, offset); offset += p.length; }
  return out;
}
function frame(text: string): Uint8Array {
  if (typeof text !== 'string' || text.length === 0 || text.length > 1024) fail();
  const bytes = encoder.encode(text);
  const length = new Uint8Array(4);
  new DataView(length.buffer).setUint32(0, bytes.length, true);
  return concat(length, bytes);
}
function u64(n: bigint): Uint8Array {
  if (typeof n !== 'bigint' || n < 0n || n > 0xffffffffffffffffn) fail();
  const out = new Uint8Array(8);
  new DataView(out.buffer).setBigUint64(0, n, true);
  return out;
}
function rawAddress(a: string): string {
  if (typeof a !== 'string' || !/^(?:0x|wrf)[0-9a-f]{40}$/.test(a)) fail();
  return a.replace(/^(?:0x|wrf)/, '');
}
function unhex(s: string, size: number): Uint8Array {
  if (typeof s !== 'string' || !new RegExp(`^[0-9a-f]{${size * 2}}$`).test(s)) fail();
  return Uint8Array.from(s.match(/../g)!, b => parseInt(b, 16));
}
function addressOf(key: Uint8Array): string { return bytesToHex(sha3_256(key).slice(0, 20)); }
function station(f: StationFields): Uint8Array {
  if (!WRFCOIN_CHAIN_ID || f.chainId !== WRFCOIN_CHAIN_ID || f.networkId !== 'testnet' || typeof f.stationId !== 'string' || /\s/.test(f.stationId)) fail();
  return concat(frame(f.chainId), frame(f.networkId), frame(f.stationId));
}
export function governanceVoteMessage(f: VoteFields): Uint8Array {
  if (typeof f.proposalId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(f.proposalId) || typeof f.approve !== 'boolean') fail();
  // Owner-selected mobile v1: deliberately has no chain/network framing.
  return encoder.encode(`governance-vote-v1|${f.proposalId}|${f.approve ? 'approve' : 'reject'}`);
}
export function stationSecurityMessage(f: SecurityFields): Uint8Array {
  rawAddress(f.ownerAddress);
  if (typeof f.action !== 'string' || !Object.prototype.hasOwnProperty.call(actions, f.action)) fail();
  return concat(encoder.encode(tags.security), station(f), frame(f.ownerAddress), new Uint8Array([actions[f.action]]), u64(f.actionNonce), u64(f.expiresAtHeight));
}
/** core4 `is_canonical_submitter_pubkey`: 64 lowercase hex digits that decode to an ed25519 point. */
export function isCanonicalSubmitterPubkey(key: unknown): key is string {
  if (typeof key !== 'string' || !/^[0-9a-f]{64}$/.test(key)) return false;
  try { ed25519.Point.fromHex(key); return true; } catch { return false; }
}
/** core4 `station_owner_set_submitter_message_with_domain` (shared-protocol transaction.rs): the owner-action
 * preimage with discriminant 5, then 0 (clear) or 1 + length-prefixed lowercase-hex key + class byte. */
export function stationSetSubmitterMessage(f: SubmitterKeyFields): Uint8Array {
  rawAddress(f.ownerAddress);
  const base = concat(encoder.encode(tags.security), station(f), frame(f.ownerAddress), new Uint8Array([SET_SUBMITTER_KEY]), u64(f.actionNonce), u64(f.expiresAtHeight));
  if (f.submitter === null) return concat(base, new Uint8Array([0]));
  const sub = f.submitter;
  if (!sub || typeof sub !== 'object' || !isCanonicalSubmitterPubkey(sub.pubkey)
    || typeof sub.class !== 'string' || !Object.prototype.hasOwnProperty.call(submitterClasses, sub.class)) fail();
  return concat(base, new Uint8Array([1]), frame(sub.pubkey), new Uint8Array([submitterClasses[sub.class]]));
}
function transferBody(f: TransferFields): Uint8Array {
  if (rawAddress(f.fromOwnerAddress) === rawAddress(f.toOwnerAddress) || addressOf(unhex(f.toOwnerPubkey, 32)) !== rawAddress(f.toOwnerAddress)) fail();
  return concat(station(f), frame(f.fromOwnerAddress), frame(f.toOwnerAddress), frame(f.toOwnerPubkey), u64(f.transferNonce), u64(f.expiresAtHeight));
}
export function stationTransferMessage(f: TransferFields): Uint8Array { return concat(encoder.encode(tags.transfer), transferBody(f)); }
export function stationAcceptMessage(f: TransferFields): Uint8Array { return concat(encoder.encode(tags.accept), transferBody(f)); }

/** Vault adapter boundary. Only fixed typed messages reach the unlocked account.
 * The UI must re-prompt per action and check live ledger nonce/expiry/feature gates.
 * This core does not unlock, persist keys, submit, or establish ledger readiness.
 */
export function signTyped<K extends keyof S10Fields>(kind: K, fields: S10Fields[K], unlockedKey: FirstPartyAccount) {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) fail();
  const publicKey = new Uint8Array(unlockedKey.publicKey);
  if (publicKey.length !== 32 || addressOf(publicKey) !== rawAddress(unlockedKey.address)) fail();
  const signer = addressOf(publicKey);
  let message: Uint8Array;
  switch (kind) {
  case 'vote': message = governanceVoteMessage(fields as VoteFields); break;
  case 'stationSecurity': {
    const f = fields as SecurityFields;
    if (rawAddress(f.ownerAddress) !== signer) fail();
    message = stationSecurityMessage(f); break;
  }
  case 'stationSubmitterKey': {
    const f = fields as SubmitterKeyFields;
    if (rawAddress(f.ownerAddress) !== signer) fail();
    // Web scope: Relay approvals and clears only. The phone approves its own Device key.
    if (f.submitter !== null && (!f.submitter || f.submitter.class !== 'relay')) fail();
    message = stationSetSubmitterMessage(f); break;
  }
  case 'stationTransfer': {
    const f = fields as TransferFields;
    if (rawAddress(f.fromOwnerAddress) !== signer) fail();
    message = stationTransferMessage(f); break;
  }
  case 'stationAccept': {
    const f = fields as AcceptFields;
    if (rawAddress(f.toOwnerAddress) !== signer || f.toOwnerPubkey !== bytesToHex(publicKey)) fail();
    const senderKey = unhex(f.senderPublicKey, 32);
    if (addressOf(senderKey) !== rawAddress(f.fromOwnerAddress) || !ed25519.verify(unhex(f.senderSignature, 64), stationTransferMessage(f), senderKey)) fail();
    message = stationAcceptMessage(f); break;
  }
  default: return fail();
  }
  const signature = unlockedKey.sign(message);
  if (!ed25519.verify(signature, message, publicKey)) fail();
  return { signer_public_key: bytesToHex(publicKey), signature: bytesToHex(signature) };
}
