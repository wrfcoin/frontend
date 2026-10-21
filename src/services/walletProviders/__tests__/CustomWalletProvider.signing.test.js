import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ed25519 } from '@noble/curves/ed25519.js';

// Challenge timestamps relative to now: the client refuses expired challenges.
const ISSUED_AT = new Date(Date.now() - 1_000).toISOString();
const EXPIRES_AT = new Date(Date.now() + 5 * 60_000).toISOString();
const PAST_ISSUED_AT = new Date(Date.now() - 10 * 60_000).toISOString();
const PAST_EXPIRES_AT = new Date(Date.now() - 5 * 60_000).toISOString();

const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const address = '0x3f995ceb27e8177077dbed8b1e4f696af74da492';
const walletManager = { currentWallet: null };
const walletService = {
  getBalance: jest.fn(),
  getNonce: jest.fn(),
  sendSignedTransaction: jest.fn(),
};

await jest.unstable_mockModule('../../../utils/walletUtils.ts', () => ({ walletManager }));
await jest.unstable_mockModule('../../secureWalletStorage.ts', () => ({ getSecureWallet: jest.fn() }));
await jest.unstable_mockModule('../../apiClient/index.ts', () => ({ walletService }));

const { CustomWalletProvider } = await import('../CustomWalletProvider.js');
const { transparentTransferMessage } = await import('../../walletCrypto/transferPayload.ts');
const { readFileSync } = await import('node:fs');
const { resolve } = await import('node:path');

const ORIGIN = 'https://wrfcoin-testnet.taila1c049.ts.net';
const LOGIN_CONFIG = { walletAuthOrigin: ORIGIN, walletAuthChainId: '777', walletAuthNetwork: 'testnet' };
const goldenPreimageHex = JSON.parse(
  readFileSync(resolve(process.cwd(), 'contract-fixtures/transparent-transfer-auth-vector.json'), 'utf8'),
).case.preimage_hex;
const goldenPreimage = Uint8Array.from(goldenPreimageHex.match(/.{2}/g), b => Number.parseInt(b, 16));
const utf8TransferPreimage = transparentTransferMessage({
  chainId: '777',
  networkId: 'testnet',
  from: address,
  to: '0x1111111111111111111111111111111111111111',
  amountBaseUnits: 547599908735n,
  nonce: 1n,
});

function loginChallenge(chainAddress = address, { origin = ORIGIN, chainId = '777', network = 'testnet' } = {}) {
  return [
    'wrfcoin_wallet_login_ed25519_v1',
    `${new URL(origin).host} wants you to sign in with your WRFCoin ed25519 account:`,
    chainAddress,
    '',
    'Sign in to WRFCoin Testnet.',
    '',
    `URI: ${origin}`,
    'Version: 1',
    'Scheme: ed25519',
    `Chain ID: ${chainId}`,
    `Network: ${network}`,
    `Nonce: ${'ab'.repeat(32)}`,
    `Issued At: ${ISSUED_AT}`,
    `Expiration Time: ${EXPIRES_AT}`,
  ].join('\n');
}

const hexToBytes = hex => Uint8Array.from(hex.match(/.{2}/g), b => Number.parseInt(b, 16));

describe('CustomWalletProvider signing boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    walletManager.currentWallet = null;
  });

  it('marks a legacy address receive-only and refuses to send', async () => {
    const provider = new CustomWalletProvider({
      chainId: 'wrfcoin-testnet',
      networkId: 'testnet',
    });
    const connected = await provider.connect({ address: 'WrfLegacyAddress', mnemonic });

    expect(connected).toMatchObject({ receiveOnly: true });
    expect(connected.notice).toContain('receive-only');
    await expect(provider.sendTransaction({ to: address, amount: '1' })).rejects.toThrow('receive-only');
    expect(walletService.sendSignedTransaction).not.toHaveBeenCalled();
  });

  describe('signNftCreate is purpose-tagged (frontend#374)', () => {
    const enc = new TextEncoder();
    const payload = JSON.stringify({ action: 'wrfcoin.nft.create', creator: address, timestamp: 't', nft: { name: 'n' } });

    it('signs only under wrfcoin_nft_create_v1, never raw or generic', async () => {
      const provider = new CustomWalletProvider();
      await provider.connect({ address, mnemonic });
      const sig = hexToBytes(await provider.signNftCreate(payload));
      const pub = provider.signingAccount.publicKey;
      expect(ed25519.verify(sig, enc.encode(`wrfcoin_nft_create_v1\n${payload}`), pub)).toBe(true);
      expect(ed25519.verify(sig, enc.encode(payload), pub)).toBe(false);
      expect(ed25519.verify(sig, enc.encode(`wrfcoin_generic_message_v1\n${payload}`), pub)).toBe(false);
    });

    it.each([
      ['the golden transfer preimage as bytes', () => goldenPreimage],
      ['the golden preimage as a latin1 string', () => String.fromCharCode(...goldenPreimage)],
      ['a UTF-8-clean transfer preimage', () => new TextDecoder('utf-8', { fatal: true }).decode(utf8TransferPreimage)],
      ['wrfcoin_-, wrfcoin.- and wrfcoin/-prefixed text', () => 'wrfcoin_stake_auth_v2 x'],
      ['a wrfcoin. session-key tag', () => 'wrfcoin.session_key_use.v1 x'],
      ['a wrfcoin/ proof-of-possession tag', () => 'wrfcoin/core4/oracle-key-proof-of-possession/v1'],
      ['permissionless-v1| text', () => 'permissionless-v1|e96b|1|0|transfer|{}'],
      ['a valid login challenge', () => loginChallenge()],
      ['JSON with another action', () => JSON.stringify({ action: 'wrfcoin.transfer', to: address })],
      ['a JSON array', () => '[]'],
    ])('refuses %s without touching the key', async (_label, make) => {
      const provider = new CustomWalletProvider();
      await provider.connect({ address, mnemonic });
      const sign = jest.spyOn(provider.signingAccount, 'sign');
      await expect(provider.signNftCreate(make())).rejects.toThrow('not a CreateNft authorization');
      expect(sign).not.toHaveBeenCalled();
    });
  });

  describe('generic signMessage is not a raw oracle (frontend#373 review, finding 1)', () => {
    const enc = new TextEncoder();
    const verify = (sigHex, bytes, pub) => ed25519.verify(hexToBytes(sigHex), bytes, pub);

    it('signs text only under the wrfcoin_generic_message_v1 envelope', async () => {
      const provider = new CustomWalletProvider();
      await provider.connect({ address, mnemonic });
      const text = '{"action":"wrfcoin.nft.create","creator":"0x3f99"}';

      const signatureHex = await provider.signMessage(text);

      const pub = provider.signingAccount.publicKey;
      expect(verify(signatureHex, enc.encode(`wrfcoin_generic_message_v1\n${text}`), pub)).toBe(true);
      expect(verify(signatureHex, enc.encode(text), pub)).toBe(false);
    });

    it.each([
      ['the core4 golden transfer preimage as bytes', () => goldenPreimage],
      ['the golden preimage as a plain array', () => Array.from(goldenPreimage)],
      ['the golden preimage as a latin1 string', () => String.fromCharCode(...goldenPreimage)],
      ['a UTF-8-clean transfer preimage for this key', () => new TextDecoder('utf-8', { fatal: true }).decode(utf8TransferPreimage)],
      ['a wrfcoin_-prefixed string', () => 'wrfcoin_stake_auth_v2 anything'],
      ['a wrfcoin.-prefixed session-key tag', () => 'wrfcoin.session_key_use.v1 anything'],
      ['a wrfcoin/ proof-of-possession tag', () => 'wrfcoin/core4/oracle-key-proof-of-possession/v1'],
      ['the launch_api permissionless preimage', () => 'permissionless-v1|e96b|1|0|transfer|{}'],
      ['the core4 domain_signing envelope (wrfcoin-sign-v1|)', () => 'wrfcoin-sign-v1|wrfcoin_stake_auth_v2|777|testnet|payload'],
      ['a governance vote preimage (governance-vote-v1|)', () => 'governance-vote-v1|proposal-42|yes|0x3f99'],
      ['a valid login challenge (login must use signLoginChallenge)', () => loginChallenge()],
    ])('refuses %s without touching the key', async (_label, makeMessage) => {
      const provider = new CustomWalletProvider();
      await provider.connect({ address, mnemonic });
      const sign = jest.spyOn(provider.signingAccount, 'sign');

      await expect(provider.signMessage(makeMessage())).rejects.toThrow('Refusing to sign message with the wallet key');
      expect(sign).not.toHaveBeenCalled();
    });

    it('no generic signature verifies as the golden transfer authorization, even for its latin1 text', async () => {
      const provider = new CustomWalletProvider();
      await provider.connect({ address, mnemonic });
      // Text that merely contains transfer-ish bytes after a benign prefix is
      // signed, but only under the envelope, so it is useless as a transfer.
      const text = `note: ${new TextDecoder().decode(utf8TransferPreimage)}`;
      const signatureHex = await provider.signMessage(text);
      expect(verify(signatureHex, utf8TransferPreimage, provider.signingAccount.publicKey)).toBe(false);
    });
  });

  it('surfaces balance failures instead of returning zero', async () => {
    const provider = new CustomWalletProvider();
    await provider.connect({ address, mnemonic });
    walletService.getBalance.mockRejectedValueOnce(new Error('node unavailable'));

    await expect(provider.getBalance()).rejects.toThrow('node unavailable');
  });

  it('submits only the client-signed transfer body', async () => {
    const provider = new CustomWalletProvider({
      chainId: 'wrfcoin-testnet',
      networkId: 'testnet',
    });
    await provider.connect({ address, mnemonic });
    walletService.getNonce.mockResolvedValueOnce('3');
    walletService.sendSignedTransaction.mockResolvedValueOnce({ txHash: '0xchainhash' });

    await expect(provider.sendTransaction({
      to: '0x1111111111111111111111111111111111111111',
      amount: '1.25',
    })).resolves.toBe('0xchainhash');
    expect(walletService.sendSignedTransaction).toHaveBeenCalledWith(expect.objectContaining({
      from: address,
      amount: '125000000',
      nonce: '3',
      auth_pubkey: 'e96b1c6b8769fdb0b34fbecfdf85c33b053cecad9517e1ab88cba614335775c1',
      auth_signature: expect.stringMatching(/^[0-9a-f]{128}$/),
    }));
  });

  it('refuses to sign when chain or network identity is unset', async () => {
    const provider = new CustomWalletProvider();
    await provider.connect({ address, mnemonic });
    walletService.getNonce.mockResolvedValueOnce('3');

    await expect(provider.sendTransaction({
      to: '0x1111111111111111111111111111111111111111',
      amount: '1.25',
    })).rejects.toThrow('signing identity is not configured');
    expect(walletService.sendSignedTransaction).not.toHaveBeenCalled();
  });

  describe('getLoginIdentity (backend#1205 ed25519 login)', () => {
    it('returns the lowercase vector chain address and its ed25519 public key', async () => {
      const provider = new CustomWalletProvider();
      await provider.connect({ address: address.replace('0x3f', '0x3F').replace('da492', 'DA492'), mnemonic });

      expect(provider.getLoginIdentity()).toEqual({
        scheme: 'ed25519',
        address,
        publicKeyHex: 'e96b1c6b8769fdb0b34fbecfdf85c33b053cecad9517e1ab88cba614335775c1',
      });
    });

    it('returns null for a legacy receive-only account whose key does not derive its address', async () => {
      const provider = new CustomWalletProvider();
      const connected = await provider.connect({ address: 'WrfLegacyAddress', mnemonic });

      expect(connected.receiveOnly).toBe(true);
      expect(provider.getLoginIdentity()).toBeNull();
    });

    it('returns null for an EVM-shaped account with no ed25519 signing key (private-key import)', async () => {
      const provider = new CustomWalletProvider();
      const connected = await provider.connect({ address: '0x1111111111111111111111111111111111111111' });

      expect(connected.receiveOnly).toBe(true);
      expect(provider.getLoginIdentity()).toBeNull();
    });

    it('returns null once disconnected', async () => {
      const provider = new CustomWalletProvider();
      await provider.connect({ address, mnemonic });
      await provider.disconnect();

      expect(provider.getLoginIdentity()).toBeNull();
    });
  });

  describe('signLoginChallenge (backend#1208 review, finding 2)', () => {
    it('signs a valid login challenge for this account with the ed25519 key', async () => {
      const provider = new CustomWalletProvider(LOGIN_CONFIG);
      await provider.connect({ address, mnemonic });
      const challenge = loginChallenge();

      const signatureHex = await provider.signLoginChallenge(challenge);

      expect(signatureHex).toMatch(/^[0-9a-f]{128}$/);
      expect(ed25519.verify(
        hexToBytes(signatureHex),
        new TextEncoder().encode(challenge),
        provider.signingAccount.publicKey,
      )).toBe(true);
    });

    it.each([
      ['the core4 golden transfer preimage as bytes', () => goldenPreimage],
      ['the core4 golden transfer preimage as a latin1 string', () => String.fromCharCode(...goldenPreimage)],
      ['a UTF-8-clean transfer preimage for this key', () => new TextDecoder('utf-8', { fatal: true }).decode(utf8TransferPreimage)],
      ['a challenge without the wrfcoin_wallet_login_ed25519_v1 prefix', () => loginChallenge().split('\n').slice(1).join('\n')],
      ['a challenge with a different domain line', () => loginChallenge().replace('login_ed25519_v1', 'login_ed25519_v0')],
      ['a challenge for a different address', () => loginChallenge('0x1111111111111111111111111111111111111111')],
      ['a challenge for a different origin', () => loginChallenge(address, { origin: 'https://evil.example' })],
      ['a challenge for a different chain', () => loginChallenge(address, { chainId: '1' })],
      ['a challenge for a different network', () => loginChallenge(address, { network: 'mainnet' })],
      ['an expired challenge (Expiration Time in the past)', () => loginChallenge().replace(ISSUED_AT, PAST_ISSUED_AT).replace(EXPIRES_AT, PAST_EXPIRES_AT)],
    ])('refuses %s without touching the key', async (_label, makeMessage) => {
      const provider = new CustomWalletProvider(LOGIN_CONFIG);
      await provider.connect({ address, mnemonic });
      const sign = jest.spyOn(provider.signingAccount, 'sign');

      await expect(provider.signLoginChallenge(makeMessage())).rejects.toThrow(
        'Refusing to sign wallet login challenge',
      );
      expect(sign).not.toHaveBeenCalled();
    });

    it('fails closed when the network is unset even though chain and origin are set', async () => {
      const provider = new CustomWalletProvider({ walletAuthOrigin: ORIGIN, walletAuthChainId: '777' });
      await provider.connect({ address, mnemonic });
      const sign = jest.spyOn(provider.signingAccount, 'sign');

      await expect(provider.signLoginChallenge(loginChallenge())).rejects.toThrow('network is not configured');
      expect(sign).not.toHaveBeenCalled();
    });

    it('fails closed when the origin is unset (no window.location fallback)', async () => {
      const provider = new CustomWalletProvider({ walletAuthChainId: '777', walletAuthNetwork: 'testnet' });
      await provider.connect({ address, mnemonic });
      const sign = jest.spyOn(provider.signingAccount, 'sign');

      await expect(provider.signLoginChallenge(loginChallenge())).rejects.toThrow('origin is not configured');
      expect(sign).not.toHaveBeenCalled();
    });

    it('refuses a challenge whose URI: line differs while the host line matches', async () => {
      const provider = new CustomWalletProvider(LOGIN_CONFIG);
      await provider.connect({ address, mnemonic });
      const sign = jest.spyOn(provider.signingAccount, 'sign');
      const downgraded = loginChallenge().replace(`URI: ${ORIGIN}`, `URI: ${ORIGIN.replace('https:', 'http:')}`);
      expect(downgraded).toContain('wrfcoin-testnet.taila1c049.ts.net wants you');

      await expect(provider.signLoginChallenge(downgraded)).rejects.toThrow('different origin');
      expect(sign).not.toHaveBeenCalled();
    });

    it('fails closed when chain/network are not configured', async () => {
      const provider = new CustomWalletProvider({ walletAuthOrigin: ORIGIN });
      await provider.connect({ address, mnemonic });
      const sign = jest.spyOn(provider.signingAccount, 'sign');

      await expect(provider.signLoginChallenge(loginChallenge())).rejects.toThrow('not configured');
      expect(sign).not.toHaveBeenCalled();
    });

    it('refuses on a legacy receive-only account', async () => {
      const provider = new CustomWalletProvider(LOGIN_CONFIG);
      await provider.connect({ address: 'WrfLegacyAddress', mnemonic });

      await expect(provider.signLoginChallenge(loginChallenge())).rejects.toThrow('no ed25519 login identity');
    });
  });
});
