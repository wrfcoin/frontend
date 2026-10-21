// Ratchet-down record for frontend#356. Kept in its own file so parallel
// ratchet-down PRs do not edit the same lines.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const checker = path.resolve('scripts/check-ungated-fabrication.mjs');

const RETIRED = [
  // Gated sample: no backend concept of foundation proposals; no fake vote.
  'src/components/Governance/FoundationGovernanceVoting.jsx',
  // Wired to /voting-power, /delegations, /delegate and /analytics/delegates.
  'src/components/GovernanceAdvanced/DelegationManager.jsx',
  // Wired to /analytics/{dashboard,participation,treasury,delegates}.
  'src/components/GovernanceAdvanced/ProposalAnalytics.jsx',
];

test('frontend#356 retired baseline entries stay removed', () => {
  const baseline = JSON.parse(
    fs.readFileSync(path.resolve('scripts/ungated-fabrication-baseline.json'), 'utf8'),
  );
  for (const entry of RETIRED) {
    assert.ok(fs.existsSync(path.resolve(entry)), `${entry} still exists`);
    assert.ok(!baseline.includes(entry), `${entry} is back in the baseline`);
  }
  const result = spawnSync(process.execPath, [checker], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});
