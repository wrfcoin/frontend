import EncryptionService from './encryptionService';

const WALLET_KEY = 'wrfcoin_wallet_secure';
const IMPORTED_KEY = 'wrfcoin_wallet_imported_secure';
const SESSION_SECRET_KEY = 'wrfcoin_wallet_session_secret';
const ACTIVE_PROVIDER_KEY = 'wrfcoin_active_provider';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && !!window.sessionStorage;
}

function getSessionSecret(): string {
  if (!canUseStorage()) return 'wrfcoin-fallback-secret';
  const existing = sessionStorage.getItem(SESSION_SECRET_KEY);
  if (existing) return existing;
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  const generated = 'wrfcoin_' + Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
  sessionStorage.setItem(SESSION_SECRET_KEY, generated);
  return generated;
}

function encryptPayload(payload: unknown): string {
  const secret = getSessionSecret();
  return JSON.stringify(EncryptionService.encrypt(JSON.stringify(payload), secret));
}

function decryptPayload<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    const secret = getSessionSecret();
    const encrypted = JSON.parse(raw);
    return JSON.parse(EncryptionService.decrypt(encrypted, secret)) as T;
  } catch {
    return null;
  }
}

export function setSecureWallet(payload: unknown): void {
  if (!canUseStorage()) return;
  sessionStorage.setItem(WALLET_KEY, encryptPayload(payload));
  localStorage.removeItem('wrfcoin_wallet');
}

export function getSecureWallet<T = Record<string, unknown>>(): T | null {
  if (!canUseStorage()) return null;
  const inSession = decryptPayload<T>(sessionStorage.getItem(WALLET_KEY));
  if (inSession) return inSession;

  const legacy = localStorage.getItem('wrfcoin_wallet');
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy) as T;
      setSecureWallet(parsed);
      return parsed;
    } catch {
      return null;
    }
  }

  return null;
}

export function setSecureImportedWallet(payload: unknown): void {
  if (!canUseStorage()) return;
  sessionStorage.setItem(IMPORTED_KEY, encryptPayload(payload));
  localStorage.removeItem('wrfcoin_wallet_imported');
}

export function getSecureImportedWallet<T = Record<string, unknown>>(): T | null {
  if (!canUseStorage()) return null;
  return decryptPayload<T>(sessionStorage.getItem(IMPORTED_KEY));
}

export function clearSecureWallet(): void {
  if (!canUseStorage()) return;
  sessionStorage.removeItem(WALLET_KEY);
  sessionStorage.removeItem(IMPORTED_KEY);
  localStorage.removeItem('wrfcoin_wallet');
  localStorage.removeItem('wrfcoin_wallet_imported');
}

export function setActiveProvider(providerType: string): void {
  if (!canUseStorage()) return;
  sessionStorage.setItem(ACTIVE_PROVIDER_KEY, providerType);
  localStorage.removeItem(ACTIVE_PROVIDER_KEY);
}

export function getActiveProvider(): string | null {
  if (!canUseStorage()) return null;
  const current = sessionStorage.getItem(ACTIVE_PROVIDER_KEY);
  if (current) return current;
  const legacy = localStorage.getItem(ACTIVE_PROVIDER_KEY);
  if (legacy) {
    setActiveProvider(legacy);
    return legacy;
  }
  return null;
}

export function clearActiveProvider(): void {
  if (!canUseStorage()) return;
  sessionStorage.removeItem(ACTIVE_PROVIDER_KEY);
  localStorage.removeItem(ACTIVE_PROVIDER_KEY);
}
