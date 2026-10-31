#!/usr/bin/env node
/**
 * public/downloads/SHA256SUMS is derived from public/downloads/manifest.json, never hand-edited.
 *
 * The Downloads page tells visitors to run `sha256sum -c SHA256SUMS`, so the file must list exactly the
 * PUBLISHED file artifacts of the manifest, one `<sha256>  <filename>` line each (two spaces, the
 * filename being the last path segment of the artifact's download URL). That is the same format the
 * infra release step writes (infra testnet/scripts/public_release.py).
 *
 *   node scripts/downloads-sha256sums.mjs          rewrite SHA256SUMS from the manifest
 *   node scripts/downloads-sha256sums.mjs --check  exit 1 if SHA256SUMS differs from the manifest
 *
 * `npm test` (pretest) and `npm run build` (prebuild) run the check, so the two cannot drift.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DIR = new URL('../public/downloads/', import.meta.url);
export const MANIFEST_PATH = fileURLToPath(new URL('manifest.json', DIR));
export const SUMS_PATH = fileURLToPath(new URL('SHA256SUMS', DIR));

const SHA256_RE = /^[0-9a-f]{64}$/;
// A file name a shell can pass to sha256sum unquoted: no spaces, separators or leading dot.
const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._+-]*$/;

/** The SHA256SUMS text for a parsed manifest. Throws on a published file entry that cannot be listed. */
export function renderSha256Sums(manifest) {
  const artifacts = Array.isArray(manifest?.artifacts) ? manifest.artifacts : [];
  const lines = [];
  const names = new Set();
  for (const a of artifacts) {
    if (!a || a.kind !== 'file' || a.published !== true) continue;
    const id = a.id ?? '(no id)';
    if (typeof a.sha256 !== 'string' || !SHA256_RE.test(a.sha256)) {
      throw new Error(`published file artifact ${id} has no lowercase 64-hex sha256`);
    }
    let name;
    try {
      name = decodeURIComponent(new URL(a.url).pathname.split('/').pop() ?? '');
    } catch {
      throw new Error(`published file artifact ${id} has no valid download URL`);
    }
    if (!NAME_RE.test(name)) throw new Error(`published file artifact ${id} has an unusable file name: ${JSON.stringify(name)}`);
    if (names.has(name)) throw new Error(`two published file artifacts share the file name ${name}`);
    names.add(name);
    lines.push(`${a.sha256}  ${name}\n`);
  }
  return lines.join('');
}

export function readManifest(path = MANIFEST_PATH) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function main(argv) {
  const expected = renderSha256Sums(readManifest());
  if (argv.includes('--check')) {
    let actual = null;
    try {
      actual = readFileSync(SUMS_PATH, 'utf8');
    } catch {
      // missing file is drift
    }
    if (actual !== expected) {
      console.error('public/downloads/SHA256SUMS does not match the published file artifacts in manifest.json.');
      console.error('Run: node scripts/downloads-sha256sums.mjs');
      process.exit(1);
    }
    console.log(`SHA256SUMS matches manifest.json (${expected.split('\n').filter(Boolean).length} file(s))`);
    return;
  }
  writeFileSync(SUMS_PATH, expected);
  console.log(`wrote public/downloads/SHA256SUMS (${expected.split('\n').filter(Boolean).length} file(s))`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main(process.argv.slice(2));
