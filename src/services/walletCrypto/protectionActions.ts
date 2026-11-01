/**
 * Signed actions for the chain-enforced protections (see protections.ts for the gate and the relays).
 * Each action unlocks the 12-word phrase once with the wallet password, signs, and forgets the key.
 */
import { WRFCOIN_CHAIN_ID } from '../../config/network';
import { withOwnerKey } from './deviceSession';
import {
  SECURITY_KEY_ESCAPE_DEFAULT_BLOCKS,
  SECURITY_KEY_MAX_KEYS,
  securityKeyActionChallenge,
  securityKeyActionMessage,
  securityKeyActionPayload,
  signedSendAllowlistAction,
  type SecurityKeyActionBody,
  type SecurityKeyAssertionWire,
  type SecurityKeyWire,
  type SendAllowlistAction,
} from './chainProtections';
import {
  assertSecurityKey,
  createSecurityKey,
  nativeAddress,
  protectionsClient as client,
  type CredentialsLike,
  type SecurityKeyStatus,
  type SendAllowlistRead,
} from './protections';

const NETWORK_ID = 'testnet';
export const PROTECTIONS_UNLOCK_FAILED = 'Could not sign. Check your wallet password and try again.';

function chainId(): string {
  if (!WRFCOIN_CHAIN_ID) throw new Error('Signing chain is not configured');
  return WRFCOIN_CHAIN_ID;
}

/**
 * Turn on "require my security key to spend": register the new key, have it co-sign the enable action
 * (proof of possession), sign the same action with the phrase key, submit. Escape delay is the owner's
 * 7-day default.
 */
export async function enableSecurityKey(input: { owner: string; password: string; status: SecurityKeyStatus; credentials?: CredentialsLike }): Promise<void> {
  const owner = nativeAddress(input.owner.toLowerCase());
  if (!input.status.feature_active_at_next_height) throw new Error('Not active on the network yet');
  const key = await createSecurityKey(owner, input.credentials);
  const action: SecurityKeyActionBody = { kind: 'enable', key, escape_delay_blocks: SECURITY_KEY_ESCAPE_DEFAULT_BLOCKS };
  await submitSecurityKeyAction(owner, input.password, input.status.next_nonce, action, [[key]], input.credentials);
}

/** Add a spare key (max 2): an existing key AND the new key both co-sign. */
export async function addSecurityKey(input: { owner: string; password: string; status: SecurityKeyStatus; credentials?: CredentialsLike }): Promise<void> {
  const owner = nativeAddress(input.owner.toLowerCase());
  if (input.status.keys.length >= SECURITY_KEY_MAX_KEYS) throw new Error(`At most ${SECURITY_KEY_MAX_KEYS} keys`);
  const existing = input.status.keys;
  const key = await createSecurityKey(owner, input.credentials);
  await submitSecurityKeyAction(owner, input.password, input.status.next_nonce, { kind: 'add_key', key }, [existing, [key]], input.credentials);
}

/** Cancel a pending phrase-only escape (needs a registered key). */
export async function cancelSecurityKeyEscape(input: { owner: string; password: string; status: SecurityKeyStatus; credentials?: CredentialsLike }): Promise<void> {
  const owner = nativeAddress(input.owner.toLowerCase());
  await submitSecurityKeyAction(owner, input.password, input.status.next_nonce, { kind: 'cancel_escape' }, [input.status.keys], input.credentials);
}

async function submitSecurityKeyAction(
  owner: string,
  password: string,
  nonce: number,
  action: SecurityKeyActionBody,
  assertWith: SecurityKeyWire[][],
  credentials?: CredentialsLike,
): Promise<void> {
  const message = securityKeyActionMessage(chainId(), NETWORK_ID, owner, BigInt(nonce), action);
  const challenge = securityKeyActionChallenge(message);
  // Touch the key(s) first: a cancelled touch should not cost a slow password unlock.
  const keyAssertions: SecurityKeyAssertionWire[] = [];
  for (const keys of assertWith) keyAssertions.push(await assertSecurityKey(keys, challenge, credentials));
  const signed = await withOwnerKey(owner, password, account => ({ publicKey: account.publicKey, signature: account.sign(message) }))
    .catch(() => { throw new Error(PROTECTIONS_UNLOCK_FAILED); });
  await client.post('/wallet/security-key/actions', securityKeyActionPayload({
    account: owner, nonce: BigInt(nonce), action, ownerPublicKey: signed.publicKey, ownerSignature: signed.signature, keyAssertions,
  }));
}

/** Sign one allowlist action with the phrase key (password once) and relay it. */
export async function submitAllowlistAction(input: { owner: string; password: string; read: SendAllowlistRead; action: SendAllowlistAction }): Promise<void> {
  const owner = nativeAddress(input.owner.toLowerCase());
  if (!input.read.feature_active_next_height) throw new Error('Not active on the network yet');
  const body = await withOwnerKey(owner, input.password, account => signedSendAllowlistAction({
    chainId: chainId(),
    account: owner,
    action: input.action,
    actionNonce: BigInt(input.read.allowlist.next_action_nonce),
    publicKey: account.publicKey,
    sign: m => account.sign(m),
  })).catch(() => { throw new Error(PROTECTIONS_UNLOCK_FAILED); });
  await client.post('/wallet/send-allowlist/actions', body);
}
