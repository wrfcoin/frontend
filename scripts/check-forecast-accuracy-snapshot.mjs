import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const snapshot = fileURLToPath(new URL('../src/types/__fixtures__/ForecastAccuracyMetrics.generated.ts.txt', import.meta.url));
const sourcePath = 'shared/generated-types/ForecastAccuracyMetrics.ts';
const pinnedCommit = '880bc51b7cf37d7fd11c8945daad2cdf958acdc6';
const pinnedHash = '5c4d91377aba4022188fe46bb768000d09f2fd59b80da91d5908cfb676e22abc';
const hash = text => createHash('sha256').update(text).digest('hex');

export function checkSnapshot(fixture, provenanceSource, currentSource) {
  const newline = fixture.indexOf('\n');
  const header = fixture.slice(0, newline);
  const body = fixture.slice(newline + 1);
  if (header !== `// Snapshot: wrfcoin/backend@${pinnedCommit} ${sourcePath}`) {
    throw new Error('Snapshot provenance commit differs from the reviewed pin');
  }
  if (hash(body) !== pinnedHash || body !== provenanceSource) {
    throw new Error('Snapshot bytes differ from the provenance commit');
  }
  if (body !== currentSource) {
    throw new Error('ForecastAccuracyMetrics backend drift: refresh the reviewed snapshot and shim');
  }
  return { commit: pinnedCommit, sha256: pinnedHash };
}

// Explicit local checkout; no network access or silent skip when it is absent.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const backend = process.argv[2];
    const ref = process.argv[3] ?? 'origin/main';
    if (!backend || process.argv.length > 4 || ref.startsWith('-')) {
      throw new Error('Usage: node scripts/check-forecast-accuracy-snapshot.mjs <backend-checkout> [git-ref]');
    }
    const source = gitRef => execFileSync('git', ['-C', backend, 'show', `${gitRef}:${sourcePath}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const result = checkSnapshot(readFileSync(snapshot, 'utf8'), source(pinnedCommit), source(ref));
    console.log(`ForecastAccuracyMetrics snapshot matches ${ref}; provenance ${result.commit}; sha256 ${result.sha256}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Snapshot check failed');
    process.exitCode = 1;
  }
}
