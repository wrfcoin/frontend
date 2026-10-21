/**
 * frontend#329 — the "fabricated fallback on failure" pattern: real fetch
 * first, then an invented value when it fails. Source gates for the six
 * sites; behaviour is covered by the sibling tests next to each module.
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = fileURLToPath(new URL('../', import.meta.url));
const read = rel => readFileSync(`${src}${rel}`, 'utf8');
const stripComments = text => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('fabricated fallbacks removed (frontend#329)', () => {
  it('MiningContext has no simulator and no random values', () => {
    const text = stripComments(read('contexts/MiningContext.jsx'));
    expect(text).not.toMatch(/startSimulatedUpdates|Math\.random\(/);
    expect(text).toMatch(/apiClient\.get\('\/mining\/node-stats'\)/);
    expect(text).toMatch(/telemetryAvailable: false/);
  });

  it('bridgeStatusService no longer invents a bridge status', () => {
    const text = stripComments(read('services/bridgeStatusService.js'));
    expect(text).not.toMatch(/generateMockStatus|uptime: 99\./);
    expect(text).toMatch(/return this\.bridgeStatus\.get\(bridgeId\) \|\| null;/);
  });

  it('bridge consumers carry no placeholder figures for a missing status', () => {
    const card = stripComments(read('components/CrossChain/RealTimeBridgeStatus.jsx'));
    const page = stripComments(read('components/CrossChain/EnhancedBridgePage.jsx'));
    // (99.5 stays: it is getUptimeColor's threshold, not a displayed value.)
    for (const literal of ['\'0.005%\'', '\'5 min\'', '\'5.0 min\'', '\'$15.00\'', '\'500 tx/h\'', '\'3.2 min\'', '\'99.0\'', '\'High\'']) {
      expect(card).not.toContain(literal);
    }
    expect(page).not.toMatch(/\|\| '5\.0 min'|\|\| '\$15\.00'|\|\| 99\.5|\|\| '500 tx\/h'|\|\| 'active'/);
  });

  it('useP2PSyncStatus reports unavailable instead of "last-known safe fallback telemetry"', () => {
    const text = stripComments(read('hooks/useP2PSyncStatus.ts'));
    expect(text).not.toMatch(/generateMockData|last-known safe fallback|healthScore: 22/);
    expect(text).toMatch(/setState\(unavailableState\(message\)\)/);
  });

  it('networkRecovery.js (fabricated /api/stats fallback, no importer) is gone', () => {
    expect(existsSync(`${src}services/networkRecovery.js`)).toBe(false);
  });

  it('IdentityDashboard shows the key-lifecycle sample only under demo surfaces', () => {
    const text = stripComments(read('components/Identity/IdentityDashboard.tsx'));
    expect(text).not.toMatch(/FALLBACK_KEY_LIFECYCLE|cached/i);
    expect(text).toMatch(/if \(FEATURES\.demoSurfaces\) \{[\s\S]*setKeyLifecycle\(SAMPLE_KEY_LIFECYCLE\)/);
    expect(text).toMatch(/setKeyLifecycle\(null\)/);
  });

  it('ContributorProfile draws the heatmap only under demo surfaces and has no dead sample stations', () => {
    const text = stripComments(read('components/Leaderboard/ContributorProfile.jsx'));
    expect(text).toMatch(/const HEATMAP_DATA = FEATURES\.demoSurfaces \? generateHeatmapData\(\) : \[\];/);
    expect(text).not.toMatch(/Nordkette|Grossglockner|Night Owl/);
  });
});
