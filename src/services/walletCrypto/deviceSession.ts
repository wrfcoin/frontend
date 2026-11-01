/**
 * "This device" wallet actions built on a session key (sessionKeys.ts) and the
 * browser-held device key (deviceKeyStore.ts):
 *
 *   - read the account's device keys and limits from the node (via backend),
 *   - set up this device: the owner's phrase-derived key and the device key
 *     both sign the grant (the phrase is unlocked once, with the password),
 *   - remove this device (owner-signed revoke),
 *   - send within the limits with the device key alone (no password),
 *   - sign in with the device key.
 *
 * Every relay goes to the same-origin backend, like vaultTransfer.ts.
 */
import { ApiClient } from '../apiClient/client';
import { requireExactBaseUnits } from '../apiClient/number';
import { WRFCOIN_CHAIN_ID } from '../../config/network';
import { readVault, unlockVault } from '../walletVault';
import { deriveAccount, bytesToHex } from './firstPartyKeys';
import { nativeAddress, validatePreview, type TransferPreview } from './vaultTransfer';
import { getOrCreateDeviceKey, loadDeviceKey, forgetDeviceKey, type DeviceKey } from './deviceKeyStore';
import {
  checkDeviceSend,
  defaultGrant,
  findDeviceRecord,
  registerActionBody,
  revokeActionBody,
  sessionKeyRegisterMessage,
  sessionKeyTransferMessage,
  wrfLabel,
  type DeviceSendCheck,
  type SessionKeyList,
  type SessionKeyRecord,
} from './sessionKeys';
import type { WalletLoginResponse } from '../walletAuthService';

const client = new ApiClient({ baseUrl: '/api' });

export const FEATURE_OFF_MESSAGE = 'Device keys turn on when the network enables them.';
export const UNLOCK_FAILED_MESSAGE = 'Could not unlock your wallet. Check your password and try again.';

/** Error code from a backend/core4 error envelope, if any. */
export function errorCode(error: unknown): string | null {
  const details = (error as { details?: { code?: unknown } } | null)?.details;
  return typeof details?.code === 'string' ? details.code : null;
}

export async function fetchSessionKeys(owner: string): Promise<SessionKeyList> {
  const list = await client.get<SessionKeyList>(`/wallet/${nativeAddress(owner.toLowerCase())}/session-keys`);
  if (!list || typeof list !== 'object' || !Array.isArray(list.session_keys)) throw new Error('Unexpected device key list');
  return list;
}

export interface DeviceState {
  list: SessionKeyList | null;
  key: DeviceKey | null;
  record: SessionKeyRecord | null;
}

/** The node's view of this browser's key for `owner` (no key is created here). */
export async function readDeviceState(owner: string): Promise<DeviceState> {
  const [list, key] = await Promise.all([fetchSessionKeys(owner), loadDeviceKey(owner)]);
  return { list, key, record: findDeviceRecord(list, key?.publicKeyHex ?? null) };
}

/** Unlock the phrase once with the password, use the owner key for one signature, then drop it. */
export async function withOwnerKey<T>(owner: string, password: string, run: (account: ReturnType<typeof deriveAccount>) => T): Promise<T> {
  if (readVault()?.address.toLowerCase() !== owner.toLowerCase()) throw new Error(UNLOCK_FAILED_MESSAGE);
  let account: ReturnType<typeof deriveAccount> | null = null;
  try {
    const words = await unlockVault(password);
    password = '';
    account = deriveAccount(words.mnemonic);
    words.mnemonic = '';
    if (account.address !== owner.toLowerCase()) throw new Error('wallet changed');
    return run(account);
  } catch {
    throw new Error(UNLOCK_FAILED_MESSAGE);
  } finally {
    account?.destroy?.();
    account = null;
  }
}

/**
 * Set up this device: create (or reuse) its key, have the owner key and the
 * device key both sign the default grant, and submit it. `recipients` is
 * 'anyone' or a list of allowed addresses.
 */
export async function registerThisDevice(input: {
  owner: string; password: string; recipients: readonly string[] | 'anyone';
}): Promise<{ hash: string | null; publicKeyHex: string }> {
  const owner = nativeAddress(input.owner.toLowerCase());
  const list = await fetchSessionKeys(owner);
  if (!list.feature_active) throw new Error(FEATURE_OFF_MESSAGE);
  const device = await getOrCreateDeviceKey(owner);
  const grant = defaultGrant({ publicKey: device.publicKeyHex, nextHeight: list.next_height, recipients: input.recipients });
  const base = { chainId: list.chain_id, owner, registrationNonce: list.next_registration_nonce, grant };
  const sessionSignature = await device.sign(sessionKeyRegisterMessage(base));
  const body = await withOwnerKey(owner, input.password, account =>
    registerActionBody({ ...base, ownerPublicKey: bytesToHex(account.publicKey), ownerSign: m => account.sign(m), sessionSignature }));
  const response = await client.post<{ hash?: string | null }>('/wallet/session-keys', body);
  return { hash: typeof response?.hash === 'string' ? response.hash : null, publicKeyHex: device.publicKeyHex };
}

/** Remove this device on chain (owner-signed), then forget its key here. */
export async function revokeThisDevice(input: { owner: string; password: string; record: SessionKeyRecord }): Promise<void> {
  const owner = nativeAddress(input.owner.toLowerCase());
  const list = await fetchSessionKeys(owner);
  if (!list.feature_active) throw new Error(FEATURE_OFF_MESSAGE);
  const body = await withOwnerKey(owner, input.password, account => revokeActionBody({
    chainId: list.chain_id, owner, sessionKey: input.record.session_key.toLowerCase(),
    registrationNonce: input.record.registration_nonce,
    ownerPublicKey: bytesToHex(account.publicKey), ownerSign: m => account.sign(m),
  }));
  await client.post('/wallet/session-keys', body);
  await forgetDeviceKey(owner);
}

export type DeviceSendDecision = DeviceSendCheck & { record?: SessionKeyRecord | null };

/** Can this device sign this reviewed transfer by itself? Reads fresh limits from the node. */
export async function checkThisDeviceCanSend(p: TransferPreview): Promise<DeviceSendDecision> {
  try {
    const key = await loadDeviceKey(p.from);
    if (!key) return { ok: false, reason: 'no-key' };
    const list = await fetchSessionKeys(p.from);
    const check = checkDeviceSend(list, key.publicKeyHex, p.to, BigInt(p.amountBaseUnits));
    return { ...check, record: findDeviceRecord(list, key.publicKeyHex) };
  } catch {
    return { ok: false, reason: 'feature-off' };
  }
}

/**
 * Why a send that this device is set up for still needs the password, in one
 * short line. Null when the device has no say (no key, feature off).
 */
export function deviceFallbackMessage(decision: DeviceSendDecision | null): string | null {
  if (!decision || decision.ok) return null;
  const r = decision.record;
  switch (decision.reason) {
  case 'per-send': return `Over this device's ${wrfLabel(r?.max_value_per_use)} per-send limit. Confirm with your recovery phrase password.`;
  case 'daily': return `Over this device's ${wrfLabel(r?.window?.max_value)} daily limit. Confirm with your recovery phrase password.`;
  case 'total': return `Over what this device has left (${wrfLabel(r?.total_remaining)}). Confirm with your recovery phrase password.`;
  case 'recipient': return 'This device can\'t pay this address. Confirm with your recovery phrase password.';
  case 'inactive': return 'This device\'s key is not on. Confirm with your recovery phrase password.';
  case 'refused': return 'The network didn\'t take this device\'s signature, so nothing was sent. Confirm with your recovery phrase password.';
  default: return null;
  }
}

async function nonceOf(from: string): Promise<string> {
  const response = await client.get<{ nonce: unknown }>(`/wallet/${nativeAddress(from)}/nonce`);
  return requireExactBaseUnits(response.nonce, 'wallet nonce');
}

/** The app-level allowlist (address book, frontend#42) refused this recipient; nothing was signed. */
export class DeviceSendRefusedError extends Error {
  constructor(message: string) { super(message); this.name = 'DeviceSendRefusedError'; }
}

/**
 * Sign the reviewed transfer with this device's key (no password) and submit it.
 * `recipientRefusal` is the address-book allowlist check (null = allowed). It is
 * required and runs before anything is signed, so the device key never pays an
 * address the app-level allowlist refuses.
 */
export async function submitDeviceTransfer(
  input: TransferPreview,
  recipientRefusal: (to: string) => string | null,
): Promise<{ txHash: string; status: 'submitted' }> {
  const p: TransferPreview = Object.freeze({ ...input });
  const refusal = recipientRefusal(p.to);
  if (refusal) throw new DeviceSendRefusedError(refusal);
  validatePreview(p);
  if (!WRFCOIN_CHAIN_ID || p.chainId !== WRFCOIN_CHAIN_ID) throw new Error('Wrong signing network');
  const device = await loadDeviceKey(p.from);
  if (!device) throw new Error('This device has no key');
  if (await nonceOf(p.from) !== p.nonce) throw new Error('Nonce changed. Review the transfer again.');
  const message = sessionKeyTransferMessage({
    chainId: p.chainId, networkId: p.networkId, from: p.from, to: p.to,
    amountBaseUnits: BigInt(p.amountBaseUnits), nonce: BigInt(p.nonce), sessionPublicKey: device.publicKeyHex,
  });
  const signature = bytesToHex(await device.sign(message));
  const response = await client.post<{ hash?: string }>('/wallet/send', {
    from: p.from, to: p.to, amount: p.amountBaseUnits, nonce: p.nonce,
    session_key_auth: { session_public_key: device.publicKeyHex, signature },
  });
  if (typeof response?.hash !== 'string' || !response.hash) throw new Error('No submission identifier returned');
  return { txHash: response.hash, status: 'submitted' };
}

/**
 * Sign in for `owner` with this device's key, without the phrase. Returns
 * null (and signs nothing) when this browser has no device key for `owner`.
 * The backend only accepts it while the node lists the key as active with
 * wallet_login.
 */
export async function signInWithThisDevice(owner: string): Promise<WalletLoginResponse | null> {
  const device = await loadDeviceKey(owner);
  if (!device) return null;
  // Loaded on use: the auth service is only needed when there is a device key to sign in with.
  const { walletAuthService } = await import('../walletAuthService');
  return walletAuthService.loginWithSessionKey(owner, device.publicKeyHex, message => device.sign(message));
}
