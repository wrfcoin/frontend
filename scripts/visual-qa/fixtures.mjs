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
  // The proof card's station (PROOF_CARD.stationAlias) by its public alias, for the Wolfram check's location read.
  STATIONS[0].alias = 'st_7d29a4c1e0b8';
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

  // Forecaster track record (core4#3604 A4), in the exact shape backend forecasters-routes.ts serves an
  // anonymous caller: opaque c_ keys, short addresses only (`address: null`), st_ station aliases, and
  // skill / paid WRF per forecaster as `not_yet_available` (the node does not expose receipts yet).
  // Addresses are visibly synthetic (repeated nibbles) so no capture resembles a real wallet.
  const SKILL = { status: 'not_yet_available', reason: 'The node does not expose revealed forecast receipts in block reads yet.' };
  const PAID = { status: 'not_yet_available', reason: 'Per-forecaster paid totals need finalized receipts.' };
  const day = msAgo => new Date(now - msAgo).toISOString().replace(/Z$/, '000Z'); // the backend's microsecond form
  const forecastHeader = { coverage: { fromHeight: '1', throughHeight: '44812', complete: true, skippedRecords: '0' }, asOf: { height: '44812', hash: 'ab'.repeat(32), time: day(60_000), checkedAt: new Date(now - 55_000).toISOString() } };
  const FORECASTER_ROWS = [
    ['c_0123456789abcdef01234567', '0xaaaa…aaaa', '41', '33'], ['c_89abcdef0123456789abcdef', '0xbbbb…bbbb', '37', '40'],
    ['c_0123456789abcdef0123456a', '0xcccc…cccc', '29', '18'], ['c_0123456789abcdef0123456b', '0xdddd…dddd', '22', '22'],
    ['c_0123456789abcdef0123456c', '0xeeee…eeee', '15', '0'], ['c_0123456789abcdef0123456d', '0x1111…1111', '9', '12'],
  ].map(([profileKey, shortAddress, forecasts, prev], i) => ({ rank: i + 1, profileKey, shortAddress, address: null, isYou: false, forecasts, forecastsPrevious: prev, forecastsDelta: String(Number(forecasts) - Number(prev)), firstActiveAt: day((30 + i) * 86_400_000), lastActiveAt: day((i + 1) * 47 * 60_000), skill: SKILL, paid: PAID }));
  const forecastNetwork = (forecasters, forecasts, minted) => ({ forecasters, forecasts, rewardsMintedCount: forecasts, rewardsMintedBaseUnits: minted, rewardsMintedDisplay: `${minted.slice(0, -8) || '0'}.${minted.slice(-8).padStart(8, '0')}`, rewardsWithReceiptCount: '0', rewardsBaselineCount: forecasts, blocks: '7854', blocksWithoutCounters: '0', meanSkill: SKILL });
  const FORECASTERS = period => ({ success: true, ...forecastHeader, period, window: { from: period === 'all' ? null : day((period === '30d' ? 30 : 7) * 86_400_000), through: forecastHeader.asOf.time }, status: 'available', complete: true, network: forecastNetwork('6', '153', '48217500000'), rows: FORECASTER_ROWS });
  const FORECASTERS_EMPTY = period => ({ ...FORECASTERS(period), network: forecastNetwork('0', '0', '0'), rows: [] });
  const FORECASTER = {
    success: true, ...forecastHeader, status: 'available', complete: true,
    totals: { forecasts: '41', byProvenance: { real: '38', synthetic: '3', unclassified: '0' }, firstActiveAt: day(30 * 86_400_000), lastActiveAt: day(47 * 60_000), meanSkill: SKILL, paid: PAID },
    skill: SKILL, byVariable: [], byLead: [],
    series: Array.from({ length: 30 }, (_, i) => ({ day: new Date(now - (29 - i) * 86_400_000).toISOString().slice(0, 10), forecasts: String([1, 2, 0, 1, 3, 1, 2][i % 7]), meanSkill: null })).filter(r => r.forecasts !== '0'),
    recent: Array.from({ length: 8 }, (_, i) => ({ commitId: `${'f00dcafe'.repeat(7)}${String(i).padStart(8, '0')}`, blockHeight: String(44790 - i * 37), lastHeight: String(44792 - i * 37), timesSeen: String(1 + (i % 3)), decidedAt: day((i + 1) * 5 * 3_600_000), stationId: `st_${['7d29a4c1e0b8', '3f81c0d2a9e4'][i % 2]}`, stationIdIsAlias: true, provenanceClass: i === 5 ? 'synthetic' : 'real', skill: null, rmse: null, mae: null, bias: null, horizonHours: null, variables: null, receipt: 'not_exposed' })),
    profileKey: 'c_0123456789abcdef01234567', shortAddress: '0xaaaa…aaaa', address: null, isYou: false,
  };

  // Weekly forecast competition (backend#251), in the exact shape backend competition-routes.ts serves an
  // anonymous caller: short addresses and c_ keys only, points from scored forecasts, the rule text verbatim.
  // The week is the one containing `now` (ISO week, Monday 00:00 UTC), so "Ends in" is always shown.
  const monday = (() => { const d = new Date(now); const m = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - ((d.getUTCDay() + 6) % 7) * 86_400_000; return m; })();
  const isoWeek = ms => { const thu = new Date(ms + 3 * 86_400_000); const y = thu.getUTCFullYear(); const j4 = Date.UTC(y, 0, 4); const w1 = j4 - ((new Date(j4).getUTCDay() + 6) % 7) * 86_400_000; return `${y}-W${String(Math.round((ms - w1) / (7 * 86_400_000)) + 1).padStart(2, '0')}`; };
  const COMPETITION_RULE = {
    id: 'scored-forecasts-v1',
    points: 'One point for each of your forecasts that the chain scored and decided a reward for during the week.',
    ties: 'Equal points: whoever reached the total first ranks higher.',
    prizes: 'Points only. No WRF is paid and nothing is staked.',
    week: 'Weeks run Monday 00:00 UTC to the next Monday 00:00 UTC, by block time.',
  };
  // Times inside the week: the open week's last forecasts are recent, a past week's fall on its Saturday.
  const compRows = (pts, from, open) => FORECASTER_ROWS.slice(0, pts.length).map((r, i) => ({ rank: i + 1, profileKey: r.profileKey, shortAddress: r.shortAddress, address: null, isYou: false, points: pts[i], forecasts: pts[i],
    firstAt: new Date(from + (i + 1) * 3_600_000).toISOString(), lastAt: open ? day((i + 1) * 3 * 3_600_000) : new Date(from + 5 * 86_400_000 + (12 - i) * 3_600_000).toISOString() }));
  const compWeek = (back, status, pts) => {
    const from = monday - back * 7 * 86_400_000;
    return { week: isoWeek(from), from: new Date(from).toISOString(), until: new Date(from + 7 * 86_400_000).toISOString(), title: 't', status, rows: compRows(pts, from, back === 0) };
  };
  const WEEKS = [compWeek(0, 'open', ['14', '11', '9', '6', '3', '1']), compWeek(1, 'final', ['22', '19', '12', '7']), compWeek(2, 'final', ['17', '9', '4']), compWeek(3, 'final', ['5'])];
  const compStandings = (w) => ({
    success: true,
    competition: { week: w.week, from: w.from, until: w.until, title: w.title, status: w.status, rule: COMPETITION_RULE,
      final: w.status === 'final' ? { finalizedAt: new Date(Date.parse(w.until) + 3_600_000).toISOString(), throughHeight: String(44812 - 2000), throughHash: 'cd'.repeat(32) } : null },
    asOf: w.status === 'final' ? null : forecastHeader.asOf, coverage: w.status === 'final' ? null : forecastHeader.coverage,
    entrants: w.rows.length, forecasts: String(w.rows.reduce((n, r) => n + Number(r.points), 0)), rows: w.rows, you: null, limit: 50,
  });
  const COMPETITIONS = { success: true, current: WEEKS[0].week, weeks: WEEKS.map(w => ({ week: w.week, from: w.from, until: w.until, title: w.title, status: w.status, entrants: w.rows.length, forecasts: String(w.rows.reduce((n, r) => n + Number(r.points), 0)), leaders: w.rows.slice(0, 3) })) };
  const COMPETITION = week => { const w = week === 'current' ? WEEKS[0] : WEEKS.find(x => x.week === week); return w ? compStandings(w) : null; };

  // Faucet bond-grant audit list (infra testnet/services/faucet/BOND_GRANT.md): exactly the six fields the
  // faucet returns, newest first. Wallets and keys are visibly synthetic; peer ids are well-formed base58
  // shapes, not real nodes. `bonded` is null on today's faucet; one true and one false show the other states.
  const BOND_GRANTS = { grants: [
    ['0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa01', '12D3KooWAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1', 'a1', 2, null],
    ['0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb02', '12D3KooWBbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb2', 'b2', 9, true],
    ['0xcccccccccccccccccccccccccccccccccccccc03', '12D3KooWCccccccccccccccccccccccccccccccccccccccccccc3', 'c3', 31, false],
    ['0xdddddddddddddddddddddddddddddddddddddd04', '12D3KooWDddddddddddddddddddddddddddddddddddddddddddd4', 'd4', 55, null],
  ].map(([ownerAddress, peerId, k, hoursAgo, bonded]) => ({ ownerAddress, peerId, serverKey: k.repeat(32), txHash: k.repeat(32), time: iso(hoursAgo * 3_600_000), bonded })) };

  // Proof card (backend#229) in the exact shape proof-card-routes.ts answers; the newest observation
  // above carries the same commit id and height, so the station page links to it.
  const PROOF_COMMIT = 'c0ffee'.padEnd(64, '0').replace(/0{8}$/, '4d2a91e7');
  const PROOF_CARD = {
    commitId: PROOF_COMMIT, stationAlias: 'st_7d29a4c1e0b8', status: 'reward_finalized',
    reading: { observedAt: iso(15 * 60_000), temperatureC: 14.2, humidityPct: 62, pressureHpa: 1012.4, windSpeedMs: 5.1, precipitationMm: 0.2, dewpointC: 6.9, provenanceClass: 'real' },
    inclusion: { status: 'included', block: { height: 44809, hash: 'b7'.repeat(4) + hex(56), timestamp: iso(14 * 60_000), producerPubkey: '1e5180e7' + hex(56), finalized: true } },
    attestation: { approvals: 2, hasQuorum: true, quorum: 2 },
    reward: { status: 'paid', amountBaseUnits: '1250000000', finalized: true, rewarded: true, blocker: null, block: { height: 44812, hash: hex(64), finalized: true } },
    chain: { networkId: 'testnet', chainId: '888', genesisHash: hex(64), height: 44830, finalizedHeight: 44826 },
  };
  OBSERVATIONS[0] = { ...OBSERVATIONS[0], commitId: PROOF_COMMIT, height: 44809 };
  // Producers and bonded nodes (owner demo 2026-11-01) in the exact shape network-nodes-routes.ts serves.
  // Keys and addresses: the core4 genesis roster for producers; synthetic for the bonds.
  const NETWORK_NODES = {
    chain: { networkId: 'testnet', chainId: '888', height: 44830, status: 'ok' },
    producers: {
      status: 'ok', rosterSource: 'core4 genesis_producer_pins.rs (testnet genesis roster)',
      window: { fromHeight: 44767, toHeight: 44830, read: 64, unreadable: 0, unsigned: 0 },
      members: [
        { producerId: 'n5-node-a', publicKey: '1e5180e7add06bbe07cf2698ec9d4882ae1cfb54b13de67bae92a4e625ceec1a', payoutAddress: '0x680d51f7543ca70029866956376306d47ce60ed0', blocksInWindow: 64, lastBlock: { height: 44830, time: iso(60_000) }, earnedTotal: '4812500000000' },
        { producerId: 'producer-standby', publicKey: 'cd77a1f439ec6896727f585e81228795c8008c8f8db7763bb9c42afa8d119aaa', payoutAddress: '0x39ee2e595a55c71256282fe5c42a398594985b1a', blocksInWindow: 0, lastBlock: null, earnedTotal: '0' },
        { producerId: 'mango-mini', publicKey: '1f7a4ec7699e361390cb89297a2b4441e676b17c95b122063eda25b1f64e0f1e', payoutAddress: '0xc536d2026661522cb8631b3c723d4af43784a990', blocksInWindow: 0, lastBlock: null, earnedTotal: '0' },
      ],
      unrostered: [],
    },
    bonded: {
      status: 'ok', epoch: 11, discovery: { settlementEpochs: [11, 10, 9, 8], configured: 3 },
      nodes: [['ws-node', 'c37f'], ['n5-node', '4926'], ['mango-node', 'fe1b']].map(([alias, prefix], i) => ({
        deploymentId: `${prefix}${hex(60)}`, alias, principal: '25036000000', escrowBalance: '25036000000', jailed: false, registeredEpoch: 1, exitEffectiveHeight: null,
        payoutAddress: `0x${prefix}${hex(36)}`, earnedTotal: String(37925925888 + i * 18962962944), lastPayout: { epoch: 10, status: 'PAID', amount: '18962962944' },
      })),
    },
    attesters: { status: 'ok', quorum: 2, ids: ['oracle-n5', 'oracle-ws', 'oracle-mango'] },
    checkedAt: new Date(now).toISOString(),
  };
  // Bring-your-own-key Wolfram check (owner ruling 2026-11-01) in the exact shape
  // wolfram-reading-check-routes.ts answers. Illustrative climate numbers for the fixture cell only.
  const WOLFRAM_QUERY = 'historical temperatures on ' + new Date(PROOF_CARD.reading.observedAt).toLocaleString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' }) + ' at 44.9°N 93.2°W';
  const WOLFRAM_ANSWER = {
    verdict: 'unusual', temperatureC: PROOF_CARD.reading.temperatureC, place: { latitude: 44.9, longitude: -93.2 },
    reference: { typicalLowC: 1.1, typicalHighC: 11.7, recordLowC: -11.7, recordHighC: 25.6, averageC: null },
    pod: { title: 'Historical temperatures', text: 'low: -11.7 °C | average low: 1.1 °C | average high: 11.7 °C | high: 25.6 °C' },
    query: WOLFRAM_QUERY, resultsUrl: `https://www.wolframalpha.com/input?i=${encodeURIComponent(WOLFRAM_QUERY)}`, attribution: 'Wolfram|Alpha',
  };
  // Calibration certificate status (backend calibration-certificate-routes.ts) in the exact shape it
  // answers: the owner-held testnet root signed this station's sensor certificate a month ago.
  const CAL_ROOT_KEY = '3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29';
  const CALIBRATION = {
    success: true, status: 'calibrated', checkedAt: iso(0),
    certificate: {
      cid: 'bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku', artifactId: 'cal-2f9c4e1a', status: 'calibrated', reasonCodes: ['CAL_OK'],
      issuer: { issuerId: 'WRFCoin owner (testnet)', trustRootId: 'wrfcoin-owner-testnet' },
      issuedAt: iso(30 * 86_400_000), expiresAt: new Date(now + 335 * 86_400_000).toISOString(),
      ownerAddress: '0x7d29a4c1e0b8f36d5a92c4e7b1f08d3a6c5e0cb2',
      calibration: { sensor: 'Davis 6152 Vantage Pro2 temperature/humidity', method: 'Two-point check: ice bath and 75% RH salt chamber', reference: 'NIST-traceable reference thermometer, certificate 2026-117' },
      revocation: null,
      artifact: { schemaVersion: 'wrf-calibration-attestation/v1', artifactId: 'cal-2f9c4e1a', signature: { algorithm: 'ed25519-sha3-256-json-v1', signerPublicKey: CAL_ROOT_KEY, value: 'ab'.repeat(64) } },
    },
    history: [],
    trustRoots: [{ rootId: 'wrfcoin-owner-testnet', subject: 'WRFCoin owner (testnet)', publicKeyHex: CAL_ROOT_KEY, fingerprintSha256: hex(64) }],
  };
  // Forecast check (demo item 7) in the exact shape forecast-verification-routes.ts answers: three
  // scored forecasts (two with a NOAA capture), one waiting, one with no reading in its target hour.
  const hourIso = hoursAgo => new Date(Math.floor((now - hoursAgo * 3_600_000) / 3_600_000) * 3_600_000).toISOString();
  const fcRecord = (i, status, alias, f, t, noaa, hoursAgo) => ({
    commitId: `f${i}`.padEnd(64, '0'), stationAlias: alias, modelId: i % 2 ? 'learned-conv1d/v1' : 'persistence-trend/v1',
    issuedAt: hourIso(hoursAgo + 6), validAt: hourIso(hoursAgo), horizonHours: 6, status,
    unavailableReason: status === 'unavailable' ? 'no_chain_reading_in_target_hour' : null,
    forecast: { temperature_c: f, pressure_hpa: 1012.4 },
    truth: status === 'scored' ? { readings: 46, values: { temperature_c: t, pressure_hpa: 1013.1 }, provenance: ['real'], heights: { from: 44100 + i * 50, to: 44146 + i * 50 } } : null,
    scores: status === 'scored' ? {
      temperature_c: { forecast: f, truth: t, error: Math.round((f - t) * 1e4) / 1e4, noaa: noaa === null ? null : { value: noaa, error: Math.round((noaa - t) * 1e4) / 1e4, leadHours: 7 } },
      pressure_hpa: { forecast: 1012.4, truth: 1013.1, error: -0.7, noaa: null },
    } : null,
    noaa: noaa === null || status !== 'scored' ? null : { source: 'nws:HourlyForecastGenerator', leadHours: 7 },
    noaaReason: status === 'scored' && noaa === null ? 'no NOAA forecast was captured for this station and hour before the forecast was issued' : null,
    submittedAt: iso((hoursAgo - 1) * 3_600_000), scoredAt: status === 'scored' ? iso((hoursAgo - 2) * 3_600_000) : null,
  });
  const FORECAST_CHECK = {
    windowDays: 30, status: 'available', reason: null, counts: { pending: 1, scored: 3, unavailable: 1 },
    variables: [
      { variable: 'temperature_c', chain: { n: 3, mae: 0.6333, bias: 0.1, rmse: 0.7234 }, vsNoaa: { n: 2, chainMae: 0.55, noaaMae: 1.2, chainBias: 0.25, noaaBias: -0.8 }, vsNoaaReason: null },
      { variable: 'pressure_hpa', chain: { n: 3, mae: 0.7, bias: -0.7, rmse: 0.7 }, vsNoaa: null, vsNoaaReason: 'NOAA hourly forecasts do not include pressure.' },
      { variable: 'humidity_pct', chain: null, vsNoaa: null, vsNoaaReason: 'No scored forecast has a NOAA forecast for the same station and hour, captured before it was issued.' },
    ],
    stations: [{ stationAlias: 'st_7d29a4c1e0b8', scored: 2, temperature: { n: 2, mae: 0.55, bias: 0.25, rmse: 0.6 } }, { stationAlias: 'st_31c0e9a2b4d7', scored: 1, temperature: { n: 1, mae: 0.8, bias: -0.2, rmse: 0.8 } }],
    recent: [
      fcRecord(1, 'pending', 'st_7d29a4c1e0b8', 9.8, null, null, -3),
      fcRecord(2, 'scored', 'st_7d29a4c1e0b8', 11.4, 10.9, 9.8, 2),
      fcRecord(3, 'scored', 'st_31c0e9a2b4d7', 7.2, 8.0, 8.9, 5),
      fcRecord(4, 'unavailable', 'st_31c0e9a2b4d7', 6.1, null, null, 20),
      fcRecord(5, 'scored', 'st_7d29a4c1e0b8', 12.3, 11.7, null, 27),
    ],
  };
  const FORECAST_CHECK_EMPTY = {
    ...FORECAST_CHECK, status: 'unavailable', reason: 'No forecast has been scored against station readings in this window yet.',
    counts: { pending: 0, scored: 0, unavailable: 0 }, stations: [], recent: [],
    variables: FORECAST_CHECK.variables.map(v => ({ ...v, chain: null, vsNoaa: null, vsNoaaReason: v.variable === 'pressure_hpa' ? v.vsNoaaReason : 'No scored forecast has a NOAA forecast for the same station and hour, captured before it was issued.' })),
  };
  // Friend challenges (backend#249) in the exact shape challenge-routes.ts answers. The signed-in wallet
  // (read from the request's Bearer) is a player, so the page marks it "You".
  const CHALLENGE_CODE = 'RAIN-7K2Q';
  const challengeFor_ = (you, over = {}) => ({
    id: '6f1d2c4e-8a8b-4c1e-9d6a-1f2e3d4c5b6a', title: 'Coast collection race', description: 'Who lands more readings this week?',
    format: 'headToHead', status: 'live', inviteCode: CHALLENGE_CODE, targetScore: 250,
    startsAt: iso(2 * 86_400_000), endsAt: new Date(now + 5 * 86_400_000).toISOString(), completedAt: null,
    lastUpdatedAt: iso(90_000), metricLabel: 'readings on chain',
    scoring: { source: 'chain', note: 'Counts are readings from stations each wallet owns that landed on chain during the challenge. Points only: nothing is paid.', countedAt: iso(90_000) },
    participants: [
      { id: '0x5ca1ab1e000000000000000000000000000d00d1', name: 'Collector D00D', score: 183, teamName: '', subtitle: 'Challenge host', stations: 1 },
      { id: you, name: `Collector ${you.slice(-4).toUpperCase()}`, score: 141, teamName: '', subtitle: 'Joined by invite code', stations: 1 },
    ],
    ...over,
  });
  const TEAM_CHALLENGE = you => challengeFor_(you, {
    id: '0b7e4a52-3c2d-4f19-8e6b-2a1c9d8e7f60', title: 'Lakeshore team battle', description: '', format: 'team', inviteCode: 'LAKE-4M9X', targetScore: 500,
    participants: [
      { id: you, name: `Collector ${you.slice(-4).toUpperCase()}`, score: 96, teamName: 'North Front', subtitle: 'Challenge host', stations: 1 },
      { id: '0x00000000000000000000000000000000000beef1', name: 'Collector BEEF1', score: 0, teamName: 'Rain Riders', subtitle: 'Joined by invite code', stations: 0 },
    ],
    status: 'live',
  });
  // Free-play duels (backend#228) in the exact shape duel-routes.ts answers: one open, one running,
  // one decided by the chain's rewards, one draw at the baseline.
  const DUEL_ID = '6f1d2c4e-8a8b-4c1e-9d6a-1f2e3d4c5b6a';
  const hourAt = h => new Date(Math.floor(now / 3_600_000) * 3_600_000 + h * 3_600_000).toISOString();
  const duelEntry = (address, over = {}) => ({ address, commitId: null, linkedAt: null, recordVerified: false, modelId: null, forecast: null,
    chainReward: null, chainRewardFinalized: false, status: 'no_entry', invalidReason: null, ...over });
  const duelOf = (id, alias, targetH, over = {}) => ({
    id, stationAlias: alias, targetAt: hourAt(targetH), lockAt: hourAt(targetH - 6), resolveBy: hourAt(targetH + 48), status: 'open', phase: 'open',
    mode: 'free_play', stakes: null, creator: duelEntry('0x5ca1ab1e000000000000000000000000000d00d1', { commitId: hex(64), status: 'linked' }), opponent: null,
    invitedOpponent: null, outcome: null, judge: 'The chain', createdAt: iso(3_600_000), matchedAt: null, resolvedAt: null, ...over,
  });
  const DUEL_DECIDED = duelOf(DUEL_ID, 'st_7d29a4c1e0b8', -20, {
    status: 'resolved', phase: 'resolved', matchedAt: iso(30 * 3_600_000), resolvedAt: iso(2 * 3_600_000),
    creator: duelEntry('0x5ca1ab1e000000000000000000000000000d00d1', { commitId: hex(64), recordVerified: true, modelId: 'learned-conv1d/v1', forecast: { temperature_c: 9.4, pressure_hpa: 1012.8 }, chainReward: '71250000', chainRewardFinalized: true, status: 'linked' }),
    opponent: duelEntry('0x7e57ab1e00000000000000000000000000c0ffee', { commitId: hex(64), recordVerified: true, modelId: 'persistence-trend/v1', forecast: { temperature_c: 11.2, pressure_hpa: 1011.9 }, chainReward: '10000000', chainRewardFinalized: true, status: 'linked' }),
    outcome: { result: 'creator', winner: '0x5ca1ab1e000000000000000000000000000d00d1', reason: 'higher_chain_reward', note: 'The chain paid this forecast more: its oracle receipt scored higher.' },
  });
  const DUELS = {
    open: [duelOf('0b7e4a52-3c2d-4f19-8e6b-2a1c9d8e7f60', 'st_31c0e9a2b4d7', 14)],
    live: [duelOf('2d9c1b7a-6e5f-4a3b-9c8d-7e6f5a4b3c2d', 'st_7d29a4c1e0b8', 4, { status: 'matched', phase: 'waiting_for_target', matchedAt: iso(5 * 3_600_000),
      opponent: duelEntry('0x00000000000000000000000000000000000beef1', { commitId: hex(64), status: 'linked' }) })],
    finished: [DUEL_DECIDED, duelOf('9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d', 'st_31c0e9a2b4d7', -50, {
      status: 'resolved', phase: 'resolved', resolvedAt: iso(26 * 3_600_000),
      creator: duelEntry('0x5ca1ab1e000000000000000000000000000d00d1', { commitId: hex(64), recordVerified: true, forecast: { temperature_c: 6.1 }, chainReward: '10000000', chainRewardFinalized: true, status: 'linked' }),
      opponent: duelEntry('0x00000000000000000000000000000000000beef1', { commitId: hex(64), recordVerified: true, forecast: { temperature_c: 5.4 }, chainReward: '10000000', chainRewardFinalized: true, status: 'linked' }),
      outcome: { result: 'draw', winner: null, reason: 'equal_chain_reward', note: 'The chain paid both forecasts the same amount. Without an oracle receipt every forecast earns the 0.1 baseline, so this is a draw.' },
    })],
  };
  return { NETWORK_NODES, PEER, jwtFor, challengeFor, BLOCKS, STATIONS, ZONES, LEADERBOARD, PROPOSALS, TREASURY, CURRENT, hourly, daily, wallet, OBSERVATIONS, SUBMISSIONS, PROFILE, FORECASTERS, FORECASTERS_EMPTY, FORECASTER, COMPETITIONS, COMPETITION, BOND_GRANTS, PROOF_COMMIT, PROOF_CARD, WOLFRAM_ANSWER, CALIBRATION, FORECAST_CHECK, FORECAST_CHECK_EMPTY, CHALLENGE_CODE, CHALLENGE: challengeFor_, TEAM_CHALLENGE, DUEL_ID, DUELS, DUEL_DECIDED, downloadsManifest: readFixture('downloads-manifest.json') };
}

/**
 * Route every /api/* request (and the downloads manifest) to the fixtures.
 * Only backend paths are intercepted: a glob like `**\/api/**` would also catch
 * the app's own /src/hooks/api/* modules. `options.manifest`: 'populated'
 * (default) serves the fixture manifest; 'shipped' lets the app's own
 * public/downloads/manifest.json through. `options.forecasters`: 'populated'
 * (default), 'empty' (no rows: the honest empty state) or 'unavailable' (the
 * backend's 503 while the chain-reward index is off on a network).
 * `options.bondGrants`: 'populated' (default), 'empty' (no grants yet) or
 * 'unavailable' (the 503 a network without the public audit list answers).
 * `options.publicBalance`: 'populated' (default) or 'off' (the 404 while
 * PUBLIC_BALANCE_READ_ENABLED is not true).
 * `options.calibration`: 'calibrated' (default), 'revoked', 'none' or 'off' (the 404 while
 * CALIBRATION_CERTIFICATES_ENABLED is not true).
 * `options.forecastCheck`: 'populated' (default), 'empty' (nothing scored yet) or 'off' (the 404 while
 * FORECAST_VERIFICATION_ENABLED is not true).
 * `options.challenges`: 'populated' (default) or 'off' (the 404 while FRIEND_CHALLENGES_ENABLED is not true).
 * `options.duels`: 'populated' (default) or 'off' (the 404 while FORECAST_DUELS_ENABLED is not true).
 * `options.proofCard`: 'populated' (default), 'not_located' (the reveal is outside the server's
 * bounded block search) or 'off' (the 404 while PROOF_CARDS_ENABLED is not true).
 * `options.networkNodes`: 'populated' (default), 'partial' (bonds and attesters unavailable) or 'off'
 * (the 404 while NETWORK_NODES_READ_ENABLED is not true).
 * `options.competitions`: 'populated' (default), 'empty' (a new week, no points
 * yet) or 'unavailable' (the 503 while the index or the competition flag is off).
 * `options.sessionKeys`: 'off' (default: feature_active false, as on chain 888 today) or 'on'.
 * With 'on', a device registered through POST /api/wallet/session-keys is listed back as an active
 * key with that grant's limits (2.5 WRF already used today), so the setup flow can be driven for real.
 */
export async function installRoutes(page, fx, options = {}) {
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  const manifestMode = options.manifest || 'populated';
  const forecastersMode = options.forecasters || 'populated';
  const bondGrantsMode = options.bondGrants || 'populated';
  const publicBalanceMode = options.publicBalance || 'populated';
  const notificationsMode = options.notifications || 'off';
  const proofCardMode = options.proofCard || 'populated';
  const networkNodesMode = options.networkNodes || 'populated';
  const competitionsMode = options.competitions || 'populated';
  const sessionKeysMode = options.sessionKeys || 'off';
  fx.sessionKeyRecords ??= new Map();
  const calibrationMode = options.calibration || 'calibrated';
  const forecastCheckMode = options.forecastCheck || 'populated';
  const challengesMode = options.challenges || 'populated';
  const duelsMode = options.duels || 'populated';
  await page.route(url => url.pathname.startsWith('/api/') || url.pathname === '/downloads/manifest.json', async route => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname;
    let m;
    if (p === '/downloads/manifest.json') return manifestMode === 'shipped' ? route.continue() : json(route, fx.downloadsManifest);
    if ((m = /^\/api\/auth\/nonce\/(0x[0-9a-fA-F]{40})$/.exec(p))) { const nonce = `qa-${hex(16)}`; return json(route, { nonce, message: fx.challengeFor(m[1], nonce), scheme: 'ed25519' }); }
    if (p === '/api/auth/wallet-login' && req.method() === 'POST') { const body = JSON.parse(req.postData() || '{}'); fx.lastLoginAddress = String(body.address || '').toLowerCase(); return json(route, { jwt: fx.jwtFor(body.address), refreshToken: `r-${hex(16)}`, expiresIn: 3600 }); }
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
    if ((m = /^\/api\/wallet\/(0x[0-9a-fA-F]{40})\/session-keys$/.exec(p))) {
      const owner = m[1].toLowerCase();
      return json(route, { success: true, data: { owner, feature_active: sessionKeysMode === 'on', next_height: 48913, next_registration_nonce: (fx.sessionKeyRecords.get(owner) || []).length, chain_id: '777', session_keys: sessionKeysMode === 'on' ? (fx.sessionKeyRecords.get(owner) || []) : [] } });
    }
    if (p === '/api/wallet/session-keys' && req.method() === 'POST') {
      if (sessionKeysMode !== 'on') return json(route, { ok: false, error: { code: 'FEATURE_NOT_ACTIVE', message: 'session_keys is not active' } }, 503);
      const action = JSON.parse(req.postData() || '{}').action || {};
      const reg = action.Register;
      if (reg) {
        const owner = `0x${reg.owner.map(b => b.toString(16).padStart(2, '0')).join('')}`;
        const g = reg.grant; const sc = g.scope;
        const any = sc.allowed_targets.some(t => t.every(b => b === 255));
        const used = 250_000_000;
        const record = { session_key: `0x${hex(40)}`, public_key: g.public_key, registration_nonce: reg.registration_nonce, status: 'active', allowed_methods: sc.allowed_methods, any_target: any,
          allowed_targets: any ? [] : sc.allowed_targets.map(t => `0x${t.map(b => b.toString(16).padStart(2, '0')).join('')}`),
          max_value_per_use: String(sc.max_value_per_use), max_total_value: String(sc.max_total_value), total_remaining: String(sc.max_total_value - used),
          window: sc.window ? { blocks: sc.window.blocks, max_value: String(sc.window.max_value), remaining: String(sc.window.max_value - used), window_ends_at_height: g.valid_from + sc.window.blocks - 1 } : null,
          valid_from: g.valid_from, valid_until: g.valid_until, max_uses: g.max_uses, uses_so_far: 1, cumulative_value_used: String(used), revoked: false };
        fx.sessionKeyRecords.set(owner, [record]);
      }
      return json(route, { hash: `0x${hex(64)}`, action: reg ? 'register' : 'revoke', status: 'submitted', settled: false }, 202);
    }
    if ((m = /\/wallet\/(0x[0-9a-fA-F]{40})$/.exec(p))) return json(route, fx.wallet(m[1].toLowerCase()).balance);
    if ((m = /\/wallet\/(0x[0-9a-fA-F]{40})\/transactions$/.exec(p))) return json(route, fx.wallet(m[1].toLowerCase()).history);
    if ((m = /\/(0x[0-9a-fA-F]{40})\/nonce$/.exec(p))) return json(route, fx.wallet(m[1].toLowerCase()).nonce);
    if (/\/send$/.test(p) && req.method() === 'POST') return json(route, fx.wallet('0x0').send);
    if (p === '/api/weather/stations/mobile') return json(route, fx.wallet('0x0').mobileStation);
    if ((m = /^\/api\/stations\/([^/]+)\/ownership$/.exec(p))) return json(route, fx.wallet('0x7d29a4c1e0b8f36d5a92c4e7b1f08d3a6c5e0cb2').ownership);
    if ((m = /^\/api\/stations\/([^/]+)\/(observations|quality|submissions)$/.exec(p))) return json(route, m[2] === 'observations' ? { observations: fx.OBSERVATIONS, source: 'backend-db', unavailable: [] } : m[2] === 'quality' ? { overall: 0.93, dimensions: [{ name: 'completeness', score: 0.97 }, { name: 'timeliness', score: 0.91 }, { name: 'plausibility', score: 0.9 }], advisory: false, unavailable: [] } : { submissions: fx.SUBMISSIONS, source: 'backend-db', limit: 25, offset: 0 });
    if ((m = /^\/api\/weather\/stations\/([^/]+)$/.exec(p))) { const st = fx.STATIONS.find(x => x.stationId === decodeURIComponent(m[1])); return st ? json(route, { station: st, ...st }) : json(route, { error: 'not found' }, 404); }
    if ((m = /^\/api\/operators\/(c_[0-9a-f]{24})\/profile$/.exec(p))) return json(route, { profile: fx.PROFILE });
    if (p === '/api/forecasters' || p.startsWith('/api/forecasters/')) {
      if (forecastersMode === 'unavailable') return json(route, { status: 'unavailable', error: { code: 'FORECASTERS_DISABLED' }, reason: 'The forecast index is not enabled on this network.' }, 503);
      const period = ['7d', '30d', 'all'].includes(url.searchParams.get('period')) ? url.searchParams.get('period') : '7d';
      if (p === '/api/forecasters' || p === '/api/forecasters/') return json(route, forecastersMode === 'empty' ? fx.FORECASTERS_EMPTY(period) : fx.FORECASTERS(period));
      // c_ key only, like the backend for every public caller; the record answers for the fixture rows' keys.
      if ((m = /^\/api\/forecasters\/(c_[0-9a-f]{24})$/.exec(p)) && fx.FORECASTERS('7d').rows.some(r => r.profileKey === m[1])) return json(route, forecastersMode === 'empty' ? { ...fx.FORECASTER, totals: { ...fx.FORECASTER.totals, forecasts: '0', byProvenance: { real: '0', synthetic: '0', unclassified: '0' }, firstActiveAt: null, lastActiveAt: null }, series: [], recent: [] } : { ...fx.FORECASTER, profileKey: m[1] });
      return json(route, { error: { code: 'FORECASTER_NOT_FOUND' } }, 404);
    }
    if (p === '/api/competitions' || p.startsWith('/api/competitions/')) {
      if (competitionsMode === 'unavailable') return json(route, { status: 'unavailable', error: { code: 'COMPETITIONS_DISABLED' }, reason: 'Forecast competitions are not enabled on this network.' }, 503);
      if (p === '/api/competitions') return json(route, competitionsMode === 'empty' ? { ...fx.COMPETITIONS, weeks: fx.COMPETITIONS.weeks.slice(0, 1).map(w => ({ ...w, entrants: 0, forecasts: '0', leaders: [] })) } : fx.COMPETITIONS);
      const week = p.slice('/api/competitions/'.length);
      const body = fx.COMPETITION(week);
      if (!body) return json(route, { error: { code: 'COMPETITION_NOT_FOUND' } }, 404);
      return json(route, competitionsMode === 'empty' ? { ...body, entrants: 0, forecasts: '0', rows: [] } : body);
    }
    // Payout notifications (backend#389). Default 'off': the config read 404s and the explore page shows no
    // "Notify me" box, so every other capture is unchanged. 'on': both channels, one ntfy topic already added.
    if (p.startsWith('/api/notifications/')) {
      if (notificationsMode !== 'on') return json(route, { error: 'Not found' }, 404);
      if (p === '/api/notifications/config') return json(route, { enabled: true, events: ['payout.credited'], checkEveryMinutes: 5, webPush: { available: true, publicKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U' }, ntfy: { available: true, server: 'https://ntfy.sh' }, stores: 'An address and a browser push subscription or an ntfy topic. No email, name or IP address.' });
      if ((m = /^\/api\/notifications\/subscriptions\/(0x[0-9a-f]{40})$/.exec(p))) return json(route, { success: true, address: m[1], subscriptions: [{ id: '0b0b0b0b-1c1c-4d4d-8e8e-9f9f9f9f9f9f', address: m[1], channel: 'ntfy', label: 'wrfcoin-pay-7f3a9c41d2e8b605', targetHash: 'ab'.repeat(32), createdAt: new Date(Date.now() - 86_400_000).toISOString(), lastDeliveredAt: null }], lastCheck: null });
      return json(route, { error: { code: 'NOTIFICATIONS_UNAVAILABLE' } }, 503);
    }
    if ((m = /^\/api\/public\/balance\/(0x[0-9a-fA-F]{40})$/.exec(p))) {
      if (publicBalanceMode === 'off') return json(route, { error: 'Not found' }, 404);
      // A house-node payout account after two paid epochs (2 x 189.62962944 WRF).
      return json(route, { address: m[1].toLowerCase(), balance: '37925925888', height: 10114, earned: '37925925888' });
    }
    if (p === '/api/integrations/wolfram/reading-check' && req.method() === 'POST') return json(route, fx.WOLFRAM_ANSWER);
    if ((m = /^\/api\/calibration-certificates\/station\/(st_[0-9a-f]{12})$/.exec(p))) {
      if (calibrationMode === 'off') return json(route, { error: { code: 'NOT_FOUND' } }, 404);
      const base = { ...fx.CALIBRATION, stationAlias: m[1] };
      if (calibrationMode === 'none') return json(route, { ...base, status: 'none', certificate: null });
      if (calibrationMode === 'revoked') {
        return json(route, { ...base, status: 'revoked', certificate: { ...base.certificate, status: 'revoked', reasonCodes: ['CAL_OK'], revocation: { reason: 'sensor_replaced', revokedAt: base.checkedAt } } });
      }
      return json(route, base);
    }
    if (p === '/api/forecast-verification/summary') {
      if (forecastCheckMode === 'off') return json(route, { error: 'Not found' }, 404);
      return json(route, forecastCheckMode === 'empty' ? fx.FORECAST_CHECK_EMPTY : fx.FORECAST_CHECK);
    }
    if ((m = /^\/api\/challenges\/code\/([A-Z0-9]{4}-[A-Z0-9]{4})$/.exec(p))) {
      if (challengesMode === 'off' || m[1] !== fx.CHALLENGE_CODE) return json(route, { error: 'Not found' }, 404);
      return json(route, { challenge: fx.CHALLENGE('0x7e57ab1e00000000000000000000000000c0ffee') });
    }
    if (p === '/api/challenges' && req.method() === 'GET') {
      if (challengesMode === 'off') return json(route, { error: 'Not found' }, 404);
      const bearer = (req.headers().authorization || '').split('.')[1] || '';
      let you = '0x7e57ab1e00000000000000000000000000c0ffee';
      try { you = JSON.parse(Buffer.from(bearer.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()).sub || you; } catch { /* fixture default */ }
      return json(route, { challenges: [fx.CHALLENGE(you), fx.TEAM_CHALLENGE(you)] });
    }
    if (p === '/api/duels' && req.method() === 'GET') {
      if (duelsMode === 'off') return json(route, { error: 'Not found' }, 404);
      return json(route, fx.DUELS);
    }
    if ((m = /^\/api\/duels\/([0-9a-f-]{36})$/.exec(p)) && req.method() === 'GET') {
      if (duelsMode === 'off' || m[1] !== fx.DUEL_ID) return json(route, { error: 'Not found' }, 404);
      return json(route, { duel: fx.DUEL_DECIDED });
    }
    if ((m = /^\/api\/proofs\/([0-9a-f]{64})$/.exec(p))) {
      if (proofCardMode === 'off' || m[1] !== fx.PROOF_COMMIT) return json(route, { error: 'Not found' }, 404);
      if (proofCardMode === 'not_located') return json(route, { ...fx.PROOF_CARD, reading: null, inclusion: { status: 'not_located', block: null }, attestation: null });
      return json(route, fx.PROOF_CARD);
    }
    if (p === '/api/network/nodes') {
      if (networkNodesMode === 'off') return json(route, { error: 'Not found' }, 404);
      if (networkNodesMode === 'partial') return json(route, { ...fx.NETWORK_NODES, bonded: { status: 'unavailable', epoch: null, discovery: { settlementEpochs: [], configured: 0 }, nodes: [] }, attesters: { status: 'unavailable', quorum: null, ids: [] } });
      return json(route, fx.NETWORK_NODES);
    }
    if (p === '/api/faucet/bond-grants') {
      if (bondGrantsMode === 'unavailable') return json(route, { error: { code: 'BOND_GRANTS_UNAVAILABLE', message: 'Bond grant history is unavailable' } }, 503);
      return json(route, bondGrantsMode === 'empty' ? { grants: [] } : fx.BOND_GRANTS);
    }
    return json(route, { error: 'visual-qa stub: not provided' }, 404);
  });
}
