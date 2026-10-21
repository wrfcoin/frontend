import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import surface from './lib/api-surface.cjs';

// From frontend: node scripts/generate-backend-mounts.mjs <backend-checkout>
// Fetch backend origin first. The checkout working tree is never read.
const repo = resolve(process.argv[2] || '../backend');
const manifest = surface.generateManifest(repo);
const output = resolve('src/services/__fixtures__/backend-mounts.json');
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${manifest.families.length} families at ${manifest.backendCommit}`);
