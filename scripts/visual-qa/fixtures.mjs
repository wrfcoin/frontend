// Backend stubs for the visual QA. Every GET the public edge admits gets a
// populated answer here, so the captures show pages with data instead of empty
// states; nothing talks to a real node or backend. Time-relative values are
// computed when the run starts so "2 min ago" style labels look right.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(HERE, 'fixtures');

const hex = n => Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
const b64url = s => Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function readFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, name), 'utf8'));
}

/** Everything the stubs serve, built once per run. */
export function buildFixtures({ origin, host, now = Date.now() }) {
  const iso = msAgo => new Date(now - msAgo).toISOString();
  const PEER = '0x680d3a9b2f41c7e8d05a6b3c9e1f2a4d7b8c40ed';

  const jwtFor = address => `${b64url(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${b64url(JSON.stringify({ sub: address.toLowerCase(), iat: Math.floor(now / 1000), exp: Math.floor(now / 1000) + 3600 }))}.x`;
  // Must match src/utils/loginChallenge.ts line for line or the wallet login refuses to sign.
  const challengeFor = (address, nonce) => {
    const issued = new Date();
    const expiry = new Date(issued.getTime() + 5 * 60_000);
    return ['wrfcoin_wallet_login_ed25519_v1', `${host} wants you to sign in with your WRFCoin ed25519 account:`, address.toLowerCase(), '', 'Sign in to WRFCoin Testnet.', '',
      `URI: ${origin}`, 'Version: 1', 'Scheme: ed25519', 'Chain ID: 777', 'Network: testnet', `Nonce: ${nonce}`, `Issued At: ${issued.toISOString()}`, `Expiration Time: ${expiry.toISOString()}`].join('\n');
  };

  const BLOCKS = Array.from({ length: 25 }, (_, i) => ({ height: 44812 - i, hash: `0x${hex(64)}`, previousHash: `0x${hex(64)}`, timestamp: iso(60_000 + i * 77_000), transactions: [3, 0, 1, 7, 2, 0, 4, 1, 0, 12][i % 10] }));
  // Coordinates are coarse (0.1 degree) fixture cells, not any real station.
  const STATIONS = [
    ['Aurora Ridge', 44.9, -93.2, 'active'], ['Birch Hollow', 45.1, -93.4, 'active'], ['Cedar Flats', 44.7, -92.9, 'active'],
    ['Driftwood', 45.3, -92.7, 'stale'], ['Elm Prairie', 44.5, -93.6, 'registered'], ['Foxglove', 45.0, -92.5, 'offline'],
  ].map(([name, latitude, longitude, status], i) => ({ stationId: `st-${i}`, id: `st-${i}`, name, latitude, longitude, status }));
  const ZONES = { zones: Array.from({ length: 7 }, (_, i) => ({ lat: 44.5 + i * 0.1, lng: -93.5 + i * 0.1 })) };
  const LEADERBOARD = {
    metric: 'earnings', amountUnits: { available: true }, updatedAt: iso(3_600_000),
    entries: [
      ['Hilltop', '0xa1a1…a1a1', 'c_0123456789abcdef01234567', '1583978588754', 'gold'], ['Valley', '0xb2b2…b2b2', 'c_89abcdef0123456789abcdef', '912400000000', 'silver'],
      ['Riverside', '0xc3c3…c3c3', 'c_0123456789abcdef0123456a', '480250000000', 'bronze'], ['North Field', '0xd4d4…d4d4', 'c_0123456789abcdef0123456b', '125000000000', null],
      ['Lakeshore', '0xe5e5…e5e5', 'c_0123456789abcdef0123456c', '36250000000', null],
    ].map(([displayName, walletAddress, profileKey, units, badgeLevel], i) => ({ rank: i + 1, displayName, walletAddress, profileKey, value: Number(units) / 1e8, earningsBaseUnits: units, earningsWrf: (Number(units) / 1e8).toFixed(8), ...(badgeLevel ? { badgeLevel } : {}) })),
  };
  const PROPOSALS = [
    ['WIP-12', 'Raise the weather reward share for verified stations', 'ACTIVE', 'parameter', 1240, 310, 20, 2 * 86_400_000],
    ['WIP-11', 'Fund a second reference node for the public testnet', 'ACTIVE', 'treasury', 980, 640, 5, 5 * 86_400_000],
    ['WIP-10', 'Adopt the forecast scoring v2 formula', 'PASSED', 'protocol', 2210, 150, 40, -3 * 86_400_000],
    ['WIP-9', 'Move the faucet allowance to 50 WRF', 'REJECTED', 'parameter', 400, 1800, 12, -9 * 86_400_000],
    ['WIP-8', 'Publish station quality tiers', 'PASSED', 'protocol', 1500, 90, 0, -20 * 86_400_000],
  ].map(([id, title, status, proposalType, votesFor, votesAgainst, votesAbstain, endsIn]) => ({
    id, proposalId: id, title, status, proposalType, proposer: '0x7d29…0cb2', votesFor, votesAgainst, votesAbstain,
    votingStartTime: new Date(now + endsIn - 7 * 86_400_000).toISOString(), votingEndTime: new Date(now + endsIn).toISOString(),
    description: 'Testnet proposal used to exercise the public governance page.',
  }));
  const TREASURY = { success: true, data: { balance: '4812500000000', totalDeposits: '6100000000000', totalWithdrawals: '1287500000000', transactionCount: 143, amountUnits: { available: true, denomination: 'WRF', baseUnitDecimals: 8, baseUnitsPerUnit: '100000000', fields: { balance: 'base_units', totalDeposits: 'base_units', totalWithdrawals: 'base_units' } } } };
  const CURRENT = { current: { temperatureC: 14.2, relativeHumidityPercent: 62, windSpeedKmh: 18.5, barometricPressureHpa: 1012.4, seaLevelPressureHpa: 1013.1, observedAt: iso(20 * 60_000) } };
  const hourly = Array.from({ length: 24 }, (_, i) => { const t = new Date(now + i * 3_600_000); const h = t.getHours(); const day = h >= 7 && h < 19; return { startTime: t.toISOString(), isDaytime: day, temperature: Math.round(52 + 10 * Math.sin((h - 6) / 24 * 2 * Math.PI)), temperatureUnit: 'F', shortForecast: i % 7 === 3 ? 'Chance Rain Showers' : day ? 'Partly Sunny' : 'Mostly Clear', probabilityOfPrecipitation: { value: i % 7 === 3 ? 40 : 10 } }; });
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const daily = Array.from({ length: 14 }, (_, i) => { const t = new Date(now + Math.floor(i / 2) * 86_400_000); const day = i % 2 === 0; return { name: day ? DAYS[t.getDay()] : `${DAYS[t.getDay()]} Night`, startTime: new Date(t.getTime() + (day ? 6 : 18) * 3_600_000).toISOString(), isDaytime: day, temperature: day ? 58 + (i % 5) * 2 : 41 + (i % 4), temperatureUnit: 'F', shortForecast: ['Sunny', 'Partly Sunny', 'Chance Rain Showers', 'Mostly Cloudy', 'Clear'][Math.floor(i / 2) % 5], probabilityOfPrecipitation: { value: [5, 10, 40, 20, 0][Math.floor(i / 2) % 5] } }; });
  const wallet = own => ({
    balance: { balance: '1583978588754', earned_balance_total: '1583978588754', weatherRewards: '1241000000000', weatherRewardsPending: '3625000000', updatedAt: new Date(now).toISOString(), symbol: 'WRF' },
    history: {
      items: [
        { txId: `0x${hex(64)}`, kind: 'transfer', from: own, to: PEER, amountBaseUnits: '25000000000', timestamp: iso(32 * 60_000), settlement: 'processing', blockHeight: null },
        { txId: `0x${hex(64)}`, kind: 'transfer', from: PEER, to: own, amountBaseUnits: '100000000000', timestamp: iso(26 * 3_600_000), settlement: 'included', blockHeight: 48412 },
        { txId: `0x${hex(64)}`, kind: 'station_registration', from: own, to: null, amountBaseUnits: null, timestamp: iso(3 * 86_400_000), settlement: 'included', blockHeight: 44370 },
      ],
      creditItems: [
        { eventId: `credit-${hex(8)}`, kind: 'weather_reward', direction: 'received', amountBaseUnits: '1250000000', timestamp: iso(12 * 60_000), settlement: 'paid', blockHeight: 48901 },
        { eventId: `credit-${hex(8)}`, kind: 'weather_reward', direction: 'received', amountBaseUnits: '1250000000', timestamp: iso(2 * 86_400_000), settlement: 'paid', blockHeight: 48420 },
      ],
      complete: false, totalInWindow: 10,
    },
    nonce: { nonce: '17' },
    send: { hash: `0x${hex(64)}`, status: 'submitted' },
    mobileStation: { stationId: 'st_7d29a4c1e0b8', status: 'on_chain', updatedAt: iso(12 * 60_000) },
    ownership: { stationAlias: 'st_7d29a4c1e0b8', owner: own, ownerNonce: 1, ownerDeactivated: false, rewardsSuspended: false, frozen: null, pendingRecovery: null, observedAtHeight: 48912, settledHeight: 48900 },
  });

  // Rows in the shape weatherService.getLatestObservations reads (`timestamp` is required; the
  // other fields are the camelCase names it maps), so the station report draws its chart.
  const OBSERVATIONS = Array.from({ length: 12 }, (_, i) => ({ timestamp: iso((i + 1) * 15 * 60_000), temperatureC: 14.2 - i * 0.3, humidityPct: 62 + i, pressureHpa: 1012.4 - i * 0.1, windSpeedMs: 5.1 - i * 0.15, windDirectionDeg: 210 + i * 3, rainRateMmHr: i % 5 === 0 ? 0.2 : 0, uvIndex: i < 4 ? 2 : 0 }));
  // Submission rows as getSubmissionLog reads them (`createdAt` required; `chainStatus` decides success).
  const SUBMISSIONS = Array.from({ length: 8 }, (_, i) => ({ id: `sub-${i}`, createdAt: iso((i + 1) * 20 * 60_000), status: 'revealed', chainStatus: i === 0 ? 'pending' : 'reward_finalized', blockHeight: 44812 - i * 15, txId: `0x${hex(64)}` }));
  const PROFILE = { profileKey: 'c_0123456789abcdef01234567', displayName: 'Hilltop', walletAddress: '0xa1a1…a1a1', rank: 1, badgeLevel: 'gold', stationCount: 3, totalSubmissions: 4812, currentStreak: 21, longestStreak: 63, qualityScore: 0.93, weatherStatisticsAvailable: true, roleEarnings: { amountUnits: { available: true }, roles: [{ role: 'weather', earningsBaseUnits: '1241000000000' }, { role: 'node', earningsBaseUnits: '342978588754' }] }, updatedAt: iso(3_600_000) };

  // Faucet bond-grant audit list (infra testnet/services/faucet/BOND_GRANT.md): exactly the six fields the
  // faucet returns, newest first. Wallets and keys are visibly synthetic; peer ids are well-formed base58
  // shapes, not real nodes. `bonded` is null on today's faucet; one true and one false show the other states.
  const BOND_GRANTS = { grants: [
    ['0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa01', '12D3KooWAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1', 'a1', 2, null],
    ['0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb02', '12D3KooWBbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb2', 'b2', 9, true],
    ['0xcccccccccccccccccccccccccccccccccccccc03', '12D3KooWCccccccccccccccccccccccccccccccccccccccccccc3', 'c3', 31, false],
    ['0xdddddddddddddddddddddddddddddddddddddd04', '12D3KooWDddddddddddddddddddddddddddddddddddddddddddd4', 'd4', 55, null],
  ].map(([ownerAddress, peerId, k, hoursAgo, bonded]) => ({ ownerAddress, peerId, serverKey: k.repeat(32), txHash: k.repeat(32), time: iso(hoursAgo * 3_600_000), bonded })) };

  return { PEER, jwtFor, challengeFor, BLOCKS, STATIONS, ZONES, LEADERBOARD, PROPOSALS, TREASURY, CURRENT, hourly, daily, wallet, OBSERVATIONS, SUBMISSIONS, PROFILE, BOND_GRANTS, downloadsManifest: readFixture('downloads-manifest.json') };
}

/**
 * Route every /api/* request (and the downloads manifest) to the fixtures.
 * Only backend paths are intercepted: a glob like `**\/api/**` would also catch
 * the app's own /src/hooks/api/* modules. `options.manifest`: 'populated'
 * (default) serves the fixture manifest; 'shipped' lets the app's own
 * public/downloads/manifest.json through. `options.bondGrants`: 'populated'
 * (default), 'empty' (no grants yet) or 'unavailable' (the 503 a network
 * without the public audit list answers).
 */
export async function installRoutes(page, fx, options = {}) {
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  const manifestMode = options.manifest || 'populated';
  const bondGrantsMode = options.bondGrants || 'populated';
  await page.route(url => url.pathname.startsWith('/api/') || url.pathname === '/downloads/manifest.json', async route => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname;
    let m;
    if (p === '/downloads/manifest.json') return manifestMode === 'shipped' ? route.continue() : json(route, fx.downloadsManifest);
    if ((m = /^\/api\/auth\/nonce\/(0x[0-9a-fA-F]{40})$/.exec(p))) { const nonce = `qa-${hex(16)}`; return json(route, { nonce, message: fx.challengeFor(m[1], nonce), scheme: 'ed25519' }); }
    if (p === '/api/auth/wallet-login' && req.method() === 'POST') { const body = JSON.parse(req.postData() || '{}'); return json(route, { jwt: fx.jwtFor(body.address), refreshToken: `r-${hex(16)}`, expiresIn: 3600 }); }
    if (p === '/api/capabilities') return json(route, { features: { leaderboard: { status: 'configured', reasonCode: 'unverified' } }, readiness: {} });
    if (p === '/api/blockchain/status') return json(route, { success: true, blockHeight: 44812, height: 44812, status: 'synced', network: 'testnet' });
    if (p === '/api/blockchain/blocks') return json(route, { success: true, blocks: fx.BLOCKS, data: fx.BLOCKS, total: 44813, pagination: { page: 1, limit: 25, offset: 0, total: 44813, hasNext: true, hasPrev: false } });
    if (p === '/api/weather/coverage-zones') return json(route, fx.ZONES);
    if (p === '/api/weather/stations') return json(route, { stations: fx.STATIONS, total: fx.STATIONS.length, hasMore: false, nextCursor: null, source: 'wrfcoin-contributors' });
    if (p === '/api/weather/leaderboard') return json(route, fx.LEADERBOARD);
    if (p === '/api/governance/proposals') return json(route, { success: true, proposals: fx.PROPOSALS, total: fx.PROPOSALS.length, hasMore: false });
    if ((m = /^\/api\/governance\/proposals\/([^/]+)$/.exec(p))) { const pr = fx.PROPOSALS.find(x => x.id === decodeURIComponent(m[1])); return pr ? json(route, { success: true, proposal: pr }) : json(route, { success: false }, 404); }
    if (p === '/api/governance/treasury') return json(route, fx.TREASURY);
    if (/^\/api\/weather\/current\//.test(p)) return json(route, fx.CURRENT);
    if (/^\/api\/weather\/forecast\//.test(p)) return json(route, { forecast: { periods: url.search.includes('hourly') ? fx.hourly : fx.daily } });
    if ((m = /\/wallet\/(0x[0-9a-fA-F]{40})$/.exec(p))) return json(route, fx.wallet(m[1].toLowerCase()).balance);
    if ((m = /\/wallet\/(0x[0-9a-fA-F]{40})\/transactions$/.exec(p))) return json(route, fx.wallet(m[1].toLowerCase()).history);
    if ((m = /\/(0x[0-9a-fA-F]{40})\/nonce$/.exec(p))) return json(route, fx.wallet(m[1].toLowerCase()).nonce);
    if (/\/send$/.test(p) && req.method() === 'POST') return json(route, fx.wallet('0x0').send);
    if (p === '/api/weather/stations/mobile') return json(route, fx.wallet('0x0').mobileStation);
    if ((m = /^\/api\/stations\/([^/]+)\/ownership$/.exec(p))) return json(route, fx.wallet('0x7d29a4c1e0b8f36d5a92c4e7b1f08d3a6c5e0cb2').ownership);
    if ((m = /^\/api\/stations\/([^/]+)\/(observations|quality|submissions)$/.exec(p))) return json(route, m[2] === 'observations' ? { observations: fx.OBSERVATIONS, source: 'backend-db', unavailable: [] } : m[2] === 'quality' ? { overall: 0.93, dimensions: [{ name: 'completeness', score: 0.97 }, { name: 'timeliness', score: 0.91 }, { name: 'plausibility', score: 0.9 }], advisory: false, unavailable: [] } : { submissions: fx.SUBMISSIONS, source: 'backend-db', limit: 25, offset: 0 });
    if ((m = /^\/api\/weather\/stations\/([^/]+)$/.exec(p))) { const st = fx.STATIONS.find(x => x.stationId === decodeURIComponent(m[1])); return st ? json(route, { station: st, ...st }) : json(route, { error: 'not found' }, 404); }
    if ((m = /^\/api\/operators\/(c_[0-9a-f]{24})\/profile$/.exec(p))) return json(route, { profile: fx.PROFILE });
    if (p === '/api/faucet/bond-grants') {
      if (bondGrantsMode === 'unavailable') return json(route, { error: { code: 'BOND_GRANTS_UNAVAILABLE', message: 'Bond grant history is unavailable' } }, 503);
      return json(route, bondGrantsMode === 'empty' ? { grants: [] } : fx.BOND_GRANTS);
    }
    return json(route, { error: 'visual-qa stub: not provided' }, 404);
  });
}
