/**
 * Contract-backed UI is opt-in while its launch gates remain incomplete.
 *
 * Keep this parser deliberately strict. Vite exposes environment values as
 * strings, and only the exact value `true` may expose these surfaces. In
 * particular, do not trim or case-fold the input: operational typos must land
 * on the safe (hidden) side of the boundary.
 */
export function isContractSurfacesEnabled(value: unknown): boolean {
  return value === 'true';
}

/**
 * Full-studio UI is intentionally fail-closed and explicitly opt-in.
 *
 * The parser is deliberately strict like contract surfaces: only the exact string
 * `true` enables deferred families. Unset, malformed, empty, whitespace, and
 * case variants remain safe by default.
 */
export function isFullStudioEnabled(value: unknown): boolean {
  return value === 'true';
}

/** Stage 1.5 public reads are opt-in and accept only the literal string. */
export function isPublicReadonlyEnabled(value: unknown): boolean {
  return value === 'true';
}

/**
 * Internal/staging operator preview (frontend#348). Only the exact string
 * `true` enables it, and it only takes effect together with full studio. The
 * public release build must never set it: infra passes it for staging builds
 * only and asserts it empty for the public image.
 */
export function isOperatorPreviewEnabled(value: unknown): boolean {
  return value === 'true';
}

/** Owner ruling 2026-10-15: Send in the public wallet as well as operator preview.
 * The page additionally requires the explicitly unlocked identity and its vault.
 */
export function isWalletSendEnabled(
  fullStudioValue: unknown,
  operatorPreviewValue: unknown,
  publicReadonlyValue?: unknown,
  sendKillSwitchValue?: unknown,
): boolean {
  // Dedicated kill switch (VITE_DISABLE_WALLET_SEND): the exact string "true" turns Send
  // off everywhere. Send stays ON by default; the read-only surfaces and Receive are unaffected.
  if (sendKillSwitchValue === 'true') return false;
  return isPublicReadonlyEnabled(publicReadonlyValue)
    || (isFullStudioEnabled(fullStudioValue) && isOperatorPreviewEnabled(operatorPreviewValue));
}

/**
 * Minimal public-testnet core routes that may remain visible without full-studio
 * opt-in. This list is intentionally tiny and policy-only: everything not in the
 * allowlist must fail closed unless full-studio is explicitly enabled.
 */
const PUBLIC_TESTNET_CORE_PATHS = new Set([
  '/',
  '/terms',
  '/privacy',
  '/api-terms',
  '/security',
  // frontend#574: what to install and how to verify it; reads only the static
  // /downloads/manifest.json on this origin, never /api.
  '/downloads',
]);

// Exact route patterns, never prefixes: a concrete path such as
// `/weather/station/../earnings` or `/weather/stationX` is not in the set.
export const PUBLIC_READONLY_PATHS = new Set([
  '/explore',
  '/explorer',
  '/map',
  '/search',
  // Station detail (frontend#349): read-only, pattern from weatherRoutes.jsx.
  '/weather/station/:stationId',
  // Owner ruling 2026-10-08: invitees get a public leaderboard before GO. Exactly this page, which reads
  // GET /api/weather/leaderboard in the one shape the public edge admits (metric, period, limit<=30,
  // no geo). `/leaderboard` and every subpath stay operator-preview, so this entry never widens by prefix.
  '/leaderboard/contributors',
  // Website parity S4-S6 (owner ruling 2026-10-15). Exact entries, never prefixes: `/governance`,
  // `/forecast`, `/impact` and `/leaderboard` descendants stay operator-preview / full-studio only.
  //   /governance/public[/:proposalId] reads GET /api/governance/proposals, /proposals/<id>, /treasury
  //   /weather/forecast                reads GET /api/weather/current|forecast/<lat,lon at 0.1 degree>
  //   /contributor/:key                reads GET /api/operators/c_<24 hex>/profile (opaque key only)
  '/governance/public',
  '/governance/public/:proposalId',
  '/weather/forecast',
  '/contributor/:key',
  // Phase A item A4 of wrfcoin/core4#3604 ([post-GO], owner 2026-10-19): the public forecaster track record.
  //   /forecasters                 reads GET /api/forecasters?period=7d|30d|all&limit=25
  //   /forecasters/:profileKey     reads GET /api/forecasters/<c_ key> (never a raw address)
  // Exact entries: no other /forecasters descendant is admitted.
  '/forecasters',
  '/forecasters/:profileKey',
  // Self-serve bond grant spec section 4: the read-only faucet bond-grant audit list
  // (GET /api/faucet/bond-grants). Exact entry: no other /faucet path is admitted.
  '/faucet/bond-grants',
]);

// Owner ruling 2026-10-02 FULL WEB JOIN PATH, frontend#437: admit the exact
// onboarding and own-address wallet pages. Descendants remain independently
// gated.
// W28 (same ruling): the exact /connect-station and /earn (both ConnectStationPage) join a station with that
// same signed-in wallet; they never create a second one in the public build. Subpaths stay hidden through
// OPERATOR_PREVIEW_PATH_PREFIXES (/connect-station) and FULL_STUDIO_ONLY_PATH_PREFIXES (/earn).
export const PUBLIC_ONBOARDING_PATHS = new Set(['/onboarding', '/wallet', '/connect-station', '/earn']);

// Routes in no other list that the public build must not reach. Listing them
// makes the hiding explicit: they open with full studio only, never because a
// read-only or onboarding set grew by prefix.
export const FULL_STUDIO_ONLY_PATH_PREFIXES = new Set([
  '/earn',
  '/weather/onboarding',
  '/weather/dashboard',
  '/dashboard',
  // frontend#440 review: the routes formerly hidden only by the final
  // full-studio fallback, now named (prefixes cover /impact/:address and
  // /standards/*).
  '/weather/home',
  '/globe',
  '/dag-explorer',
  '/achievements',
  '/streak',
  '/meme',
  '/impact',
  '/standards',
  '/incentives',
]);

// Hidden even with full studio on. Prefix matching applies to descendants to
// prevent wildcard bypass. Families here are never reachable from any build.
const NEVER_PUBLIC_PATH_PREFIXES = new Set([
  '/resources',
  '/defi',
  '/bridge',
  '/smart-contracts',
  '/integrations',
  '/referrals',
  '/community',
  '/gamification',
  '/messaging',
  '/analytics',
  '/oracle',
  '/validators',
  '/network',
  '/zk',
  '/debug',
  '/mcp',
  '/sharding',
  '/system',
  '/systems',
  '/fair-launch',
  '/data/upload',
  '/climate/reports',
  '/quality',
  '/realtime',
  '/alerts',
  '/resilience',
  '/accessibility',
  '/language',
  '/exports',
  '/weather/forecast-coverage',
]);

// Hidden with full studio alone; reachable only when full studio AND operator
// preview are both exactly `true` (internal/staging builds, frontend#348).
export const OPERATOR_PREVIEW_PATH_PREFIXES = new Set([
  '/wallet',
  '/connect-station',
  '/onboarding',
  '/miner',
  '/pop',
  '/governance',
  '/nfts',
  '/leaderboard',
  '/identity',
  '/earnings',
  '/settings',
  '/notifications',
  '/fleet',
  '/forecast',
]);

function matchesPathPrefix(path: string, prefixes: ReadonlySet<string>): boolean {
  const normalizedPath = normalizePath(path);
  return Array.from(prefixes).some(prefix => {
    const normalizedPrefix = normalizePath(prefix);
    return (
      normalizedPath === normalizedPrefix ||
      normalizedPath.startsWith(`${normalizedPrefix}/`)
    );
  });
}

function normalizePath(path: string): string {
  if (!path) {
    return '';
  }

  if (path === '/') {
    return '/';
  }

  return path.replace(/\/+$/, '');
}

/**
 * The explicit policy class of a route path, or null when only the final
 * full-studio fallback would decide it (frontend#440 review: no route may be
 * classified by the fallback alone).
 */
export function explicitPathClass(
  path: string,
): 'catch-all' | 'core' | 'public-readonly' | 'public-onboarding' | 'never-public' | 'operator-preview' | 'full-studio-only' | null {
  const normalized = normalizePath(path);
  if (path === '*' || normalized === '*') return 'catch-all';
  if (PUBLIC_TESTNET_CORE_PATHS.has(normalized)) return 'core';
  if (PUBLIC_READONLY_PATHS.has(normalized)) return 'public-readonly';
  if (PUBLIC_ONBOARDING_PATHS.has(normalized)) return 'public-onboarding';
  if (matchesPathPrefix(normalized, NEVER_PUBLIC_PATH_PREFIXES)) return 'never-public';
  if (matchesPathPrefix(normalized, OPERATOR_PREVIEW_PATH_PREFIXES)) return 'operator-preview';
  if (matchesPathPrefix(normalized, FULL_STUDIO_ONLY_PATH_PREFIXES)) return 'full-studio-only';
  return null;
}

/**
 * Explicit public-testnet path allowlist used by all navigational owners.
 *
 * Full-studio is a single explicit opt-in. Omitted/malformed values do not
 * expand the policy. Operator preview widens it further only on top of full
 * studio, and never reaches the never-public families.
 */
export function isPublicTestnetPath(
  path: string,
  isFullStudioEnabled: boolean,
  isPublicReadonlyEnabled = false,
  isOperatorPreviewEnabled = false,
): boolean {
  const normalized = normalizePath(path);

  if (path === '*' || normalized === '*') {
    return true;
  }

  if (PUBLIC_TESTNET_CORE_PATHS.has(normalized)) {
    return true;
  }

  if (isPublicReadonlyEnabled && PUBLIC_READONLY_PATHS.has(normalized)) {
    return true;
  }

  if (isPublicReadonlyEnabled && PUBLIC_ONBOARDING_PATHS.has(normalized)) {
    return true;
  }

  if (matchesPathPrefix(normalized, NEVER_PUBLIC_PATH_PREFIXES)) {
    return false;
  }

  if (matchesPathPrefix(normalized, OPERATOR_PREVIEW_PATH_PREFIXES)) {
    return isFullStudioEnabled && isOperatorPreviewEnabled;
  }

  if (matchesPathPrefix(normalized, FULL_STUDIO_ONLY_PATH_PREFIXES)) {
    return isFullStudioEnabled;
  }

  if (isFullStudioEnabled) {
    return true;
  }

  return false;
}

type NavigationItem = { path: string };

type NestedNavigationItem<T> = T & {
  submenu?: T[];
  children?: T[];
};

export function filterPublicNavigation<T extends NavigationItem>(
  items: readonly T[],
  fullStudioEnabled: boolean,
  operatorPreviewEnabled = false,
): T[] {
  return items
    .filter(item =>
      isPublicTestnetPath(item.path, fullStudioEnabled, false, operatorPreviewEnabled),
    )
    .map(item => {
      const nestedItem = item as NestedNavigationItem<T>;
      const filtered = { ...item } as NestedNavigationItem<T>;

      if (nestedItem.submenu) {
        filtered.submenu = filterPublicNavigation(
          nestedItem.submenu,
          fullStudioEnabled,
          operatorPreviewEnabled,
        );
      }
      if (nestedItem.children) {
        filtered.children = filterPublicNavigation(
          nestedItem.children,
          fullStudioEnabled,
          operatorPreviewEnabled,
        );
      }

      return filtered as T;
    });
}

export function filterPublicRouteNavigation<T extends NavigationItem>(
  items: readonly T[],
  fullStudioEnabled: boolean,
  operatorPreviewEnabled = false,
): T[] {
  return filterPublicNavigation(items, fullStudioEnabled, operatorPreviewEnabled);
}

export function filterPublicSurfaces<T extends NavigationItem>(
  items: readonly T[],
  fullStudioEnabled: boolean,
  operatorPreviewEnabled = false,
): T[] {
  return filterPublicNavigation(items, fullStudioEnabled, operatorPreviewEnabled);
}

const CONTRACT_SURFACE_PATH_PREFIXES = [
  '/bridge',
  '/carbon',
  '/defi',
  '/smart-contract',
  '/staking',
  // MobileApp uses local navigation paths rather than browser routes.
  '/trading',
] as const;

export function isContractSurfacePath(path: string): boolean {
  return CONTRACT_SURFACE_PATH_PREFIXES.some(
    prefix => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/**
 * Recursively removes contract-surface links from navigation structures.
 * Feature-specific filtering still runs at the component level; this is the
 * common containment boundary that keeps direct and indirect navigation in
 * agreement.
 */
export function filterContractSurfaceNavigation<T extends NavigationItem>(
  items: readonly T[],
  enabled: boolean,
): T[] {
  return items
    .filter(item => enabled || !isContractSurfacePath(item.path))
    .map(item => {
      const nestedItem = item as NestedNavigationItem<T>;
      const filtered = { ...item } as NestedNavigationItem<T>;

      if (nestedItem.submenu) {
        filtered.submenu = filterContractSurfaceNavigation(
          nestedItem.submenu,
          enabled,
        );
      }
      if (nestedItem.children) {
        filtered.children = filterContractSurfaceNavigation(
          nestedItem.children,
          enabled,
        );
      }

      return filtered as T;
    });
}
