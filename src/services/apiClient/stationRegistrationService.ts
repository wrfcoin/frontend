/**
 * Station Registration Service
 *
 * Typed wrappers for the self-service "Connect Your Station & Earn" flow:
 *   - Ambient weather-station API-key verification
 *   - Authenticated station registration (requires a wallet JWT)
 *   - EIP-191 wallet login (nonce -> sign -> verify -> JWT)
 *   - Faucet funding for freshly created wallets
 *
 * Backend contract (wrfcoin/backend #788):
 *   POST /weather/stations/verify-key  { provider, apiKey, appKey }
 *        -> { valid, devices: [{ name, mac, latitude, longitude }] }
 *   POST /weather/stations  (Bearer JWT)
 *        { name, latitude, longitude, location?, provider, ambientApiKey,
 *          ambientAppKey?, hardware?, mac? }
 *        -> 201 { success, stationId, ownerAddress }
 *
 * Wallet login contract (the JWT-issuing flow):
 *   GET  /auth/nonce/:address  -> { nonce, message, issuedAt, expirationTime }
 *   sign the exact domain-, URI-, chain-, address-, and expiry-bound message
 *   returned by the backend
 *   POST /auth/wallet-login  { address, signature, nonce }
 *        -> { jwt, refreshToken, expiresIn }
 *
 *   This is the ONLY wallet-login flow that mints a JWT (backend
 *   `wallet-auth-service.ts` does `jwt.sign(...)`), and `POST /weather/stations`
 *   is JWT-gated (`authenticateToken`), so onboarding MUST use it.
 *
 *   We deliberately do NOT use `/wallet-auth/verify`: that endpoint
 *   (backend `wallet-auth-routes.js`) expects a different signed message
 *   ("Wrfcoin Authentication\nWallet: …\nNonce: …") and returns NO token, so
 *   it cannot authenticate the JWT-gated registration call.
 *
 *   The login is delegated to the shared `walletAuthService`
 *   (src/services/walletAuthService.ts), which implements this exact
 *   contract (and token refresh), so we reuse it rather than duplicate it.
 *
 * Faucet contract (canonical /api/onboarding/faucet/*, frontend#242):
 *   POST /onboarding/faucet/challenge  (no body)
 *     -> { challengeId, question, disclaimer }
 *   POST /onboarding/faucet/claim  { walletAddress, challengeId, answer }
 *     -> 200 { txHash, amount, balance, disclaimer }
 *     -> errors { error: { code, message } } (400 INVALID_ADDRESS /
 *        EVM_ADDRESS_REQUIRED / CAPTCHA_FAILED, 429 ALREADY_CLAIMED /
 *        RATE_LIMITED, 503 FAUCET_EMPTY)
 *   The challenge is a required math captcha ("What is A + B?"); the claim
 *   must carry the numeric answer.
 *
 * Security: never log API keys, app keys, mnemonics, or signatures. The
 * Ambient credentials are forwarded to the backend, which stores them
 * encrypted at rest.
 */

import type { ServiceBaseUrls } from './runtime';
import { ApiClient } from './client';
import { ApiError } from '../../utils/apiError';
import { coarsenCoordinate } from '../../utils/geo';
import { readJwtSubject } from '../walletJwtSubject';
export { readJwtSubject } from '../walletJwtSubject';
import {
  WalletAuthService,
  type WalletSignMessage,
} from '../walletAuthService';
import type { Ed25519LoginExpectations } from '../walletCrypto/loginChallenge';

/**
 * Supported station providers.
 *
 * `ambient` is the only provider the currently-deployed backend
 * (`origin/main`) accepts. Backend PR #855 widens this set to also accept
 * `acurite`, `davis`, `netatmo`, `ecowitt`, and `tempest` and returns an
 * `ingestionStatus` flag. We type the wider set here so the wizard can submit
 * them; for providers the deployed backend doesn't yet recognize the
 * registration call will return an error, which the UI surfaces verbatim.
 */
export type StationProvider =
  | 'ambient'
  | 'acurite'
  | 'davis'
  | 'netatmo'
  | 'ecowitt'
  | 'tempest';

/**
 * Whether the backend has an active ingestion path for the registered station.
 *
 *   - `active`  — data is (or will shortly be) flowing for this provider.
 *   - `pending` — the station is registered but no ingestion path is wired yet
 *                 for its provider, so no data is flowing.
 *   - `unknown` — the backend did not report a status (e.g. pre-#855 deploy).
 */
export type IngestionStatus = 'active' | 'pending' | 'unknown';

export interface DetectedDevice {
  name: string;
  mac?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface VerifyKeyRequest {
  provider: StationProvider;
  apiKey: string;
  appKey?: string;
}

export interface VerifyKeyResult {
  valid: boolean;
  devices: DetectedDevice[];
  message?: string;
}

export interface RegisterStationRequest {
  name: string;
  latitude: number;
  longitude: number;
  location?: string;
  provider: StationProvider;
  /**
   * Primary credential. For `ambient` this is the Ambient API key; for other
   * providers it is that provider's API key / access token. Sent both as the
   * generic `apiKey` field and (for `ambient`) as the legacy `ambientApiKey`
   * field so the call works against both the deployed backend and #855.
   */
  apiKey?: string;
  /** Secondary credential (Ambient application key, Netatmo client secret…). */
  appKey?: string;
  hardware?: string;
  mac?: string;
}

export interface RegisterStationResult {
  success: boolean;
  stationId: string;
  ownerAddress: string;
  /**
   * Ingestion status reported by the backend. Defaults to `'unknown'` when the
   * deployed backend does not return the field (pre-#855), so callers must NOT
   * treat the absence of `'active'` as failure.
   */
  ingestionStatus: IngestionStatus;
  /** Human-readable note from the backend, if any (e.g. why ingestion pends). */
  message?: string;
}

export type StationRewardProgressState =
  | 'AWAITING_OBSERVATION'
  | 'OBSERVATION_RECEIVED'
  | 'VERIFYING'
  | 'QUORUM_REACHED'
  | 'FINALIZING_REWARD'
  | 'REWARDED'
  | 'UNKNOWN';

export interface StationRewardProgress {
  schemaVersion: 1;
  stationId: string;
  ownerAddress: string;
  state: StationRewardProgressState;
  asOf: string;
  evidenceFresh: boolean;
  registration: {
    state: 'REGISTERED';
    registeredAt: string | null;
  };
  chain: {
    networkId: string;
    chainId: string;
    genesisHash: string;
  } | null;
  observation: {
    id: string;
    digest: string;
    observedAt: string;
    acceptedAt: string;
  } | null;
  contribution: {
    commitId: string;
    commitMinedHeight: number;
    commitMinedHash: string;
    approvals: number;
    rejections: number;
    requiredQuorum: number;
    revealMinedHeight: number | null;
    revealMinedHash: string | null;
  } | null;
  reward: {
    amountBaseUnits: string;
    address: string;
    reason: string;
    blockHeight: number;
    blockHash: string;
    blockTime: string;
    accountEarnedAfter: string;
    finalityPolicy: 'BFT' | 'PROBABILISTIC_DEPTH' | null;
    authoritativeFinalizedHeight: number | null;
    canonicalHashCheckedAt: string | null;
    finalizedAt: string | null;
  } | null;
  diagnostic: {
    code: string;
    observedAt: string;
    stalledSince: string | null;
    retrySafe: boolean;
  } | null;
}

const REWARD_PROGRESS_STATES = new Set<StationRewardProgressState>([
  'AWAITING_OBSERVATION',
  'OBSERVATION_RECEIVED',
  'VERIFYING',
  'QUORUM_REACHED',
  'FINALIZING_REWARD',
  'REWARDED',
  'UNKNOWN',
]);

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isIsoTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim() !== '' &&
    !Number.isNaN(new Date(value).getTime())
  );
}

function isUnsignedInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

function isUnsignedBaseUnits(value: unknown, nonzero = false): value is string {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) {
    return false;
  }
  return !nonzero || value !== '0';
}

function isChainEvidence(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.networkId === 'string' &&
    value.networkId.trim() !== '' &&
    typeof value.chainId === 'string' &&
    value.chainId.trim() !== '' &&
    typeof value.genesisHash === 'string' &&
    value.genesisHash.trim() !== ''
  );
}

function isObservationEvidence(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.trim() !== '' &&
    typeof value.digest === 'string' &&
    /^[0-9a-f]{64}$/i.test(value.digest) &&
    isIsoTimestamp(value.observedAt) &&
    isIsoTimestamp(value.acceptedAt)
  );
}

function isContributionEvidence(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.commitId === 'string' &&
    value.commitId.trim() !== '' &&
    isUnsignedInteger(value.commitMinedHeight) &&
    typeof value.commitMinedHash === 'string' &&
    value.commitMinedHash.trim() !== '' &&
    isUnsignedInteger(value.approvals) &&
    isUnsignedInteger(value.rejections) &&
    Number.isSafeInteger(value.requiredQuorum) &&
    value.requiredQuorum > 0
  );
}

function hasExactRewardEvidence(
  reward: unknown,
  ownerAddress: string,
  contribution: Record<string, any>,
  requireFinality: boolean,
): boolean {
  if (
    !isRecord(reward) ||
    !isUnsignedBaseUnits(reward.amountBaseUnits, true) ||
    reward.address !== ownerAddress ||
    reward.reason !== `contribution:${contribution.commitId}` ||
    !isUnsignedInteger(reward.blockHeight) ||
    typeof reward.blockHash !== 'string' ||
    reward.blockHash.trim() === '' ||
    !isIsoTimestamp(reward.blockTime) ||
    !isUnsignedBaseUnits(reward.accountEarnedAfter)
  ) {
    return false;
  }
  if (!requireFinality) {
    return true;
  }
  return (
    (reward.finalityPolicy === 'BFT' ||
      reward.finalityPolicy === 'PROBABILISTIC_DEPTH') &&
    isUnsignedInteger(reward.authoritativeFinalizedHeight) &&
    reward.authoritativeFinalizedHeight >= reward.blockHeight &&
    isIsoTimestamp(reward.canonicalHashCheckedAt) &&
    isIsoTimestamp(reward.finalizedAt)
  );
}

/**
 * Treat the backend response as untrusted input. In particular, malformed or
 * incomplete later-stage evidence must never make the browser render a reward.
 */
export function normalizeStationRewardProgress(
  raw: unknown,
  expectedStationId: string,
): StationRewardProgress {
  if (
    !isRecord(raw) ||
    raw.schemaVersion !== 1 ||
    raw.stationId !== expectedStationId ||
    typeof raw.ownerAddress !== 'string' ||
    raw.ownerAddress.trim() === '' ||
    !REWARD_PROGRESS_STATES.has(raw.state) ||
    !isIsoTimestamp(raw.asOf) ||
    typeof raw.evidenceFresh !== 'boolean' ||
    !isRecord(raw.registration) ||
    raw.registration.state !== 'REGISTERED'
  ) {
    throw new Error('Reward progress response failed validation.');
  }

  const state = raw.state as StationRewardProgressState;
  if (state === 'AWAITING_OBSERVATION') {
    if (raw.observation !== null || raw.contribution !== null || raw.reward !== null) {
      throw new Error('Reward progress response failed validation.');
    }
  } else if (state === 'OBSERVATION_RECEIVED') {
    if (!isObservationEvidence(raw.observation) || raw.reward !== null) {
      throw new Error('Reward progress response failed validation.');
    }
  } else if (
    state === 'VERIFYING' ||
    state === 'QUORUM_REACHED' ||
    state === 'FINALIZING_REWARD' ||
    state === 'REWARDED'
  ) {
    if (
      raw.evidenceFresh !== true ||
      !isChainEvidence(raw.chain) ||
      !isObservationEvidence(raw.observation) ||
      !isContributionEvidence(raw.contribution)
    ) {
      throw new Error('Reward progress response failed validation.');
    }
    const contribution = raw.contribution as Record<string, any>;
    if (
      (state === 'VERIFYING' &&
        (contribution.approvals >= contribution.requiredQuorum ||
          contribution.revealMinedHeight !== null ||
          raw.reward !== null)) ||
      (state === 'QUORUM_REACHED' &&
        (contribution.approvals < contribution.requiredQuorum ||
          raw.reward !== null)) ||
      ((state === 'FINALIZING_REWARD' || state === 'REWARDED') &&
        (contribution.approvals < contribution.requiredQuorum ||
          !isUnsignedInteger(contribution.revealMinedHeight) ||
          typeof contribution.revealMinedHash !== 'string' ||
          contribution.revealMinedHash.trim() === '' ||
          !hasExactRewardEvidence(
            raw.reward,
            raw.ownerAddress,
            contribution,
            state === 'REWARDED',
          )))
    ) {
      throw new Error('Reward progress response failed validation.');
    }
  } else if (raw.reward !== null) {
    throw new Error('Reward progress response failed validation.');
  }

  return raw as StationRewardProgress;
}

function normalizeIngestionStatus(raw: unknown): IngestionStatus {
  const value = String(raw ?? '').toLowerCase();
  if (value === 'active') return 'active';
  if (value === 'pending') return 'pending';
  return 'unknown';
}

export interface WalletLoginResult {
  token: string;
  address: string;
  expiresIn?: number;
}

/** Callback that signs a login message with the user's wallet (EIP-191). */
export type { WalletSignMessage };

/**
 * The caller's own phone station (backend GET /weather/stations/mobile, wallet login required, W28). The
 * backend returns only this wallet's registration; the 0.1-degree cell it also returns is deliberately not
 * carried here, so the web view never shows a location.
 */
export type MobileStationPhase = 'db_only' | 'submitted' | 'on_chain';
export interface MobileStationStatus {
  stationId: string;
  phase: MobileStationPhase;
  updatedAt: string | null;
}

const MOBILE_STATION_PHASES: readonly MobileStationPhase[] = ['db_only', 'submitted', 'on_chain'];

/** Validate the status body; anything unexpected is refused rather than shown. */
export function normalizeMobileStationStatus(body: unknown): MobileStationStatus {
  const b = (body ?? {}) as Record<string, unknown>;
  const stationId = typeof b.stationId === 'string' ? b.stationId : '';
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(stationId)) throw new Error('Phone station status has an invalid station ID.');
  const phase = b.status as MobileStationPhase;
  if (!MOBILE_STATION_PHASES.includes(phase)) throw new Error('Phone station status is not recognized.');
  const updatedAt = typeof b.updatedAt === 'string' && !Number.isNaN(Date.parse(b.updatedAt)) ? b.updatedAt : null;
  return { stationId, phase, updatedAt };
}

/**
 * Subject claim of a JWT, or null when the token is not a decodable JWT with a
 * string `sub`. Read-only inspection (no signature check): it exists so the
 * client can refuse a login whose token names a different account.
 */
export interface FaucetClaimResult {
  success: boolean;
  txHash?: string;
  amount?: string;
  balance?: string;
  disclaimer?: string;
  message?: string;
  /** Backend error code on failure (`ALREADY_CLAIMED`, `RATE_LIMITED`, `FAUCET_EMPTY`, `CAPTCHA_FAILED`, …). */
  code?: string;
  /** HTTP status on failure; 0 or absent when the request never got an answer. */
  status?: number;
}

/** The backend's `{ error: { code } }` code carried by a failed faucet request, if any. */
export function faucetErrorCode(error: unknown): string | undefined {
  const code = error instanceof ApiError ? (error.details as { code?: unknown } | undefined)?.code : undefined;
  return typeof code === 'string' && code ? code : undefined;
}

export const FAUCET_DISCLAIMER =
  'Experimental testnet only — WRF coins are valueless and have no monetary value.';

function toOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDevices(raw: unknown): DetectedDevice[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry: any) => ({
    name: String(entry?.name ?? entry?.deviceName ?? 'Unnamed device'),
    mac: entry?.mac ? String(entry.mac) : undefined,
    latitude: toOptionalNumber(entry?.latitude ?? entry?.lat),
    longitude: toOptionalNumber(entry?.longitude ?? entry?.lon ?? entry?.lng),
  }));
}

export class StationRegistrationService {
  private readonly weatherClient: ApiClient;

  private readonly apiClient: ApiClient;

  /**
   * The shared wallet auth flow (GET /auth/nonce/:address -> sign the exact
   * server-issued domain-bound challenge -> POST /auth/wallet-login).
   * This is the only flow that mints the JWT required by the JWT-gated
   * `POST /weather/stations` registration endpoint.
   */
  private readonly walletAuth: WalletAuthService;

  constructor(baseUrls: ServiceBaseUrls) {
    this.weatherClient = new ApiClient({ baseUrl: baseUrls.weather });
    this.apiClient = new ApiClient({ baseUrl: baseUrls.api });
    this.walletAuth = new WalletAuthService(baseUrls.wallet);
  }

  /**
   * Verify an Ambient Weather API key / application key pair and return any
   * devices discovered on the account. Used to gate progress in the wizard.
   */
  async verifyStationKey(request: VerifyKeyRequest): Promise<VerifyKeyResult> {
    const response = await this.weatherClient.postWithFallback<any>(
      ['/weather/stations/verify-key', '/stations/verify-key'],
      {
        provider: request.provider,
        apiKey: request.apiKey,
        ...(request.appKey ? { appKey: request.appKey } : {}),
      },
    );

    return {
      valid: Boolean(response?.valid),
      devices: normalizeDevices(response?.devices),
      message: response?.message ? String(response.message) : undefined,
    };
  }

  /**
   * Register a weather station. Requires an authenticated wallet session
   * (the JWT is attached automatically by ApiClient via the auth token store).
   */
  async registerStation(
    request: RegisterStationRequest,
  ): Promise<RegisterStationResult> {
    const apiKey = request.apiKey;
    const isAmbient = request.provider === 'ambient';
    const response = await this.weatherClient.postWithFallback<any>(
      ['/weather/stations', '/stations'],
      {
        name: request.name,
        // W20 (owner ruling 2026-10-01): a registration never carries a
        // position finer than 0.1 degree, whatever the caller passed.
        latitude: coarsenCoordinate(request.latitude),
        longitude: coarsenCoordinate(request.longitude),
        ...(request.location ? { location: request.location } : {}),
        provider: request.provider,
        // Generic credential fields understood by the widened backend (#855).
        ...(apiKey ? { apiKey } : {}),
        ...(request.appKey ? { appKey: request.appKey } : {}),
        // Legacy Ambient-specific fields for the currently-deployed backend,
        // which only accepts `ambient` and keys it off `ambientApiKey`.
        ...(isAmbient && apiKey ? { ambientApiKey: apiKey } : {}),
        ...(isAmbient && request.appKey ? { ambientAppKey: request.appKey } : {}),
        ...(request.hardware ? { hardware: request.hardware } : {}),
        ...(request.mac ? { mac: request.mac } : {}),
      },
    );

    const stationId = String(
      response?.stationId ?? response?.id ?? response?.station?.id ?? '',
    ).trim();

    if (!stationId) {
      throw new Error('Station registration response did not include a stationId.');
    }

    return {
      success: response?.success ?? true,
      stationId,
      ownerAddress: String(response?.ownerAddress ?? response?.owner ?? ''),
      ingestionStatus: normalizeIngestionStatus(
        response?.ingestionStatus ?? response?.station?.ingestionStatus,
      ),
      message: response?.message ? String(response.message) : undefined,
    };
  }

  /**
   * The signed-in wallet's own phone station, or null when the backend says this wallet has none
   * (404 NOT_REGISTERED). Any other 404, e.g. a gateway that does not admit the route, is an error, never
   * "not registered".
   */
  async getMobileStationStatus(): Promise<MobileStationStatus | null> {
    try {
      return normalizeMobileStationStatus(await this.weatherClient.get<unknown>('/weather/stations/mobile'));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404 && error.details?.code === 'NOT_REGISTERED') return null;
      throw error;
    }
  }

  /**
   * Fetch the authenticated station-owner projection. The response is
   * validated fail-closed so unsupported evidence cannot become reward copy.
   */
  async getStationRewardProgress(
    stationId: string,
  ): Promise<StationRewardProgress> {
    const normalizedStationId = stationId.trim();
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(normalizedStationId)) {
      throw new Error('Invalid station ID.');
    }
    const response = await this.weatherClient.get<unknown>(
      `/weather/stations/${encodeURIComponent(normalizedStationId)}/reward-progress`,
    );
    return normalizeStationRewardProgress(response, normalizedStationId);
  }

  /**
   * Complete a wallet login and store the resulting JWT.
   *
   * Delegates to the shared {@link WalletAuthService}, which fetches a nonce
   * (GET /auth/nonce/:address), has the signer sign the server-issued
   * domain-bound message, posts to /auth/wallet-login, and stores the returned
   * JWT in the in-memory auth token store. During a frontend-first rollout it
   * can still sign the old nonce-only message until the backend is upgraded.
   * That JWT is
   * what authorizes the subsequent JWT-gated `POST /weather/stations` call.
   *
   * @param address  the 0x EVM address that will sign
   * @param signMessage  signer callback (e.g. ethers Wallet.signMessage)
   */
  async loginWithSigner(
    address: string,
    signMessage: WalletSignMessage,
  ): Promise<WalletLoginResult> {
    const result = await this.walletAuth.loginWithSigner(address, signMessage);
    return {
      token: result.jwt,
      address: result.address,
      expiresIn: result.expiresIn,
    };
  }

  /**
   * First-party ed25519 wallet login (frontend#373 / backend#1208).
   *
   * Delegates to {@link WalletAuthService.loginWithEd25519}, which validates
   * the server-issued challenge before `sign` sees it; `sign` must be a
   * dedicated login signer that re-validates (never a generic signMessage).
   * The backend mints the JWT with sub = the lowercase core4 chain address of
   * the key, and that sub is what the JWT-gated `POST /weather/stations`
   * records as the station owner. If the token names any other subject the
   * session is cleared and the login fails closed.
   */
  async loginWithEd25519(
    address: string,
    publicKeyHex: string,
    sign: WalletSignMessage,
    expectations?: Ed25519LoginExpectations,
  ): Promise<WalletLoginResult> {
    const expected = address.trim().toLowerCase();
    const result = await this.walletAuth.loginWithEd25519(
      expected,
      publicKeyHex,
      sign,
      expectations,
    );
    const sub = readJwtSubject(result.jwt);
    if (sub === null || sub !== expected) {
      this.walletAuth.clearSession();
      throw new Error('Wallet login returned a token for a different account.');
    }
    return {
      token: result.jwt,
      address: expected,
      expiresIn: result.expiresIn,
    };
  }

  /** Request a faucet captcha challenge (required before every claim). */
  async requestFaucetChallenge(): Promise<{
    challengeId?: string;
    question?: string;
    disclaimer?: string;
  }> {
    const response = await this.apiClient.post<any>('/onboarding/faucet/challenge');

    return {
      challengeId: response?.challengeId ? String(response.challengeId) : undefined,
      question: response?.question ? String(response.question) : undefined,
      disclaimer: response?.disclaimer ? String(response.disclaimer) : undefined,
    };
  }

  /** Claim faucet funds for a freshly created wallet. Claim failures resolve
   *  as `{ success: false, message }` (rather than throwing) so the wizard
   *  can render them inline. */
  async claimFaucet(
    address: string,
    challengeId?: string,
    answer?: string,
  ): Promise<FaucetClaimResult> {
    let response: any;
    try {
      response = await this.apiClient.post<any>('/onboarding/faucet/claim', {
        walletAddress: address,
        ...(challengeId ? { challengeId } : {}),
        ...(answer !== undefined ? { answer } : {}),
      });
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Faucet claim failed.',
        code: faucetErrorCode(error),
        status: error instanceof ApiError ? error.status : 0,
      };
    }

    return {
      success: true,
      txHash: response?.txHash ? String(response.txHash) : undefined,
      amount: response?.amount !== undefined ? String(response.amount) : undefined,
      balance: response?.balance !== undefined ? String(response.balance) : undefined,
      disclaimer: response?.disclaimer ? String(response.disclaimer) : undefined,
      message: response?.message ? String(response.message) : undefined,
    };
  }
}

export default StationRegistrationService;
