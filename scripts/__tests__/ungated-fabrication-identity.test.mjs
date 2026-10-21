import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const checker = path.resolve('scripts/check-ungated-fabrication.mjs');
for (const declaration of [
  'const FALLBACK_CREDENTIALS: Credential[] = [{ id: "invented", status: "active" }];',
  'const FALLBACK_POLICIES = [{ enforced: true }];',
]) {
  test(`credential fallback records are fabrication: ${declaration}`, t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'identity-ratchet-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    fs.mkdirSync(path.join(root, 'src/hooks'), { recursive: true });
    fs.mkdirSync(path.join(root, 'scripts'));
    fs.writeFileSync(path.join(root, 'src/App.jsx'), "import './hooks/useCredentialLifecycle'; export default () => null;");
    const current = fs.readFileSync('src/hooks/useCredentialLifecycle.ts', 'utf8');
    fs.writeFileSync(path.join(root, 'src/hooks/useCredentialLifecycle.ts'), current);
    fs.writeFileSync(path.join(root, 'scripts/ungated-fabrication-baseline.json'), '[]');
    const run = () => spawnSync(process.execPath, [checker, '--root', root], { encoding: 'utf8' });
    assert.equal(run().status, 0);
    fs.appendFileSync(path.join(root, 'src/hooks/useCredentialLifecycle.ts'), `\n${declaration}\n`);
    const mutant = run();
    assert.equal(mutant.status, 1, mutant.stdout + mutant.stderr);
    assert.match(mutant.stderr, /src\/hooks\/useCredentialLifecycle.ts/);
  });
}
