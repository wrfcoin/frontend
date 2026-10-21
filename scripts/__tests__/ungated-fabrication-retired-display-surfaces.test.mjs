// Ratchet-down record for frontend#352. Kept in its own file so parallel
// ratchet-down PRs do not edit the same lines.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const checker = path.resolve('scripts/check-ungated-fabrication.mjs');

// Each file below gates its own sample behind DemoSurfaceGate; none is hidden
// behind a parent gate.
const RETIRED = [
  'src/components/AccessibilityHub/ScreenReaderHelper.tsx',
  'src/components/CarbonReporting/CreditVerification.jsx',
  'src/components/CarbonReporting/ScopeBreakdown.jsx',
  'src/components/CarbonTracking/CarbonTrackingDashboard.jsx',
  'src/components/CollaborativeAnalysis/CollaborativeAnalysis.jsx',
  'src/components/CollaborativeAnalysis/WorkspaceEditor.jsx',
  'src/components/ExecutionDebugger/StateDebugger.tsx',
  'src/components/ExecutionDebugger/TransactionInspector.tsx',
  'src/components/I18n/LanguageSwitcher.jsx',
  'src/components/I18n/TranslationManager.jsx',
  'src/components/Integrations/SonmCard.jsx',
  'src/components/Integrations/StoryProtocol/IPKit.jsx',
  'src/components/Integrations/StoryProtocol/NFTOracle.jsx',
  'src/components/Integrations/StoryProtocol/ProtocolContracts.jsx',
  'src/components/Luftdaten/LuftdatenDashboard.jsx',
  'src/components/Notifications/PushSetup.jsx',
  'src/components/Settings/CrossChainConfigPage.jsx',
  'src/components/Settings/ModuleManagementPage.jsx',
  'src/components/ValidatorOps/SlashingMonitor.tsx',
  'src/components/ValidatorOps/ValidatorCompare.tsx',
  'src/components/developer/ApiDocumentation.jsx',
  'src/components/developer/SDKDownloads.jsx',
];

test('frontend#352 retired baseline entries stay removed', () => {
  const baseline = JSON.parse(
    fs.readFileSync(path.resolve('scripts/ungated-fabrication-baseline.json'), 'utf8'),
  );
  for (const entry of RETIRED) {
    assert.ok(fs.existsSync(path.resolve(entry)), `${entry} still exists`);
    assert.ok(!baseline.includes(entry), `${entry} is back in the baseline`);
    assert.match(fs.readFileSync(path.resolve(entry), 'utf8'), /DemoSurfaceGate/, `${entry} lost its own gate`);
  }
  const result = spawnSync(process.execPath, [checker], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});
