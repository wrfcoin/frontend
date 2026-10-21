import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
function productionSources(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (/^(__tests__|__mocks__|stories|fixtures)$/.test(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? productionSources(file)
      : /\.(jsx?|tsx?)$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name) ? [file] : [];
  });
}
test('production sources have no client for the unmounted DeFi API namespace', () => {
  const callers = productionSources(path.join(root, 'src')).filter(file =>
    /(?:\/api)?\/v1\/defi(?:\/|['"`])/.test(fs.readFileSync(file, 'utf8')));
  assert.deepEqual(callers.map(file => path.relative(root, file)), []);
});
test('the retired DeFi transport and hooks cannot be imported from their old paths or barrel', () => {
  for (const file of ['src/services/apiClient/defiService.ts', 'src/hooks/api/useDefiQueries.ts']) {
    assert.equal(fs.existsSync(path.join(root, file)), false, file);
  }
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'src/services/apiClient/index.ts'), 'utf8'), /defiService|DefiService/);
});
