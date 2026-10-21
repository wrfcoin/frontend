// Ratchet-down record for frontend#353. Kept in its own file so parallel
// ratchet-down PRs do not edit the same lines.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const checker = path.resolve('scripts/check-ungated-fabrication.mjs');

const RETIRED = [
  // Gated sample; the 3 s "import complete" timers are removed.
  'src/components/DataUpload/BatchUploadPage.tsx',
  // Marker removed: no simulated OAuth, and every action is disabled with a reason.
  'src/components/DataUpload/CloudConnector.tsx',
  // Gated sample; the simulated load and job submission are removed.
  'src/components/CortexAI/CortexAIIntegration.jsx',
  // Gated sample; the fake buy/bid/execute/mint alerts are removed.
  'src/components/nft/ComputationalNFTMarketplace.jsx',
  // Marker removed: the header reads the minted count from GET /api/nft.
  'src/pages/EnhancedNFTPage.jsx',
  // Gated sample; the timer-driven "processing" walkthrough is removed.
  'src/components/ComputationalNFT/EnterpriseDemo.jsx',
];

test('frontend#353 retired baseline entries stay removed', () => {
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
