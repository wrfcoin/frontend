import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const checker = path.resolve('scripts/check-ungated-fabrication.mjs');

function fixture(t, entry, source, reviewed = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'miner-pop-ratchet-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, path.dirname(entry)), { recursive: true });
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(root, entry), source);
  fs.writeFileSync(path.join(root, 'src/App.jsx'), `import Widget from './${entry.slice(4)}'; export default Widget;`);
  fs.writeFileSync(path.join(root, 'scripts/ungated-fabrication-baseline.json'), '[]');
  fs.writeFileSync(path.join(root, 'scripts/fabrication-reviewed-local-gates.json'), JSON.stringify(reviewed));
  return root;
}

function run(root) {
  return spawnSync(process.execPath, [checker, '--root', root], { encoding: 'utf8' });
}

for (const declaration of [
  'const HardwareStatusSample = () => "Synthetic CPU";',
  'function OverviewSample() { return "94.3%"; }',
]) {
  test(`ungated illustrative data is rejected: ${declaration}`, t => {
    const root = fixture(t, 'src/Widget.jsx', `${declaration}\nexport default function Widget() { return null; }`);
    const result = run(root);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /New reachable ungated[\s\S]*src\/Widget.jsx/);
  });
}

test('sample badge styling alone is not fabricated telemetry', t => {
  const root = fixture(t, 'src/Widget.jsx', 'const SAMPLE_BADGE_SX = { color: "amber" }; export default function Widget() { return null; }');
  assert.equal(run(root).status, 0);
});

const reviewed = JSON.parse(fs.readFileSync('scripts/fabrication-reviewed-local-gates.json', 'utf8'));
for (const [entry, gateCount] of [
  ['src/components/Miner/v2/HardwareStatusSection.tsx', 1],
  ['src/components/PoP/PopDashboardSamples.jsx', 4],
]) {
  test(`${entry}: every production sample gate is enforced`, t => {
    const source = fs.readFileSync(entry, 'utf8');
    const root = fixture(t, entry, source, reviewed[entry] ? { [entry]: reviewed[entry] } : {});
    const pristine = run(root);
    assert.equal(pristine.status, 0, pristine.stdout + pristine.stderr);
    const openings = [...source.matchAll(/<DemoSurfaceGate\b[^>]*>/g)];
    assert.equal(openings.length, gateCount);
    for (const opening of openings) {
      const end = source.indexOf('</DemoSurfaceGate>', opening.index);
      assert.ok(end > opening.index);
      const changed = source.slice(0, opening.index) + '<>' + source.slice(opening.index + opening[0].length, end) + '</>' + source.slice(end + '</DemoSurfaceGate>'.length);
      fs.writeFileSync(path.join(root, entry), changed);
      const mutant = run(root);
      assert.equal(mutant.status, 1, mutant.stdout + mutant.stderr);
      assert.ok(mutant.stderr.includes(entry), mutant.stderr);
    }
  });
}
