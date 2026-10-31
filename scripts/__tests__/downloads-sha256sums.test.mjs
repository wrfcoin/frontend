import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MANIFEST_PATH, SUMS_PATH, readManifest, renderSha256Sums } from '../downloads-sha256sums.mjs';

const HASH = 'a'.repeat(64);
const file = (over = {}) => ({
  id: 'x', kind: 'file', url: 'https://github.com/wrfcoin/core4/releases/download/v1/x-setup.exe', sha256: HASH, published: true, ...over,
});

test('public/downloads/SHA256SUMS matches the published file artifacts in manifest.json', () => {
  assert.equal(readFileSync(SUMS_PATH, 'utf8'), renderSha256Sums(readManifest(MANIFEST_PATH)));
});

test('every published file in the manifest has exactly one line, and nothing else is listed', () => {
  const manifest = readManifest(MANIFEST_PATH);
  const published = manifest.artifacts.filter(a => a.kind === 'file' && a.published === true);
  const lines = readFileSync(SUMS_PATH, 'utf8').split('\n').filter(Boolean);
  assert.equal(lines.length, published.length);
  for (const a of published) assert.ok(lines.includes(`${a.sha256}  ${a.url.split('/').pop()}`), a.id);
});

test('format is <sha256>, two spaces, file name, newline', () => {
  assert.equal(renderSha256Sums({ artifacts: [file()] }), `${HASH}  x-setup.exe\n`);
});

test('unpublished files and git sources are not listed', () => {
  const text = renderSha256Sums({
    artifacts: [
      file({ published: false }),
      file({ id: 'y', published: 'true' }),
      { id: 'src', kind: 'git', url: 'https://github.com/wrfcoin/core4', published: true },
    ],
  });
  assert.equal(text, '');
});

test('a published file without a usable hash, URL or name is refused rather than listed', () => {
  assert.throws(() => renderSha256Sums({ artifacts: [file({ sha256: null })] }), /sha256/);
  assert.throws(() => renderSha256Sums({ artifacts: [file({ sha256: HASH.toUpperCase() })] }), /sha256/);
  assert.throws(() => renderSha256Sums({ artifacts: [file({ url: null })] }), /download URL/);
  assert.throws(() => renderSha256Sums({ artifacts: [file({ url: 'https://example.invalid/a%20b.exe' })] }), /file name/);
  assert.throws(() => renderSha256Sums({ artifacts: [file(), file({ id: 'z' })] }), /share the file name/);
});
