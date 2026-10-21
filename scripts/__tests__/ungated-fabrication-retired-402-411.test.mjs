import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
const RETIRED = [
  "src/components/Achievements/AchievementBadgeSystem.jsx",
  "src/components/DataQuality/QualityAlerts.tsx",
  "src/components/DataQuality/QualityTimeline.tsx",
  "src/components/ClimateReports/ClimateReportDashboard.tsx",
  "src/components/Resources/MaterialDocs.jsx",
  "src/components/AccessibilityHub/KeyboardShortcutsOverlay.tsx"
];
test('secondary demo findings stay retired',()=>{
 const baseline=JSON.parse(fs.readFileSync('scripts/ungated-fabrication-baseline.json','utf8'));
 for(const file of RETIRED){assert.ok(!baseline.includes(file),file);assert.match(fs.readFileSync(file,'utf8'),/DemoSurfaceGate/);}
 assert.equal(fs.existsSync('src/components/Resources/Resources_Fixed.jsx'),false);
 const check=spawnSync(process.execPath,['scripts/check-ungated-fabrication.mjs'],{encoding:'utf8'});
 assert.equal(check.status,0,check.stdout+check.stderr);
});

test('fabrication workflow discovers all script regressions', () => {
 const workflow = fs.readFileSync('.github/workflows/fabrication-ratchet.yml', 'utf8');
 assert.match(workflow, /- "scripts\/__tests__\/\*\*"/);
 assert.match(workflow, /run: node --test scripts\/__tests__\/\*\.test\.mjs/);
});
