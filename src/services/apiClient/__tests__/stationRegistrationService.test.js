import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { StationRegistrationService } from '../stationRegistrationService';
import { buildWalletLoginMessage } from '../../walletAuthService';
import { getAuthToken, clearAuthToken } from '../../authTokenStore';
import * as crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { bytesToHex, deriveAccount } from '../../walletCrypto/firstPartyKeys';
import { ed25519LoginSigner } from '../../walletCrypto/firstPartyLoginSigner';

// Challenge timestamps relative to now: the client refuses expired challenges.
const ISSUED_AT = new Date(Date.now() - 1_000).toISOString();
const EXPIRES_AT = new Date(Date.now() + 5 * 60_000).toISOString();

const serviceUrls = {
  api: 'https://api.example.com/api',
  weather: 'https://api.example.com/api',
  earnings: 'https://api.example.com/api',
  governance: 'https://api.example.com/api',
  wallet: 'https://api.example.com/api',
  compute: 'https://api.example.com/api',
  validator: 'https://api.example.com/api',
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function finalizedRewardProjection(overrides = {}) {
  const base = {
    schemaVersion: 1,
    stationId: 'station-2456',
    ownerAddress: '0xowner',
    state: 'REWARDED',
    asOf: '2026-07-28T12:00:00.000Z',
    evidenceFresh: true,
    registration: { state: 'REGISTERED', registeredAt: '2026-07-28T11:50:00.000Z' },
    chain: { networkId: 'testnet', chainId: '777', genesisHash: '0xgenesis' },
    observation: {
      id: 'observation-1', digest: 'a'.repeat(64),
      observedAt: '2026-07-28T11:55:00.000Z', acceptedAt: '2026-07-28T11:55:01.000Z',
    },
    contribution: {
      commitId: 'commit-1', commitMinedHeight: 101, commitMinedHash: '0xcommit',
      approvals: 2, rejections: 0, requiredQuorum: 2,
      revealMinedHeight: 102, revealMinedHash: '0xreveal',
    },
    reward: {
      amountBaseUnits: '800', address: '0xowner', reason: 'contribution:commit-1',
      blockHeight: 102, blockHash: '0xreward', blockTime: '2026-07-28T11:58:00.000Z',
      accountEarnedAfter: '1800', finalityPolicy: 'BFT', authoritativeFinalizedHeight: 102,
      canonicalHashCheckedAt: '2026-07-28T11:59:00.000Z', finalizedAt: '2026-07-28T11:59:30.000Z',
    },
    diagnostic: null,
  };
  return {
    ...base,
    ...overrides,
    contribution: { ...base.contribution, ...overrides.contribution },
    reward: { ...base.reward, ...overrides.reward },
  };
}

describe('buildWalletLoginMessage', () => {
  it('retains the legacy wallet-login builder for frontend-first rollout compatibility', () => {
    expect(buildWalletLoginMessage('nonce123')).toBe(
      'WRFCoin wallet login nonce: nonce123',
    );
  });
});

describe('StationRegistrationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearAuthToken();
    global.fetch = jest.fn();
  });

  it('verifyStationKey normalizes valid + devices', async () => {
    const service = new StationRegistrationService(serviceUrls);
    global.fetch.mockResolvedValueOnce(
      jsonResponse({
        valid: true,
        devices: [{ name: 'Backyard', mac: 'AA:BB', latitude: '37.7', longitude: '-122.4' }],
      }),
    );

    const result = await service.verifyStationKey({
      provider: 'ambient',
      apiKey: 'k',
      appKey: 'a',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/api/weather/stations/verify-key',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.valid).toBe(true);
    expect(result.devices).toEqual([
      { name: 'Backyard', mac: 'AA:BB', latitude: 37.7, longitude: -122.4 },
    ]);
  });

  it('verifyStationKey reports invalid keys', async () => {
    const service = new StationRegistrationService(serviceUrls);
    global.fetch.mockResolvedValueOnce(jsonResponse({ valid: false, devices: [] }));

    const result = await service.verifyStationKey({ provider: 'ambient', apiKey: 'x', appKey: 'y' });
    expect(result.valid).toBe(false);
    expect(result.devices).toEqual([]);
  });

  it('registerStation returns the stationId, owner, and defaults ingestionStatus to unknown', async () => {
    const service = new StationRegistrationService(serviceUrls);
    global.fetch.mockResolvedValueOnce(
      jsonResponse({ success: true, stationId: 'stn_123', ownerAddress: '0xowner' }, 201),
    );

    const result = await service.registerStation({
      name: 'Backyard',
      latitude: 37.7,
      longitude: -122.4,
      provider: 'ambient',
      apiKey: 'k',
      appKey: 'a',
    });

    // Pre-#855 backend omits ingestionStatus → must default to 'unknown',
    // never treated as a failure.
    expect(result).toEqual({
      success: true,
      stationId: 'stn_123',
      ownerAddress: '0xowner',
      ingestionStatus: 'unknown',
      message: undefined,
    });

    // For an ambient station the body carries BOTH the generic apiKey/appKey
    // (understood by #855) and the legacy ambientApiKey/ambientAppKey fields.
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body).toMatchObject({
      provider: 'ambient',
      apiKey: 'k',
      appKey: 'a',
      ambientApiKey: 'k',
      ambientAppKey: 'a',
    });
  });

  it('registerStation never sends a position finer than 0.1 degree (W20)', async () => {
    const service = new StationRegistrationService(serviceUrls);
    global.fetch.mockResolvedValueOnce(jsonResponse({ success: true, stationId: 'stn_w20' }, 201));
    await service.registerStation({
      name: 'Fake',
      latitude: 10.123456,
      longitude: -20.987654,
      provider: 'ambient',
      apiKey: 'k',
    });
    const raw = global.fetch.mock.calls[0][1].body;
    const body = JSON.parse(raw);
    expect(body.latitude).toBe(10.1);
    expect(body.longitude).toBe(-21);
    expect(raw).not.toMatch(/10\.123456|20\.987654/);
  });

  it('registerStation surfaces the ingestionStatus reported by the backend (#855)', async () => {
    const service = new StationRegistrationService(serviceUrls);
    global.fetch.mockResolvedValueOnce(
      jsonResponse(
        { success: true, stationId: 'stn_777', ownerAddress: '0xowner', ingestionStatus: 'pending' },
        201,
      ),
    );

    const result = await service.registerStation({
      name: 'AcuRite Yard',
      latitude: 1,
      longitude: 2,
      provider: 'acurite',
      apiKey: 'k',
    });

    expect(result.ingestionStatus).toBe('pending');
    // A non-ambient provider must NOT get the legacy ambient* fields.
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.provider).toBe('acurite');
    expect(body.apiKey).toBe('k');
    expect(body.ambientApiKey).toBeUndefined();
  });

  it('registerStation throws when no stationId is returned', async () => {
    const service = new StationRegistrationService(serviceUrls);
    global.fetch.mockResolvedValueOnce(jsonResponse({ success: true }));

    await expect(
      service.registerStation({
        name: 'X',
        latitude: 1,
        longitude: 2,
        provider: 'ambient',
        apiKey: 'k',
      }),
    ).rejects.toThrow(/stationId/);
  });

  it('getStationRewardProgress accepts a complete awaiting-observation projection', async () => {
    const service = new StationRegistrationService(serviceUrls);
    global.fetch.mockResolvedValueOnce(
      jsonResponse({
        schemaVersion: 1,
        stationId: 'station-2456',
        ownerAddress: '0xowner',
        state: 'AWAITING_OBSERVATION',
        asOf: '2026-07-28T12:00:00.000Z',
        evidenceFresh: true,
        registration: {
          state: 'REGISTERED',
          registeredAt: '2026-07-28T11:59:00.000Z',
        },
        chain: null,
        observation: null,
        contribution: null,
        reward: null,
        diagnostic: null,
      }),
    );

    const result = await service.getStationRewardProgress('station-2456');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/api/weather/stations/station-2456/reward-progress',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.state).toBe('AWAITING_OBSERVATION');
    expect(result.reward).toBeNull();
  });

  it('getStationRewardProgress rejects a rewarded claim without exact reward evidence', async () => {
    const service = new StationRegistrationService(serviceUrls);
    global.fetch.mockResolvedValueOnce(
      jsonResponse({
        schemaVersion: 1,
        stationId: 'station-2456',
        ownerAddress: '0xowner',
        state: 'REWARDED',
        asOf: '2026-07-28T12:00:00.000Z',
        evidenceFresh: true,
        registration: {
          state: 'REGISTERED',
          registeredAt: '2026-07-28T11:59:00.000Z',
        },
        chain: {
          networkId: 'testnet',
          chainId: '777',
          genesisHash: '0xgenesis',
        },
        observation: {
          id: 'observation-1',
          digest: 'a'.repeat(64),
          observedAt: '2026-07-28T11:55:00.000Z',
          acceptedAt: '2026-07-28T11:55:01.000Z',
        },
        contribution: {
          commitId: 'commit-1',
          commitMinedHeight: 101,
          commitMinedHash: '0xcommit',
          approvals: 2,
          rejections: 0,
          requiredQuorum: 2,
          revealMinedHeight: 102,
          revealMinedHash: '0xreveal',
        },
        // A nominal amount with no address/reason/block/finality proof.
        reward: { amountBaseUnits: '800' },
        diagnostic: null,
      }),
    );

    await expect(
      service.getStationRewardProgress('station-2456'),
    ).rejects.toThrow(/failed validation/i);
  });

  it('getStationRewardProgress accepts only an exact finalized reward claim', async () => {
    const service = new StationRegistrationService(serviceUrls);
    global.fetch.mockResolvedValueOnce(
      jsonResponse({
        schemaVersion: 1,
        stationId: 'station-2456',
        ownerAddress: '0xowner',
        state: 'REWARDED',
        asOf: '2026-07-28T12:00:00.000Z',
        evidenceFresh: true,
        registration: {
          state: 'REGISTERED',
          registeredAt: '2026-07-28T11:50:00.000Z',
        },
        chain: {
          networkId: 'testnet',
          chainId: '777',
          genesisHash: '0xgenesis',
        },
        observation: {
          id: 'observation-1',
          digest: 'a'.repeat(64),
          observedAt: '2026-07-28T11:55:00.000Z',
          acceptedAt: '2026-07-28T11:55:01.000Z',
        },
        contribution: {
          commitId: 'commit-1',
          commitMinedHeight: 101,
          commitMinedHash: '0xcommit',
          approvals: 2,
          rejections: 0,
          requiredQuorum: 2,
          revealMinedHeight: 102,
          revealMinedHash: '0xreveal',
        },
        reward: {
          amountBaseUnits: '800',
          address: '0xowner',
          reason: 'contribution:commit-1',
          blockHeight: 102,
          blockHash: '0xreward',
          blockTime: '2026-07-28T11:58:00.000Z',
          accountEarnedAfter: '1800',
          finalityPolicy: 'BFT',
          authoritativeFinalizedHeight: 102,
          canonicalHashCheckedAt: '2026-07-28T11:59:00.000Z',
          finalizedAt: '2026-07-28T11:59:30.000Z',
        },
        diagnostic: null,
      }),
    );

    const result = await service.getStationRewardProgress('station-2456');
    expect(result.state).toBe('REWARDED');
    expect(result.reward.amountBaseUnits).toBe('800');
  });

  // --- per-state evidence-consistency rules -------------------------------
  // These cover the state machine that enforces "report only the furthest
  // state the response supports". Each case is a projection a backend could
  // plausibly send, whose evidence contradicts its own declared state.

  const expectRejected = async (projection) => {
    const service = new StationRegistrationService(serviceUrls);
    global.fetch.mockResolvedValueOnce(jsonResponse(projection));
    await expect(service.getStationRewardProgress('station-2456'))
      .rejects.toThrow(/failed validation/i);
  };

  it('rejects a rewarded projection whose evidence is stale', async () => {
    await expectRejected(finalizedRewardProjection({ evidenceFresh: false }));
  });

  it('rejects an awaiting-observation projection that carries a reward', async () => {
    await expectRejected(
      finalizedRewardProjection({ state: 'AWAITING_OBSERVATION' }),
    );
  });

  // finalizedRewardProjection merges `reward` (`{...base.reward, ...overrides.reward}`),
  // so passing `reward: null` through it is a no-op and the reward object survives.
  // These two states require reward === null, so it is nulled after the merge --
  // otherwise the case would be rejected by the "carries a reward" conjunct and
  // would prove nothing about the quorum/reveal rule under test.
  it('rejects a quorum-reached projection below its required quorum', async () => {
    await expectRejected({
      ...finalizedRewardProjection({
        state: 'QUORUM_REACHED',
        contribution: { approvals: 1, requiredQuorum: 2 },
      }),
      reward: null,
    });
  });

  it('rejects a verifying projection that already reached its quorum', async () => {
    await expectRejected({
      ...finalizedRewardProjection({
        state: 'VERIFYING',
        contribution: { approvals: 2, requiredQuorum: 2, revealMinedHeight: null },
      }),
      reward: null,
    });
  });

  it('rejects a verifying projection that already has a revealed contribution', async () => {
    await expectRejected({
      ...finalizedRewardProjection({
        state: 'VERIFYING',
        contribution: { approvals: 0, requiredQuorum: 2, revealMinedHeight: 102 },
      }),
      reward: null,
    });
  });

  it('rejects an observation-received projection that carries a reward', async () => {
    await expectRejected(
      finalizedRewardProjection({ state: 'OBSERVATION_RECEIVED' }),
    );
  });

  it('rejects an UNKNOWN-state projection that carries a reward', async () => {
    await expectRejected(finalizedRewardProjection({ state: 'UNKNOWN' }));
  });

  it('rejects a rewarded projection with zero base units', async () => {
    const service = new StationRegistrationService(serviceUrls);
    global.fetch.mockResolvedValueOnce(
      jsonResponse(finalizedRewardProjection({ reward: { amountBaseUnits: '0' } })),
    );

    await expect(service.getStationRewardProgress('station-2456'))
      .rejects.toThrow(/failed validation/i);
  });

  it('rejects a rewarded projection with an invalid block height', async () => {
    const service = new StationRegistrationService(serviceUrls);
    global.fetch.mockResolvedValueOnce(
      jsonResponse(finalizedRewardProjection({ reward: { blockHeight: -1 } })),
    );

    await expect(service.getStationRewardProgress('station-2456'))
      .rejects.toThrow(/failed validation/i);
  });

  it('loginWithSigner signs the backend domain-bound message and stores the JWT', async () => {
    const service = new StationRegistrationService(serviceUrls);
    // A valid EVM address (WalletAuthService normalizes/validates it).
    const address = '0x1234567890123456789012345678901234567890';
    // 1) nonce GET  2) wallet-login POST (the only flow that mints a JWT)
    const message = `wrfcoin.com wants you to sign in with your Ethereum account:\n${address}\n\nSign in to WRFCoin Testnet.\n\nURI: https://wrfcoin.com\nVersion: 1\nChain ID: 777\nNonce: n-1\nIssued At: 2026-08-17T00:00:00.000Z\nExpiration Time: 2026-08-17T00:05:00.000Z`;
    global.fetch
      .mockResolvedValueOnce(jsonResponse({ nonce: 'n-1', message }))
      .mockResolvedValueOnce(
        jsonResponse({ jwt: 'jwt-xyz', refreshToken: 'rt-1', expiresIn: 900 }),
      );

    const signMessage = jest.fn().mockResolvedValue('0xsig');
    const result = await service.loginWithSigner(address, signMessage);

    expect(signMessage).toHaveBeenCalledWith(message);
    expect(result.token).toBe('jwt-xyz');
    expect(getAuthToken()).toBe('jwt-xyz');

    // nonce GET (/api/auth/nonce/:address)
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      `https://api.example.com/api/auth/nonce/${address}`,
      expect.objectContaining({ method: 'GET' }),
    );
    // login POST (/api/auth/wallet-login) — body carries {address, signature, nonce}
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/api/auth/wallet-login',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"nonce":"n-1"'),
      }),
    );
  });

  it('requestFaucetChallenge POSTs the canonical onboarding endpoint with no body', async () => {
    const service = new StationRegistrationService(serviceUrls);
    global.fetch.mockResolvedValueOnce(
      jsonResponse({
        challengeId: 'chal-1',
        question: 'What is 3 + 4?',
        disclaimer:
          'Experimental testnet only — WRF coins are valueless and have no monetary value.',
      }),
    );

    const result = await service.requestFaucetChallenge();
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/api/onboarding/faucet/challenge',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result).toEqual({
      challengeId: 'chal-1',
      question: 'What is 3 + 4?',
      disclaimer:
        'Experimental testnet only — WRF coins are valueless and have no monetary value.',
    });
  });

  it('claimFaucet posts the canonical claim body and normalizes the success shape', async () => {
    const service = new StationRegistrationService(serviceUrls);
    // Canonical success shape: { txHash, amount, balance } — no `success` flag.
    global.fetch.mockResolvedValueOnce(
      jsonResponse({
        txHash: '0xtx',
        amount: '100',
        balance: '250',
        disclaimer:
          'Experimental testnet only — WRF coins are valueless and have no monetary value.',
      }),
    );

    const result = await service.claimFaucet('0xWallet', 'chal-1', '7');
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe('https://api.example.com/api/onboarding/faucet/claim');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      walletAddress: '0xWallet',
      challengeId: 'chal-1',
      answer: '7',
    });
    expect(result).toEqual({
      success: true,
      txHash: '0xtx',
      amount: '100',
      balance: '250',
      disclaimer:
        'Experimental testnet only — WRF coins are valueless and have no monetary value.',
      message: undefined,
    });
  });

  it('claimFaucet surfaces the canonical nested error as { success: false, message }', async () => {
    const service = new StationRegistrationService(serviceUrls);
    global.fetch.mockResolvedValueOnce(
      jsonResponse(
        {
          error: {
            code: 'ALREADY_CLAIMED',
            message: 'This address has already claimed tokens within the last 24 hours',
          },
        },
        429,
      ),
    );

    const result = await service.claimFaucet('0xWallet', 'chal-1', '7');
    expect(result.success).toBe(false);
    expect(result.message).toBe(
      'This address has already claimed tokens within the last 24 hours',
    );
    expect(result.txHash).toBeUndefined();
  });
});

describe('StationRegistrationService ed25519 login -> registration owner', () => {
  const vector = JSON.parse(
    readFileSync(resolve(process.cwd(), 'contract-fixtures/wallet-key-scheme-vector.json'), 'utf8'),
  );
  const ORIGIN = 'https://wrfcoin-testnet.taila1c049.ts.net';
  const EXPECT = { origin: ORIGIN, chainId: '777', network: 'testnet' };
  const b64url = (v) => Buffer.from(JSON.stringify(v)).toString('base64url');

  function challengeFor(address, nonce = 'ed-nonce-1') {
    return `wrfcoin_wallet_login_ed25519_v1\n${new URL(ORIGIN).host} wants you to sign in with your WRFCoin ed25519 account:\n${address}\n\nSign in to WRFCoin Testnet.\n\nURI: ${ORIGIN}\nVersion: 1\nScheme: ed25519\nChain ID: 777\nNetwork: testnet\nNonce: ${nonce}\nIssued At: ${ISSUED_AT}\nExpiration Time: ${EXPIRES_AT}`;
  }

  /**
   * Fake backend#1208 + weather route: verifies the ed25519 login with
   * node:crypto (independent of the @noble code), mints sub = derived address
   * (or `forcedSub`), and records the owner the JWT-gated registration binds.
   */
  function fakeBackend({ forcedSub } = {}) {
    const seen = { loginBody: null, registerAuth: null, registerBody: null };
    const issued = challengeFor(vector.address);
    global.fetch = jest.fn(async (url, init) => {
      const u = String(url);
      if (u.includes('/auth/nonce/')) {
        return jsonResponse({ success: true, data: { nonce: 'ed-nonce-1', message: issued, scheme: 'ed25519' } });
      }
      if (u.endsWith('/auth/wallet-login')) {
        const body = JSON.parse(String(init.body));
        seen.loginBody = body;
        const pub = Buffer.from(body.pubkey, 'hex');
        const derived = `0x${crypto.createHash('sha3-256').update(pub).digest('hex').slice(0, 40)}`;
        const key = crypto.createPublicKey({
          key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), pub]),
          format: 'der',
          type: 'spki',
        });
        const ok =
          derived === body.address &&
          crypto.verify(null, Buffer.from(issued, 'utf8'), key, Buffer.from(body.signature, 'hex'));
        if (!ok) return jsonResponse({ error: 'invalid wallet signature' }, 401);
        return jsonResponse({
          success: true,
          data: {
            jwt: `${b64url({ alg: 'HS256' })}.${b64url({ sub: forcedSub ?? derived, wallet_scheme: 'ed25519' })}.sig`,
            refreshToken: 'r',
            expiresIn: 900,
          },
        });
      }
      if (u.endsWith('/weather/stations')) {
        const headers = new Headers(init.headers);
        seen.registerAuth = headers.get('authorization');
        seen.registerBody = JSON.parse(String(init.body));
        const jwt = String(seen.registerAuth || '').replace(/^Bearer /, '');
        const sub = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8')).sub;
        // Backend: owner_address = req.user.address = JWT sub.
        return jsonResponse({ success: true, stationId: 'pws-vec', ownerAddress: sub }, 201);
      }
      throw new Error(`unexpected fetch ${u}`);
    });
    return seen;
  }

  it('vector wallet logs in with sub = its lowercase ed25519 chain address, and registers under that owner', async () => {
    const account = deriveAccount(vector.mnemonic);
    expect(account.address).toBe(vector.address);
    const seen = fakeBackend();
    const service = new StationRegistrationService(serviceUrls);

    const login = await service.loginWithEd25519(
      account.address,
      bytesToHex(account.publicKey),
      ed25519LoginSigner(account, EXPECT),
      { ...EXPECT, address: account.address },
    );
    expect(login.address).toBe(vector.address);
    expect(seen.loginBody).toMatchObject({
      scheme: 'ed25519',
      address: vector.address,
      pubkey: vector.ed25519_public_key_hex,
    });
    const sub = JSON.parse(Buffer.from(getAuthToken().split('.')[1], 'base64url').toString('utf8')).sub;
    expect(sub).toBe(vector.address);

    const reg = await service.registerStation({
      name: 'Vec Wx', latitude: 1, longitude: 2, provider: 'ambient', apiKey: 'k', appKey: 'a',
    });
    // The owner is the JWT sub — the client never sends an ownerAddress.
    expect(seen.registerBody).not.toHaveProperty('ownerAddress');
    expect(seen.registerAuth).toBe(`Bearer ${getAuthToken()}`);
    expect(reg.ownerAddress).toBe(vector.address);
  });

  it('fails closed and clears the session when the token names a different subject', async () => {
    const account = deriveAccount(vector.mnemonic);
    fakeBackend({ forcedSub: '0x1111111111111111111111111111111111111111' });
    const service = new StationRegistrationService(serviceUrls);
    await expect(
      service.loginWithEd25519(
        account.address,
        bytesToHex(account.publicKey),
        ed25519LoginSigner(account, EXPECT),
        { ...EXPECT, address: account.address },
      ),
    ).rejects.toThrow(/different account/);
    expect(getAuthToken()).toBeFalsy();
  });
});
