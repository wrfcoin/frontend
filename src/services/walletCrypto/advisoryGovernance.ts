/**
 * Advisory governance from the website (core4 `advisory_governance`, core4#143 + #146; owner decision
 * 2026-11-09). A wallet proposes a text or votes on one; nothing a proposal says is carried out.
 *
 * Both wallet kinds sign the SAME message, core4 `advisory_action_message`: every component framed by a
 * u64-LE length (tag, chain id, network id, 20 account bytes, encoded action, 8 nonce bytes LE).
 * - 12-word wallet: the ed25519 key signs the message (password unlocks the phrase once).
 * - Passkey wallet: the WebAuthn challenge is SHA3-256(message) (`advisory_passkey_challenge`).
 *
 * The browser builds the `SignedAdvisoryAction` JSON; the backend relay (POST /api/governance/advisory/actions)
 * wraps it into its node transaction exactly as the core4 CLI does. Pinned by vectors core4 wrote
 * (`__tests__/advisoryGovernance-vectors.json`).
 */
import { sha3_256 } from '@noble/hashes/sha3.js';
import { ApiClient } from '../apiClient/client';
import { WRFCOIN_CHAIN_ID } from '../../config/network';
import { FEATURES } from '../../config/features';
import { addressBytes } from './chainProtections';
import { withOwnerKey } from './deviceSession';
import {
  assertPasskey,
  bytesToHex,
  concat,
  passkeyRecordAddress,
  u64le,
  type CredentialsLike,
  type PasskeyAuthJson,
  type PasskeyCredentialRecord,
} from './passkey';

const encoder = new TextEncoder();
export const ADVISORY_ACTION_DOMAIN_TAG = 'wrfcoin.advisory_governance_action.v1';
export const ADVISORY_NETWORK_ID = 'testnet';
export const MAX_TITLE_BYTES = 160;
export const MAX_SUMMARY_BYTES = 1024;
const PROPOSAL_ID_RE = /^adv-[0-9a-f]{16}$/;

export type AdvisoryAction =
  | { kind: 'propose'; title: string; summary: string }
  | { kind: 'vote'; proposalId: string; approve: boolean };

/** u64-LE length then the bytes (core4 `push`). */
const push = (bytes: Uint8Array): Uint8Array => concat(u64le(BigInt(bytes.length)), bytes);

/** core4 `encode_action_for_preimage`. */
export function encodeAdvisoryAction(action: AdvisoryAction): Uint8Array {
  if (action.kind === 'propose') {
    return concat(Uint8Array.of(0x01), push(encoder.encode(action.title)), push(encoder.encode(action.summary)));
  }
  return concat(Uint8Array.of(0x02), push(encoder.encode(action.proposalId)), Uint8Array.of(action.approve ? 1 : 0));
}

/** core4 `advisory_action_message`: the exact bytes both wallet kinds sign. */
export function advisoryActionMessage(chainId: string, networkId: string, account: string, action: AdvisoryAction, nonce: bigint): Uint8Array {
  return concat(
    push(encoder.encode(ADVISORY_ACTION_DOMAIN_TAG)),
    push(encoder.encode(chainId)),
    push(encoder.encode(networkId)),
    push(addressBytes(account)),
    push(encodeAdvisoryAction(action)),
    push(u64le(nonce)),
  );
}

/** core4 `advisory_passkey_challenge`: SHA3-256 of the message. */
export const advisoryPasskeyChallenge = (message: Uint8Array): Uint8Array => sha3_256(message);

/** serde's externally tagged, snake_case form of `AdvisoryAction`. */
function actionJson(action: AdvisoryAction) {
  return action.kind === 'propose'
    ? { propose: { title: action.title, summary: action.summary } }
    : { vote: { proposal_id: action.proposalId, approve: action.approve } };
}

/** The `SignedAdvisoryAction` JSON (serde member order), ed25519 form. */
export function signedEd25519Action(input: {
  chainId: string; networkId: string; account: string; action: AdvisoryAction; nonce: bigint;
  publicKey: Uint8Array; sign: (message: Uint8Array) => Uint8Array;
}) {
  const account = input.account.toLowerCase();
  if (input.nonce > 9007199254740991n) throw new Error('Nonce out of range');
  const message = advisoryActionMessage(input.chainId, input.networkId, account, input.action, input.nonce);
  return {
    account: Array.from(addressBytes(account)),
    action: actionJson(input.action),
    nonce: Number(input.nonce),
    public_key: bytesToHex(input.publicKey),
    signature: bytesToHex(input.sign(message)),
  };
}

/** The `SignedAdvisoryAction` JSON (serde member order), passkey form. */
export function signedPasskeyAction(account: string, action: AdvisoryAction, nonce: bigint, passkey: PasskeyAuthJson) {
  if (nonce > 9007199254740991n) throw new Error('Nonce out of range');
  return { account: Array.from(addressBytes(account.toLowerCase())), action: actionJson(action), nonce: Number(nonce), passkey };
}

/** Text rules as core4 `validate_text` (bytes, controls, bidi). Returns a person-readable problem or null. */
export function advisoryTextProblem(field: 'title' | 'summary', text: string): string | null {
  const name = field === 'title' ? 'The title' : 'The summary';
  if (text.trim() === '') return `${name} is empty.`;
  const max = field === 'title' ? MAX_TITLE_BYTES : MAX_SUMMARY_BYTES;
  const bytes = encoder.encode(text).length;
  if (bytes > max) return `${name} is ${bytes} bytes; the limit is ${max}.`;
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (ch === '\n') {
      if (field === 'title') return 'The title must be one line.';
      continue;
    }
    if (cp <= 0x1f || (cp >= 0x7f && cp <= 0x9f) || (cp >= 0x202a && cp <= 0x202e) || (cp >= 0x2066 && cp <= 0x2069)) {
      return `${name} has a character that is not allowed (U+${cp.toString(16).toUpperCase().padStart(4, '0')}).`;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------------------------------
// Relay (backend governance-routes.ts, ADVISORY_GOVERNANCE_RELAY_ENABLED)
// ---------------------------------------------------------------------------------------------------

/** Build flag for the website propose/vote controls. Default OFF; also needs the node feature active. */
export const advisoryVotingBuildEnabled = (): boolean => FEATURES.advisoryVoting === true;

const client = new ApiClient({ baseUrl: '/api' });

export interface AdvisoryEligibility {
  canVote: boolean;
  reason: string | null;
  voted: 'for' | 'against' | null;
  nextNonce: number | null;
}

export interface AdvisorySubmitted {
  txId: string | null;
  proposalId: string | null;
  nonce: number;
  action: 'propose' | 'vote';
}

export async function fetchAdvisoryNonce(address: string): Promise<bigint> {
  const r = await client.get<{ nonce?: unknown }>(`/governance/advisory/accounts/${address.toLowerCase()}/nonce`);
  if (!Number.isSafeInteger(r?.nonce) || (r.nonce as number) < 0) throw new Error('Could not read the wallet nonce');
  return BigInt(r.nonce as number);
}

export async function fetchAdvisoryEligibility(proposalId: string, address: string): Promise<AdvisoryEligibility> {
  if (!PROPOSAL_ID_RE.test(proposalId)) throw new Error('Not an advisory proposal id');
  const r = await client.get<Record<string, unknown>>(
    `/governance/advisory/proposals/${proposalId}/eligibility?address=${address.toLowerCase()}`,
  );
  return {
    canVote: r?.canVote === true,
    reason: typeof r?.reason === 'string' ? r.reason : null,
    voted: r?.voted === 'for' || r?.voted === 'against' ? r.voted : null,
    nextNonce: Number.isSafeInteger(r?.nextNonce) ? (r.nextNonce as number) : null,
  };
}

async function relay(body: unknown): Promise<AdvisorySubmitted> {
  const r = await client.post<Record<string, unknown>>('/governance/advisory/actions', body);
  return {
    txId: typeof r?.txId === 'string' ? r.txId : null,
    proposalId: typeof r?.proposalId === 'string' ? r.proposalId : null,
    nonce: Number(r?.nonce ?? 0),
    action: r?.action === 'vote' ? 'vote' : 'propose',
  };
}

function chainId(): string {
  if (!WRFCOIN_CHAIN_ID) throw new Error('The signing chain is not configured in this build.');
  return WRFCOIN_CHAIN_ID;
}

export const ADVISORY_UNLOCK_FAILED = 'Could not sign. Check your wallet password and try again.';

/** Sign with the 12-word wallet (password unlocks the phrase once) and relay. */
export async function submitWithPhrase(input: { owner: string; password: string; action: AdvisoryAction; nonce: bigint }): Promise<AdvisorySubmitted> {
  const owner = input.owner.toLowerCase();
  const body = await withOwnerKey(owner, input.password, account => signedEd25519Action({
    chainId: chainId(), networkId: ADVISORY_NETWORK_ID, account: owner, action: input.action, nonce: input.nonce,
    publicKey: account.publicKey, sign: m => account.sign(m),
  })).catch(() => { throw new Error(ADVISORY_UNLOCK_FAILED); });
  return relay(body);
}

/** Sign with the passkey (one WebAuthn prompt, user verification required) and relay. */
export async function submitWithPasskey(input: {
  record: PasskeyCredentialRecord; action: AdvisoryAction; nonce: bigint; credentials?: CredentialsLike;
}): Promise<AdvisorySubmitted> {
  const account = passkeyRecordAddress(input.record).toLowerCase();
  const message = advisoryActionMessage(chainId(), ADVISORY_NETWORK_ID, account, input.action, input.nonce);
  const passkey = await assertPasskey(input.record, advisoryPasskeyChallenge(message), input.credentials);
  return relay(signedPasskeyAction(account, input.action, input.nonce, passkey));
}
