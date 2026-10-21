import { ApiClient } from './apiClient/client';
import { clearAuthToken, setAuthToken } from './authTokenStore';
import { applyPendingReferralForWallet } from './referralAttribution';
import { sha3_256 } from '@noble/hashes/sha3.js';
import {
  ED25519_WALLET_LOGIN_DOMAIN,
  assertEd25519LoginChallenge,
  resolveEd25519LoginExpectations,
  type Ed25519LoginExpectations,
} from './walletCrypto/loginChallenge';

export const WALLET_LOGIN_MESSAGE_PREFIX = 'WRFCoin wallet login nonce: ';
const REFRESH_SKEW_SECONDS = 60;
const MIN_REFRESH_DELAY_MS = 1_000;

export interface WalletLoginResponse {
  address: string;
  jwt: string;
  refreshToken: string;
  expiresIn: number;
}

export type WalletSignMessage = (message: string) => Promise<string> | string;

export type WalletLoginScheme = 'evm' | 'ed25519';

export { ED25519_WALLET_LOGIN_DOMAIN };

interface NonceResponse {
  nonce?: unknown;
  message?: unknown;
  issuedAt?: unknown;
  expirationTime?: unknown;
  scheme?: unknown;
}

interface WalletLoginChallenge {
  nonce: string;
  message?: string;
  scheme?: string;
}

interface LoginResponse {
  jwt?: unknown;
  refreshToken?: unknown;
  expiresIn?: unknown;
}

function normalizeEvmAddress(address: string): string {
  const normalized = address.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(normalized)) {
    throw new Error('Wallet login requires a valid EVM address.');
  }
  return normalized;
}

function stripHexPrefix(value: string): string {
  return value.startsWith('0x') || value.startsWith('0X') ? value.slice(2) : value;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * core4 chain address of an ed25519 public key:
 * 0x + hex(SHA3-256(pubkey)[..20]) (SHA3-256, not Keccak), lowercase.
 * Same derivation as firstPartyKeys.deriveAccount and the backend.
 */
export function ed25519PublicKeyToChainAddress(publicKeyHex: string): string {
  const key = stripHexPrefix(publicKeyHex.trim()).toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(key)) {
    throw new Error('ed25519 login requires a 32-byte public key in hex.');
  }
  const digest = sha3_256(hexToBytes(key)).slice(0, 20);
  return `0x${Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

function readRequiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Wallet login response did not include ${field}.`);
  }
  return value.trim();
}

export function buildWalletLoginMessage(nonce: string): string {
  return `${WALLET_LOGIN_MESSAGE_PREFIX}${nonce}`;
}

export class WalletAuthService {
  private readonly client: ApiClient;

  private refreshToken = '';

  private currentAddress = '';

  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(apiBaseUrl: string = '/api') {
    this.client = new ApiClient({ baseUrl: apiBaseUrl });
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private getRefreshDelayMs(expiresIn: number): number {
    const refreshAfterSeconds =
      expiresIn > REFRESH_SKEW_SECONDS * 2
        ? expiresIn - REFRESH_SKEW_SECONDS
        : expiresIn * 0.8;

    return Math.max(MIN_REFRESH_DELAY_MS, Math.floor(refreshAfterSeconds * 1000));
  }

  private scheduleRefresh(expiresIn: number): void {
    this.clearRefreshTimer();

    const delayMs = this.getRefreshDelayMs(expiresIn);
    this.refreshTimer = setTimeout(() => {
      void this.refreshAccessToken().catch(() => {
        this.clearSession();
      });
    }, delayMs);
    (this.refreshTimer as unknown as { unref?: () => void }).unref?.();
  }

  private storeTokenResponse(
    address: string,
    response: LoginResponse,
  ): WalletLoginResponse {
    const jwt = readRequiredString(response?.jwt, 'jwt');
    const refreshToken = readRequiredString(response?.refreshToken, 'refreshToken');
    const expiresIn = Number(response?.expiresIn);

    if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
      throw new Error('Wallet login response did not include a valid expiresIn.');
    }

    this.currentAddress = normalizeEvmAddress(address);
    this.refreshToken = refreshToken;
    setAuthToken(jwt);
    this.scheduleRefresh(expiresIn);

    return {
      address: this.currentAddress,
      jwt,
      refreshToken,
      expiresIn,
    };
  }

  async requestNonce(
    address: string,
    scheme: WalletLoginScheme = 'evm',
  ): Promise<WalletLoginChallenge> {
    const isEd25519 = scheme === 'ed25519';
    // ed25519 chain addresses carry no EIP-55 checksum; the backend binds the
    // challenge and the JWT sub to the lowercase address.
    const normalizedAddress = isEd25519
      ? normalizeEvmAddress(address).toLowerCase()
      : normalizeEvmAddress(address);
    const response = await this.client.get<NonceResponse>(
      `/auth/nonce/${encodeURIComponent(normalizedAddress)}${isEd25519 ? '?scheme=ed25519' : ''}`,
    );

    const nonce = readRequiredString(response?.nonce, 'nonce');
    const message =
      response?.message === undefined
        ? undefined
        : readRequiredString(response.message, 'message');
    const challengeScheme =
      typeof response?.scheme === 'string' ? response.scheme : undefined;

    return { nonce, message, scheme: challengeScheme };
  }

  async loginWithSignature(params: {
    address: string;
    signature: string;
    nonce: string;
    scheme?: WalletLoginScheme;
    pubkey?: string;
  }): Promise<WalletLoginResponse> {
    const isEd25519 = params.scheme === 'ed25519';
    const address = isEd25519
      ? normalizeEvmAddress(params.address).toLowerCase()
      : normalizeEvmAddress(params.address);
    const signature = readRequiredString(params.signature, 'signature');
    const nonce = readRequiredString(params.nonce, 'nonce');

    // The EVM body is unchanged byte for byte; ed25519 adds scheme + pubkey.
    const body = isEd25519
      ? {
        scheme: 'ed25519' as const,
        address,
        pubkey: readRequiredString(params.pubkey, 'pubkey'),
        signature,
        nonce,
      }
      : { address, signature, nonce };

    const response = await this.client.post<LoginResponse>('/auth/wallet-login', body);

    const session = this.storeTokenResponse(address, response);
    // All callers, including station onboarding, share this login transition.
    // Optional attribution never holds up the newly authenticated session.
    void applyPendingReferralForWallet(session.address).catch(() => {});
    return session;
  }

  /**
   * First-party ed25519 wallet login (backend#1205). Signs the UTF-8 bytes of
   * the exact server-issued challenge, and only after checking that it is a
   * login challenge (domain line, this account's address, the expected origin,
   * chain and network, the issued nonce). There is deliberately NO fallback to
   * a locally built message, and nothing else is ever handed to `sign`: the
   * same key authorizes transfers, so a backend that returns anything but a
   * valid challenge gets no signature (backend#1208 review, finding 2).
   *
   * `sign` must be a dedicated login signer (CustomWalletProvider
   * .signLoginChallenge), which re-validates independently; never the
   * provider's generic signMessage.
   */
  async loginWithEd25519(
    address: string,
    publicKeyHex: string,
    sign: WalletSignMessage,
    expectations?: Ed25519LoginExpectations,
  ): Promise<WalletLoginResponse> {
    const normalizedAddress = normalizeEvmAddress(address).toLowerCase();
    const pubkey = stripHexPrefix(readRequiredString(publicKeyHex, 'pubkey')).toLowerCase();
    if (ed25519PublicKeyToChainAddress(pubkey) !== normalizedAddress) {
      throw new Error('ed25519 public key does not match the wallet address.');
    }
    const expected = expectations
      ? { ...expectations, address: normalizedAddress }
      : resolveEd25519LoginExpectations(normalizedAddress);

    const challenge = await this.requestNonce(normalizedAddress, 'ed25519');
    if (challenge.scheme !== 'ed25519') {
      throw new Error('Wallet login challenge is not an ed25519 challenge.');
    }
    if (typeof challenge.message !== 'string' || !challenge.message) {
      throw new Error('Wallet login response did not include message.');
    }
    const message = assertEd25519LoginChallenge(challenge.message, {
      ...expected,
      nonce: challenge.nonce,
    });

    const signature = await sign(message);

    return this.loginWithSignature({
      scheme: 'ed25519',
      address: normalizedAddress,
      pubkey,
      signature,
      nonce: challenge.nonce,
    });
  }

  async loginWithSigner(
    address: string,
    signMessage: WalletSignMessage,
  ): Promise<WalletLoginResponse> {
    const normalizedAddress = normalizeEvmAddress(address);
    const challenge = await this.requestNonce(normalizedAddress);
    // During the serialized rollout the new frontend can still authenticate
    // against the old backend. Once the backend starts returning a domain-bound
    // challenge, its exact server-issued text is what the wallet signs.
    const signature = await signMessage(
      challenge.message ?? buildWalletLoginMessage(challenge.nonce),
    );

    return this.loginWithSignature({
      address: normalizedAddress,
      signature,
      nonce: challenge.nonce,
    });
  }

  async refreshAccessToken(): Promise<WalletLoginResponse> {
    const refreshToken = readRequiredString(this.refreshToken, 'refreshToken');
    const address = normalizeEvmAddress(this.currentAddress);
    const response = await this.client.post<LoginResponse>('/auth/refresh', {
      refreshToken,
    });

    return this.storeTokenResponse(address, response);
  }

  clearSession(): void {
    this.clearRefreshTimer();
    this.refreshToken = '';
    this.currentAddress = '';
    clearAuthToken();
  }
}

export const walletAuthService = new WalletAuthService();

export function loginWalletWithSigner(
  address: string,
  signMessage: WalletSignMessage,
): Promise<WalletLoginResponse> {
  return walletAuthService.loginWithSigner(address, signMessage);
}

export function loginWalletWithEd25519(
  address: string,
  publicKeyHex: string,
  sign: WalletSignMessage,
  expectations?: Ed25519LoginExpectations,
): Promise<WalletLoginResponse> {
  return walletAuthService.loginWithEd25519(address, publicKeyHex, sign, expectations);
}

export function clearWalletAuthSession(): void {
  walletAuthService.clearSession();
}
