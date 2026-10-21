import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('the production liquid-staking capability guard is pinned by the ratchet', t => {
  const file = 'src/components/Staking/LiquidStakingDashboard.tsx';
  const source = fs.readFileSync(file, 'utf8');
  const gates = JSON.parse(fs.readFileSync('scripts/fabrication-reviewed-local-gates.json', 'utf8'));
  assert.ok(gates[file], 'the capability guard needs an exact-source reviewed entry');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'liquid-staking-gate-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'src/components/Staking'), { recursive: true });
  fs.mkdirSync(path.join(root, 'scripts'));
  fs.writeFileSync(path.join(root, 'src/App.jsx'), "import Dashboard from './components/Staking/LiquidStakingDashboard.tsx';");
  fs.writeFileSync(path.join(root, file), source);
  fs.writeFileSync(path.join(root, 'scripts/ungated-fabrication-baseline.json'), '[]');
  fs.writeFileSync(path.join(root, 'scripts/fabrication-reviewed-local-gates.json'), JSON.stringify({ [file]: gates[file] }));
  const run = () => spawnSync(process.execPath, ['scripts/check-ungated-fabrication.mjs', '--root', root], { encoding: 'utf8' });
  assert.equal(run().status, 0);
  const mutant = source.replace("loading || error || (status !== 'operational' && status !== 'degraded')", 'false');
  assert.notEqual(mutant, source, 'mutation must remove the actual capability condition');
  fs.writeFileSync(path.join(root, file), mutant);
  const result = run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Stale or changed reviewed gate/);
});
