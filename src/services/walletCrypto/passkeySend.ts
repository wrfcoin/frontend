import { ApiClient } from '../apiClient/client';
import { requireExactBaseUnits } from '../apiClient/number';
import { FEATURES } from '../../config/features';
import { bytesToHex, hexToBytes, type PasskeyAuthJson, type PasskeyCredentialRecord } from './passkey';

/** Body of `POST /api/wallet/send-passkey`: the transfer plus its own WebAuthn authorization. No login. */
export interface PasskeySendBody {
  from: string;
  to: string;
  amount: string;
  nonce: string;
  passkey_auth: PasskeyAuthJson;
}

const client = new ApiClient({ baseUrl: '/api' });
const STORAGE_KEY = 'wrfcoin.passkey.credential.v1';

function requireEnabled() {
  if (!FEATURES.passkeyWallet) throw new Error('PASSKEY_WALLET_UNAVAILABLE');
}

export async function getPasskeyNonce(address: string): Promise<string> {
  requireEnabled();
  const response = await client.get<{ nonce: unknown }>(`/wallet/send-passkey/nonce/${encodeURIComponent(address)}`);
  return requireExactBaseUnits(response.nonce, 'passkey account nonce');
}

export async function submitPasskeyTransfer(body: PasskeySendBody): Promise<{ txHash: string; status: 'submitted' }> {
  requireEnabled();
  try {
    const response = await client.post<{ hash?: string }>('/wallet/send-passkey', body);
    if (typeof response.hash !== 'string' || !response.hash) throw new Error('No submission identifier returned');
    return { txHash: response.hash, status: 'submitted' };
  } catch (error: any) {
    const code = error?.details?.error?.code ?? error?.response?.error?.code ?? error?.data?.error?.code;
    if (code === 'FEATURE_NOT_ACTIVE' || error?.status === 503) throw new Error('PASSKEY_NOT_ACTIVE');
    if (code === 'AUTHORIZATION_INVALID') throw new Error('PASSKEY_AUTHORIZATION_INVALID');
    throw error;
  }
}

/** Public material only (credential id, public key, rpId): losing it loses nothing but the pointer to the account. */
export function saveStoredPasskey(record: PasskeyCredentialRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      credentialId: bytesToHex(record.credentialId), publicKeyXY: bytesToHex(record.publicKeyXY), rpId: record.rpId,
    }));
  } catch { /* storage unavailable: the page still works for this session */ }
}

export function loadStoredPasskey(): PasskeyCredentialRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const publicKeyXY = hexToBytes(String(parsed.publicKeyXY));
    if (publicKeyXY.length !== 64 || typeof parsed.rpId !== 'string') return null;
    return { credentialId: hexToBytes(String(parsed.credentialId)), publicKeyXY, rpId: parsed.rpId };
  } catch {
    return null;
  }
}

export function clearStoredPasskey(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
