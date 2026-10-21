import { WRFCOIN_CHAIN_ID } from '../../config/network';
import { deriveAccount } from './firstPartyKeys';
import { buildSignedTransfer, wrfToBaseUnits } from './transferPayload';
import { readVault, unlockVault } from '../walletVault';
import { ApiClient } from '../apiClient/client';
import { requireExactBaseUnits } from '../apiClient/number';
import { FEATURES } from '../../config/features';
import { assertOrdinarySendRecipient } from './recipientStatus';

// Public transfers always use the same-origin admitted backend relay. The
// studio's configurable service URLs cannot redirect a signed authorization.
const client = new ApiClient({ baseUrl: '/api' });
async function getNonce(from: string): Promise<string> {
  const response = await client.get<{ nonce: unknown }>(`/wallet/${nativeAddress(from)}/nonce`);
  return requireExactBaseUnits(response.nonce, 'wallet nonce');
}

export interface TransferPreview {
  readonly from: string;
  readonly to: string;
  readonly amountBaseUnits: string;
  readonly nonce: string;
  readonly chainId: string;
  readonly networkId: 'testnet';
}

// Native addresses have no mixed-case checksum; accept the canonical format
// used by mobile/core4, never EVM checksum or prefix conversion semantics.
export function nativeAddress(value: string): string {
  if (!/^0x[0-9a-f]{40}$/.test(value)) throw new Error('Use a full lowercase 0x address (40 hex digits)');
  return value;
}

export function validatePreview(p: TransferPreview): void {
  nativeAddress(p.from); nativeAddress(p.to);
  assertOrdinarySendRecipient(p.to);
  if (!WRFCOIN_CHAIN_ID || p.chainId !== WRFCOIN_CHAIN_ID || p.networkId !== 'testnet') throw new Error('Wrong signing network');
  // Match backend parseSignedTransfer's JSON-safe amount and u64 nonce bounds.
  if (!/^[1-9][0-9]*$/.test(p.amountBaseUnits) || BigInt(p.amountBaseUnits) > 9007199254740991n) {
    throw new Error('Amount must be positive and at most 9007199254740991 base units');
  }
  if (!/^(0|[1-9][0-9]*)$/.test(p.nonce) || BigInt(p.nonce) > 18446744073709551615n) {
    throw new Error('Invalid account nonce');
  }
}

export async function previewVaultTransfer(fromInput: string, to: string, amount: string): Promise<TransferPreview> {
  // Native addresses are canonical lowercase; a checksummed/mixed-case own address is normalised once, here.
  const from = fromInput.toLowerCase();
  nativeAddress(from); nativeAddress(to);
  assertOrdinarySendRecipient(to);
  const amountBaseUnits = wrfToBaseUnits(amount).toString();
  if (!WRFCOIN_CHAIN_ID) throw new Error('Signing chain is not configured');
  const nonce = await getNonce(from);
  const p = Object.freeze({ from, to, amountBaseUnits, nonce, chainId: WRFCOIN_CHAIN_ID, networkId: 'testnet' } as const);
  validatePreview(p);
  return p;
}

/** Only typed transfers reach this signer. No account/key/words escape. */
export async function signVaultTransfer(p: TransferPreview, password: string) {
  validatePreview(p);
  if (readVault()?.address.toLowerCase() !== p.from) throw new Error('Wallet changed; review again');
  let words: Awaited<ReturnType<typeof unlockVault>> | null = null;
  let account: ReturnType<typeof deriveAccount> | null = null;
  try {
    words = await unlockVault(password);
    password = '';
    account = deriveAccount(words.mnemonic);
    words.mnemonic = '';
    if (words.address.toLowerCase() !== p.from) throw new Error('Wallet changed');
    return buildSignedTransfer({ ...p, amountBaseUnits: BigInt(p.amountBaseUnits), nonce: BigInt(p.nonce) }, account);
  } catch {
    // Never echo a crypto exception, password, mnemonic or key to UI/logs.
    throw new Error('Unable to sign. Check your password and wallet, then review again.');
  } finally {
    password = '';
    if (words) words.mnemonic = '';
    account?.destroy?.();
    account = null;
    words = null;
  }
}

export async function submitVaultTransfer(input: TransferPreview, password: string) {
  if (!FEATURES.walletSend) throw new Error('WALLET_SEND_UNAVAILABLE');
  // Snapshot so later mutation of the caller's object (async edits) cannot change what is signed.
  const p: TransferPreview = Object.freeze({ ...input });
  validatePreview(p);
  // Sign first (PBKDF2 unlock is slow), then recheck the nonce immediately before submit:
  // a nonce that moved during the KDF discards the signed body and needs a fresh review.
  // `p` is frozen and is the exact object the user confirmed; the body is built only from it.
  const body = await signVaultTransfer(p, password);
  password = '';
  if (await getNonce(p.from) !== p.nonce) throw new Error('Nonce changed. Review the transfer again.');
  const response = await client.post<{ hash?: string; status?: string }>('/wallet/send', body);
  if (typeof response.hash !== 'string' || !response.hash) throw new Error('No submission identifier returned');
  return { txHash: response.hash, status: 'submitted' as const };
}
