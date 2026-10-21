// The visual QA plan must cover every public navigation path, and its fixtures
// must be well-formed. No browser here: this runs with the other script tests.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { PARAM_ROUTE_EXAMPLES, ROUTES, SCENARIOS, VIEWPORTS } from '../visual-qa/plan.mjs';
import { buildFixtures, readFixture } from '../visual-qa/fixtures.mjs';

const nav = fs.readFileSync(path.resolve('src/config/publicNavigation.ts'), 'utf8');
const navPaths = [...nav.matchAll(/path: '(\/[^']*)'/g)].map(m => m[1]);
const nonMenu = [...nav.matchAll(/^\s+'(\/[^']*)':/gm)].map(m => m[1]);

test('every public navigation path is in the visual QA plan', () => {
  assert.ok(navPaths.length >= 10, `expected the public nav list, found ${navPaths.length} paths`);
  const planned = new Set(ROUTES.map(r => r.route));
  for (const p of [...navPaths, ...nonMenu]) {
    const concrete = p.includes(':') ? PARAM_ROUTE_EXAMPLES[p] : p;
    if (p === '/earn') continue; // alias of /connect-station, same page
    assert.ok(concrete, `no example route for parameterised path ${p}`);
    assert.ok(planned.has(concrete), `${p} (${concrete}) is not in ROUTES`);
  }
});

test('plan entries are unique, rooted and named', () => {
  const names = [...ROUTES, ...SCENARIOS].map(r => r.name);
  assert.equal(new Set(names).size, names.length, 'duplicate capture names');
  for (const r of ROUTES) {
    assert.match(r.route, /^\/[a-z0-9/_-]*$/i, `route ${r.route} is not a rooted path`);
    assert.match(r.name, /^[a-z0-9-]+$/, `name ${r.name} must be a file-safe slug`);
  }
  assert.deepEqual(VIEWPORTS.map(v => v.width), [1440, 390]);
  for (const v of VIEWPORTS) assert.ok(v.tall > v.height, `${v.name}: tall viewport must exceed the normal one`);
});

test('the populated downloads manifest fixture is well-formed and clearly a fixture', () => {
  const manifest = readFixture('downloads-manifest.json');
  assert.ok(Array.isArray(manifest.artifacts) && manifest.artifacts.length >= 2);
  for (const a of manifest.artifacts) {
    assert.match(a.id, /^[a-z0-9_-]+$/);
    assert.ok(['git', 'file'].includes(a.kind));
    if (a.kind === 'file') assert.match(a.sha256, /^[0-9a-f]{64}$/, `${a.id}: sha256 must be 64 hex`);
    if (a.kind === 'git') assert.match(a.commit, /^[0-9a-f]{7,40}$/, `${a.id}: commit must be hex`);
  }
  // The shipped manifest (once the Downloads page ships it) must not carry the fixture hashes.
  const shippedPath = path.resolve('public/downloads/manifest.json');
  if (!fs.existsSync(shippedPath)) return;
  const shipped = JSON.parse(fs.readFileSync(shippedPath, 'utf8'));
  const fixtureHashes = new Set(manifest.artifacts.map(a => a.sha256).filter(Boolean));
  for (const a of shipped.artifacts || []) assert.ok(!fixtureHashes.has(a.sha256), `${a.id}: fixture hash in the shipped manifest`);
});

test('fixtures build without a browser and the login challenge has the 14-line shape', () => {
  const fx = buildFixtures({ origin: 'http://127.0.0.1:5199', host: '127.0.0.1:5199', now: Date.UTC(2026, 9, 19, 12) });
  assert.equal(fx.BLOCKS.length, 25);
  assert.equal(fx.PROPOSALS.length, 5);
  const challenge = fx.challengeFor('0xABCDEF0123456789ABCDEF0123456789ABCDEF01', 'n1').split('\n');
  assert.equal(challenge.length, 14);
  assert.equal(challenge[0], 'wrfcoin_wallet_login_ed25519_v1');
  assert.equal(challenge[2], '0xabcdef0123456789abcdef0123456789abcdef01');
  assert.ok(challenge.includes('Chain ID: 777') && challenge.includes('Network: testnet'));
  const jwt = fx.jwtFor('0xABC');
  assert.equal(jwt.split('.').length, 3);
});
