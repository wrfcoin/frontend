import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
const RETIRED = [
  "src/components/Integrations/CategoryOptimizer.tsx",
  "src/components/Integrations/IntegrationWizard.tsx",
  "src/components/DeviceSetupGuide.jsx",
  "src/components/Integrations/AIPluginsHub.jsx",
  "src/components/AI/AIMLDashboard.jsx",
  "src/components/NetworkInsights/LightClientPanel.tsx",
  "src/components/NetworkInsights/NetworkTopologyMap.tsx",
  "src/components/ZKVerification/PrivacyProofExplorer.tsx",
  "src/components/ZKVerification/TheProverUI.tsx",
  "src/components/Mobile/MobileIntegrationsHub.tsx",
  "src/components/UnifiedAnalytics/CostAnalysisDashboard.tsx",
  "src/components/Integrations/IoT/IoTIntegrationDetails.jsx",
  "src/components/Integrations/AI/AIIntegrationDetails.jsx",
  "src/components/Integrations/CrossChain/CrossChainIntegrationDetails.jsx"
];
test('400/401/405/406/407 retired findings remain removed and leaf gates stay in-file', () => {
  const baseline=JSON.parse(fs.readFileSync('scripts/ungated-fabrication-baseline.json','utf8'));
  for (const file of RETIRED) {
    assert.ok(!baseline.includes(file),`${file} returned to baseline`);
    if (!file.endsWith('IntegrationDetails.jsx')) assert.match(fs.readFileSync(file,'utf8'),/DemoSurfaceGate/);
  }
  const hub=fs.readFileSync('src/components/Integrations/IntegrationsHubEnhanced.jsx','utf8');
  assert.doesNotMatch(hub,/import (IoT|AI|CrossChain)IntegrationDetails/);
  const check=spawnSync(process.execPath,['scripts/check-ungated-fabrication.mjs'],{encoding:'utf8'});
  assert.equal(check.status,0,check.stdout+check.stderr);
});

test('fabrication workflow discovers all script regressions', () => {
 const workflow = fs.readFileSync('.github/workflows/fabrication-ratchet.yml', 'utf8');
 assert.match(workflow, /- "scripts\/__tests__\/\*\*"/);
 assert.match(workflow, /run: node --test scripts\/__tests__\/\*\.test\.mjs/);
});
