/** @jest-environment jsdom */
/**
 * frontend#348 — the computed route set App.jsx mounts, from the real route
 * modules through the real filter, under each build-flag combination.
 */
import { readFileSync } from 'node:fs';

import { appRouteElements } from '../appRouteTree';
import { collectRoutePaths, filterPublicRouteNodes } from '../publicRouteFilter';
import { explicitPathClass } from '../../config/contractSurfacePolicy';

const BASELINE = JSON.parse(
  readFileSync('src/routes/__fixtures__/publicRouteSets.baseline.json', 'utf8'),
);

// The families the issue names for internal operator preview.
const OPERATOR_PREVIEW_FAMILIES = [
  '/wallet', '/connect-station', '/onboarding', '/miner', '/pop',
  '/governance', '/nfts', '/leaderboard', '/identity', '/earnings',
  '/settings', '/notifications', '/fleet', '/forecast',
];

const inFamily = (path, families) =>
  families.some(f => path === f || path.startsWith(`${f}/`));

function visible(fullStudio, publicReadonly, operatorPreview) {
  const tree = appRouteElements({ validatorOpsEnabled: true, networkInsightsEnabled: true, isFeatureEnabled: () => true });
  return collectRoutePaths(
    filterPublicRouteNodes(tree, fullStudio, publicReadonly, operatorPreview),
  );
}

// W18: the public build also mounts the onboarding loop (exact paths).
// Owner ruling 2026-10-08 adds the exact public leaderboard page; its siblings stay hidden (baseline).
// Website parity S4-S6 (owner ruling 2026-10-15) add four more exact public read-only pages.
// core4#3604 A4 ([post-GO]) adds the exact forecaster track record pages (c_ key only).
const PUBLIC_ONBOARDING = [
  '/onboarding', '/wallet', '/connect-station', '/earn', '/leaderboard/contributors',
  '/governance/public', '/governance/public/:proposalId', '/weather/forecast', '/contributor/:key',
  '/forecasters', '/forecasters/:profileKey', '/competitions',
  // backend#229: the exact proof card page for one station reading.
  '/proof/:commitId',
  // Owner demo 2026-11-01: the exact producers and bonded nodes page.
  '/nodes',
  // Demo item 7: the forecast check page.
  '/forecast-check',
  // Demo item 8: friend challenges (list for a signed-in wallet, public board by code).
  '/challenges', '/challenges/:code',
  // Demo item 10: free-play forecast duels (board and one duel).
  '/duels', '/duels/:id',
];

// The baseline set for a flag combination, plus the onboarding loop when the
// public build flag is on, in route-tree order.
function expectedSet(fullStudio, publicReadonly) {
  const base = BASELINE[`fullStudio=${fullStudio},publicReadonly=${publicReadonly}`];
  return BASELINE.all.filter(
    p => base.includes(p) || (publicReadonly && PUBLIC_ONBOARDING.includes(p)),
  );
}

const COMBOS = [
  [false, false],
  [false, true],
  [true, false],
  [true, true],
];

describe('route set without operator preview is main plus the public onboarding loop', () => {
  it('the full route inventory is unchanged', () => {
    const tree = appRouteElements({ validatorOpsEnabled: true, networkInsightsEnabled: true, isFeatureEnabled: () => true });
    expect(collectRoutePaths(tree)).toEqual(BASELINE.all);
  });

  it.each(COMBOS)(
    'fullStudio=%p publicReadonly=%p, preview unset/false: baseline plus onboarding when public',
    (fullStudio, publicReadonly) => {
      const expected = expectedSet(fullStudio, publicReadonly);
      expect(visible(fullStudio, publicReadonly, undefined)).toEqual(expected);
      expect(visible(fullStudio, publicReadonly, false)).toEqual(expected);
    },
  );
});

describe('every route in the real tree has an explicit policy class (frontend#440 review)', () => {
  it('no route is decided by the full-studio fallback alone', () => {
    const tree = appRouteElements({ validatorOpsEnabled: true, networkInsightsEnabled: true, isFeatureEnabled: () => true });
    const paths = collectRoutePaths(tree);
    expect(paths.length).toBeGreaterThan(100);
    expect(paths.filter(p => explicitPathClass(p) === null)).toEqual([]);
  });

  it.each([
    '/weather/home', '/globe', '/dag-explorer', '/achievements', '/streak', '/meme',
    '/impact', '/impact/:address', '/standards', '/standards/*', '/incentives',
  ])('%s is explicitly full-studio only, and still hidden in the public build', path => {
    expect(explicitPathClass(path)).toBe('full-studio-only');
    expect(visible(false, true, undefined)).not.toContain(path);
    expect(visible(true, false, undefined)).toContain(path);
  });
});

describe('operator preview (both VITE_ENABLE_FULL_STUDIO and VITE_ENABLE_OPERATOR_PREVIEW)', () => {
  it('mounts the wallet and connect-station routes', () => {
    const paths = visible(true, false, true);
    expect(paths).toEqual(expect.arrayContaining(['/wallet', '/connect-station', '/onboarding']));
  });

  it('adds exactly the operator-preview families to the full-studio set', () => {
    const fullStudio = BASELINE['fullStudio=true,publicReadonly=false'];
    const added = visible(true, false, true).filter(p => !fullStudio.includes(p));
    const expectedAdded = BASELINE.all.filter(
      p => !fullStudio.includes(p) && inFamily(p, OPERATOR_PREVIEW_FAMILIES),
    );
    expect(added).toEqual(expectedAdded);
    expect(added.every(p => inFamily(p, OPERATOR_PREVIEW_FAMILIES))).toBe(true);
  });

  it('keeps every never-public route hidden under every flag combination', () => {
    const neverPublic = BASELINE.all.filter(
      p =>
        !BASELINE['fullStudio=true,publicReadonly=true'].includes(p) &&
        !inFamily(p, OPERATOR_PREVIEW_FAMILIES),
    );
    // Sanity: the never-public set is real and contains the debug/ops families.
    expect(neverPublic).toEqual(
      expect.arrayContaining(['/validators', '/network/mempool', '/fair-launch', '/resources', '/referrals']),
    );
    for (const [fullStudio, publicReadonly] of COMBOS) {
      for (const preview of [undefined, false, true]) {
        const paths = visible(fullStudio, publicReadonly, preview);
        expect(paths.filter(p => neverPublic.includes(p))).toEqual([]);
      }
    }
  });

  it.each(COMBOS.filter(([fullStudio]) => !fullStudio))(
    'is inert without full studio (fullStudio=%p publicReadonly=%p)',
    (fullStudio, publicReadonly) => {
      expect(visible(fullStudio, publicReadonly, true)).toEqual(
        expectedSet(fullStudio, publicReadonly),
      );
    },
  );
});
