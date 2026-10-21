import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

for (const name of ['SwapInterface', 'YieldFarmingPanel']) {
  test(`the real sample gate for ${name} cannot be removed`, t => {
    const file = `src/components/DeFi/${name}.tsx`;
    const source = fs.readFileSync(file, 'utf8');
    const gates = JSON.parse(fs.readFileSync('scripts/fabrication-reviewed-local-gates.json', 'utf8'));
    assert.ok(gates[file]);
    const baseline = JSON.parse(fs.readFileSync('scripts/ungated-fabrication-baseline.json', 'utf8'));
    assert.ok(!baseline.includes(file), 'the retired DeFi sample cannot remain in the baseline');
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'defi-tab-gate-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    fs.mkdirSync(path.join(root, 'src/components/DeFi'), { recursive: true });
    fs.mkdirSync(path.join(root, 'scripts'));
    fs.writeFileSync(path.join(root, 'src/App.jsx'), `import View from './components/DeFi/${name}.tsx';`);
    fs.writeFileSync(path.join(root, file), source);
    fs.writeFileSync(path.join(root, 'scripts/ungated-fabrication-baseline.json'), '[]');
    fs.writeFileSync(path.join(root, 'scripts/fabrication-reviewed-local-gates.json'), JSON.stringify({ [file]: gates[file] }));
    const run = () => spawnSync(process.execPath, ['scripts/check-ungated-fabrication.mjs', '--root', root], { encoding: 'utf8' });
    const clean = run();
    assert.equal(clean.status, 0, clean.stdout + clean.stderr);
    const mutant = source.replace(`export default ${name};`, `export default ${name}Sample;`);
    assert.notEqual(mutant, source);
    fs.writeFileSync(path.join(root, file), mutant);
    const result = run();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Stale or changed reviewed gate/);
  });
}
