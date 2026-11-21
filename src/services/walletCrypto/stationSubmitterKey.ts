import { WRFCOIN_CHAIN_ID } from '../../config/network';
import { readVault, unlockVault } from '../walletVault';
import { ApiClient } from '../apiClient/client';
import { toStationAlias, isStationAlias } from '../../utils/stationAlias';
import { bytesToHex, deriveAccount } from './firstPartyKeys';
import { isCanonicalSubmitterPubkey, signTyped, type SubmitterKeyFields } from './s10Signing';

/**
 * Website `set_submitter_key` (core4 `station_submitter_key`, #3565 design 1): the station owner approves ONE Relay
 * key (for example a house collector) that may sign contribution commits for the station, or clears it. A Device key
 * is approved from the phone, never here. The payload is core4 `StationSubmitterKeyPayload`
 * (shared-protocol station_owner.rs), relayed verbatim by the backend `POST /api/stations/{alias}/owner-actions`.
 */

// Same-origin admitted relay only; a configurable service URL cannot redirect a signed owner action.
const client = new ApiClient({ baseUrl: '/api' });

/** How long a signed action stays valid. core4 caps it at 10,000 blocks; ~1,000 blocks is about 21 h at 77 s. */
export const SUBMITTER_KEY_VALIDITY_BLOCKS = 1000;

export interface SubmitterKeyRequest {
  /** RAW station id: it is part of the signed bytes, so an alias cannot be signed. */
  stationId: string;
  /** The owner address the ownership read reported for this wallet (full, lowercase). */
  ownerAddress: string;
  /** Owner nonce from the ownership read, the nonce this action must carry. */
  ownerNonce: number;
  /** `observedAtHeight` from the same read. */
  observedAtHeight: number;
  /** Lowercase hex ed25519 key to approve as the Relay, or `null` to clear the station's submitter key. */
  relayPubkey: string | null;
}

/** Trim + lowercase what the owner pasted. The result is checked with core4's canonical-key rule before signing. */
export function normalizeSubmitterKeyInput(raw: string): string {
  return raw.trim().replace(/^0x/i, '').toLowerCase();
}

export function submitterKeyInputError(key: string, ownerPublicKeyHex?: string | null): string | null {
  if (key.length === 0) return 'Paste the relay\'s public key.';
  if (!/^[0-9a-f]*$/.test(key)) return 'A public key uses only the digits 0-9 and letters a-f.';
  if (key.length !== 64) return `A public key is 64 hex characters; this one has ${key.length}.`;
  if (!isCanonicalSubmitterPubkey(key)) return 'This is not a valid ed25519 public key.';
  if (ownerPublicKeyHex && key === ownerPublicKeyHex) return 'That is the owner key itself; it can already submit.';
  return null;
}

/** The exact payload object; fields in core4 order. A clear omits submitter_pubkey/submitter_class. */
export function buildSubmitterKeyPayload(f: SubmitterKeyFields, ownerPubkey: string, ownerSignature: string): Record<string, unknown> {
  return {
    tx_kind: 'station_owner_action_v1',
    station_id: f.stationId,
    owner_address: f.ownerAddress,
    owner_pubkey: ownerPubkey,
    action: 'set_submitter_key',
    action_nonce: Number(f.actionNonce),
    expires_at_height: Number(f.expiresAtHeight),
    owner_signature: ownerSignature,
    ...(f.submitter ? { submitter_pubkey: f.submitter.pubkey, submitter_class: f.submitter.class } : {}),
  };
}

export function submitterKeyFields(r: SubmitterKeyRequest): SubmitterKeyFields {
  if (!WRFCOIN_CHAIN_ID) throw new Error('Signing chain is not configured');
  if (isStationAlias(r.stationId)) throw new Error('The raw station id is needed to sign');
  if (!Number.isSafeInteger(r.ownerNonce) || r.ownerNonce < 0 || !Number.isSafeInteger(r.observedAtHeight) || r.observedAtHeight < 0) {
    throw new Error('Ownership state is incomplete');
  }
  if (r.relayPubkey !== null && !isCanonicalSubmitterPubkey(r.relayPubkey)) throw new Error('Invalid relay key');
  return {
    chainId: WRFCOIN_CHAIN_ID,
    networkId: 'testnet',
    stationId: r.stationId,
    ownerAddress: r.ownerAddress.toLowerCase(),
    actionNonce: BigInt(r.ownerNonce),
    expiresAtHeight: BigInt(r.observedAtHeight + SUBMITTER_KEY_VALIDITY_BLOCKS),
    submitter: r.relayPubkey === null ? null : { pubkey: r.relayPubkey, class: 'relay' },
  };
}

/** Unlock the browser vault, sign ONE set_submitter_key action, drop the key. No key, words or password escape. */
export async function signSubmitterKeyAction(r: SubmitterKeyRequest, password: string): Promise<Record<string, unknown>> {
  const f = submitterKeyFields(r);
  if (readVault()?.address.toLowerCase() !== f.ownerAddress) {
    throw new Error('The wallet saved in this browser is not this station\'s owner.');
  }
  let words: Awaited<ReturnType<typeof unlockVault>> | null = null;
  let account: ReturnType<typeof deriveAccount> | null = null;
  try {
    words = await unlockVault(password);
    account = deriveAccount(words.mnemonic);
    words.mnemonic = '';
    if (account.address.toLowerCase() !== f.ownerAddress) throw new Error('Wallet changed');
    // The owner key can already submit; approving it as its own relay would only burn a nonce.
    if (f.submitter && f.submitter.pubkey === bytesToHex(account.publicKey)) throw new Error('Owner key');
    const signed = signTyped('stationSubmitterKey', f, account);
    return buildSubmitterKeyPayload(f, bytesToHex(account.publicKey), signed.signature);
  } catch {
    // Never echo a crypto exception, password, mnemonic or key to UI/logs.
    throw new Error('Unable to sign. Check your password and wallet, then try again.');
  } finally {
    if (words) words.mnemonic = '';
    account?.destroy?.();
  }
}

export interface SubmitterKeyAccepted { status: 'accepted_pending_confirmation'; transactionIds: string[] }

/** Relay one signed payload. 201 means accepted, NOT applied: confirm by re-reading the ownership state. */
export async function submitSubmitterKeyAction(stationId: string, payload: Record<string, unknown>): Promise<SubmitterKeyAccepted> {
  const response = await client.post<{ status?: unknown; transactionIds?: unknown }>(
    `/stations/${encodeURIComponent(toStationAlias(stationId))}/owner-actions`,
    { kind: 'owner_action', payload },
  );
  if (response?.status !== 'accepted_pending_confirmation') throw new Error('The relay did not accept the action');
  const ids = Array.isArray(response.transactionIds) ? response.transactionIds.filter((x): x is string => typeof x === 'string') : [];
  return { status: 'accepted_pending_confirmation', transactionIds: ids };
}
