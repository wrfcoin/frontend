// Ratchet-down record for the frontend#352 baseline audit (PR #398, class C).
// Kept in its own file so parallel ratchet-down PRs do not edit the same lines.
//
// Neither file is gated: neither one fabricates anything any more.
//   - ManualSetupFlow.tsx matched only because a comment described the check it
//     replaced ("... simulation"); the validator calls POST /weather/stations/verify-key.
//   - NewWalletPage.jsx carried a real fake: a fixed 300 ms "Loading Wallet..."
//     screen with nothing loading. The delay is deleted, not reworded; the
//     render pin lives in src/pages/__tests__/NewWalletPage.honesty.test.jsx.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const checker = path.resolve('scripts/check-ungated-fabrication.mjs');

const RETIRED = [
  'src/components/Onboarding/ManualSetupFlow.tsx',
  'src/pages/NewWalletPage.jsx',
];

test('frontend#352 audit: false-positive / fake-delay entries stay removed', () => {
  const baseline = JSON.parse(
    fs.readFileSync(path.resolve('scripts/ungated-fabrication-baseline.json'), 'utf8'),
  );
  for (const entry of RETIRED) {
    assert.ok(fs.existsSync(path.resolve(entry)), `${entry} still exists`);
    assert.ok(!baseline.includes(entry), `${entry} is back in the baseline`);
  }
  const wallet = fs.readFileSync(path.resolve('src/pages/NewWalletPage.jsx'), 'utf8');
  assert.doesNotMatch(wallet, /Simulate initial load/);
  assert.doesNotMatch(wallet, /setTimeout\(resolve, 300\)/);
  const result = spawnSync(process.execPath, [checker], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});
