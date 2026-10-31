/**
 * Client-side gate for the ed25519 wallet-login challenge (backend#1205,
 * security review of backend#1208, finding 2).
 *
 * The first-party ed25519 key also authorizes transfers. The login protocol
 * has the client sign the UTF-8 bytes of a server-issued message, so a
 * malicious or compromised backend (or anything that can alter the nonce
 * response) could hand the wallet a transfer preimage as the "challenge".
 * Nothing may be signed as a login unless it is, line for line, the challenge
 * format backend#1208 issues, for THIS account, THIS relying-party origin and
 * THIS chain/network. Anything else fails closed.
 *
 * Format (server/routes/wallet-auth-service.ts buildEd25519WalletLoginMessage):
 *   wrfcoin_wallet_login_ed25519_v1
 *   <host> wants you to sign in with your WRFCoin ed25519 account:
 *   <lowercase chain address>
 *   (blank)
 *   Sign in to WRFCoin Testnet.
 *   (blank)
 *   URI: <origin>
 *   Version: 1
 *   Scheme: ed25519
 *   Chain ID: <positive integer>
 *   Network: <[A-Za-z0-9._-]{1,64}>
 *   Nonce: <nonce>
 *   Issued At: <ISO-8601>
 *   Expiration Time: <ISO-8601>
 */

export const ED25519_WALLET_LOGIN_DOMAIN = 'wrfcoin_wallet_login_ed25519_v1';

export interface Ed25519LoginExpectations {
  /** Lowercase core4 chain address of the signing key. */
  address: string;
  /** Relying-party origin the backend binds the challenge to. */
  origin: string;
  /** Wallet-auth chain ID (positive integer), e.g. 777. */
  chainId: string;
  /** Wallet-auth network name, e.g. "testnet". */
  network: string;
  /** When known, the nonce the challenge must carry. */
  nonce?: string;
  /** Clock override (ms since epoch) for tests; defaults to Date.now(). */
  nowMs?: number;
}

type EnvMap = Record<string, string | undefined>;

const defaultEnv = ((import.meta as unknown as { env?: EnvMap }).env ?? {}) as EnvMap;

const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?Z$/;

function refuse(reason: string): never {
  throw new Error(`Refusing to sign wallet login challenge: ${reason}.`);
}

function normalizeOrigin(raw: string): string {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return refuse('expected origin is not a valid URL');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    refuse('expected origin must be http(s)');
  }
  return parsed.origin;
}

function configured(value: unknown): string {
  // Empty strings (e.g. an empty Vite build arg) count as unset.
  return value === undefined || value === null ? '' : String(value).trim();
}

/**
 * What the client expects a login challenge to be bound to, from explicit
 * config or the build: origin from VITE_WALLET_AUTH_ORIGIN, chain ID from
 * VITE_WALLET_AUTH_CHAIN_ID or VITE_WRFCOIN_CHAIN_ID, network from
 * VITE_WRFCOIN_NETWORK_ID. There are no runtime fallbacks (not even
 * window.location.origin): each must equal what the backend's wallet auth is
 * configured with, and a missing value fails closed.
 */
export function resolveEd25519LoginExpectations(
  address: string,
  config: { walletAuthOrigin?: unknown; walletAuthChainId?: unknown; networkId?: unknown } = {},
  env: EnvMap = defaultEnv,
): Ed25519LoginExpectations {
  const origin = configured(config.walletAuthOrigin) || configured(env.VITE_WALLET_AUTH_ORIGIN);
  const chainId =
    configured(config.walletAuthChainId) ||
    configured(env.VITE_WALLET_AUTH_CHAIN_ID) ||
    configured(env.VITE_WRFCOIN_CHAIN_ID);
  const network = configured(config.networkId) || configured(env.VITE_WRFCOIN_NETWORK_ID);

  if (!origin) refuse('wallet auth origin is not configured (VITE_WALLET_AUTH_ORIGIN)');
  if (!/^[1-9]\d*$/.test(chainId)) refuse('wallet auth chain ID is not configured');
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(network)) refuse('wallet auth network is not configured');

  return {
    address: String(address).trim().toLowerCase(),
    origin: normalizeOrigin(origin),
    chainId,
    network,
  };
}

/**
 * Throws unless `message` is exactly an ed25519 login challenge for the
 * expected account, origin, chain and network. Returns the message unchanged.
 */
export function assertEd25519LoginChallenge(
  message: unknown,
  expected: Ed25519LoginExpectations,
): string {
  if (typeof message !== 'string') {
    refuse('challenge is not text');
  }
  if (!message.startsWith(`${ED25519_WALLET_LOGIN_DOMAIN}\n`)) {
    refuse(`challenge does not start with ${ED25519_WALLET_LOGIN_DOMAIN}`);
  }

  const address = String(expected.address).trim().toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(address)) {
    refuse('expected address is not a chain address');
  }
  const origin = normalizeOrigin(expected.origin);
  const host = new URL(origin).host;

  const lines = message.split('\n');
  if (lines.length !== 14) {
    refuse('challenge does not have the expected shape');
  }
  const [
    domain,
    statement,
    addressLine,
    blank1,
    purpose,
    blank2,
    uri,
    version,
    scheme,
    chainLine,
    networkLine,
    nonceLine,
    issuedLine,
    expiryLine,
  ] = lines;

  if (domain !== ED25519_WALLET_LOGIN_DOMAIN) refuse('wrong domain line');
  if (statement !== `${host} wants you to sign in with your WRFCoin ed25519 account:`) {
    refuse('challenge names a different relying party');
  }
  if (addressLine !== address) refuse('challenge is for a different address');
  if (blank1 !== '' || blank2 !== '' || purpose !== 'Sign in to WRFCoin Testnet.') {
    refuse('challenge does not have the expected shape');
  }
  if (uri !== `URI: ${origin}`) refuse('challenge names a different origin');
  if (version !== 'Version: 1') refuse('unsupported challenge version');
  if (scheme !== 'Scheme: ed25519') refuse('challenge is not for the ed25519 scheme');
  if (chainLine !== `Chain ID: ${expected.chainId}`) refuse('challenge names a different chain');
  if (networkLine !== `Network: ${expected.network}`) refuse('challenge names a different network');

  const nonceMatch = /^Nonce: ([A-Za-z0-9_-]{8,128})$/.exec(nonceLine);
  if (!nonceMatch) refuse('challenge nonce is malformed');
  if (expected.nonce !== undefined && nonceMatch[1] !== expected.nonce) {
    refuse('challenge nonce does not match the issued nonce');
  }

  const issued = /^Issued At: (.+)$/.exec(issuedLine)?.[1] ?? '';
  const expiry = /^Expiration Time: (.+)$/.exec(expiryLine)?.[1] ?? '';
  if (!ISO_8601.test(issued) || !ISO_8601.test(expiry) || Date.parse(expiry) <= Date.parse(issued)) {
    refuse('challenge times are malformed');
  }
  // The server enforces expiry too; checking it here means an expired (e.g.
  // replayed or stale) challenge never reaches the key at all.
  const nowMs = expected.nowMs ?? Date.now();
  if (Date.parse(expiry) <= nowMs) {
    refuse('challenge has expired');
  }

  return message;
}

/**
 * Device session-key sign-in (backend buildSessionKeyWalletLoginMessage).
 * The ed25519 challenge's fields for the OWNER's address under its own domain
 * tag, plus a `Session Key:` line naming the device key:
 *   wrfcoin_wallet_login_session_key_v1
 *   <host> wants you to sign in with your WRFCoin account using a device key:
 *   <lowercase owner address>
 *   (blank) / Sign in to WRFCoin Testnet. / (blank)
 *   URI, Version: 1, Scheme: session_key, Chain ID, Network,
 *   Session Key: <device public key hex>, Nonce, Issued At, Expiration Time
 * The device key signs nothing else through this path.
 */
export const SESSION_KEY_WALLET_LOGIN_DOMAIN = 'wrfcoin_wallet_login_session_key_v1';

export function assertSessionKeyLoginChallenge(
  message: unknown,
  expected: Ed25519LoginExpectations & { sessionPublicKey: string },
): string {
  if (typeof message !== 'string') refuse('challenge is not text');
  if (!message.startsWith(`${SESSION_KEY_WALLET_LOGIN_DOMAIN}\n`)) {
    refuse(`challenge does not start with ${SESSION_KEY_WALLET_LOGIN_DOMAIN}`);
  }
  const address = String(expected.address).trim().toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(address)) refuse('expected address is not a chain address');
  const sessionKey = String(expected.sessionPublicKey).trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(sessionKey)) refuse('expected session key is not a 32-byte key');
  const origin = normalizeOrigin(expected.origin);
  const host = new URL(origin).host;
  const lines = message.split('\n');
  if (lines.length !== 15) refuse('challenge does not have the expected shape');
  const [domain, statement, addressLine, blank1, purpose, blank2, uri, version, scheme,
    chainLine, networkLine, sessionLine, nonceLine, issuedLine, expiryLine] = lines;
  if (domain !== SESSION_KEY_WALLET_LOGIN_DOMAIN) refuse('wrong domain line');
  if (statement !== `${host} wants you to sign in with your WRFCoin account using a device key:`) {
    refuse('challenge names a different relying party');
  }
  if (addressLine !== address) refuse('challenge is for a different address');
  if (blank1 !== '' || blank2 !== '' || purpose !== 'Sign in to WRFCoin Testnet.') {
    refuse('challenge does not have the expected shape');
  }
  if (uri !== `URI: ${origin}`) refuse('challenge names a different origin');
  if (version !== 'Version: 1') refuse('unsupported challenge version');
  if (scheme !== 'Scheme: session_key') refuse('challenge is not for the session_key scheme');
  if (chainLine !== `Chain ID: ${expected.chainId}`) refuse('challenge names a different chain');
  if (networkLine !== `Network: ${expected.network}`) refuse('challenge names a different network');
  if (sessionLine !== `Session Key: ${sessionKey}`) refuse('challenge names a different device key');
  const nonceMatch = /^Nonce: ([A-Za-z0-9_-]{8,128})$/.exec(nonceLine);
  if (!nonceMatch) refuse('challenge nonce is malformed');
  if (expected.nonce !== undefined && nonceMatch[1] !== expected.nonce) {
    refuse('challenge nonce does not match the issued nonce');
  }
  const issued = /^Issued At: (.+)$/.exec(issuedLine)?.[1] ?? '';
  const expiry = /^Expiration Time: (.+)$/.exec(expiryLine)?.[1] ?? '';
  if (!ISO_8601.test(issued) || !ISO_8601.test(expiry) || Date.parse(expiry) <= Date.parse(issued)) {
    refuse('challenge times are malformed');
  }
  if (Date.parse(expiry) <= (expected.nowMs ?? Date.now())) refuse('challenge has expired');
  return message;
}
