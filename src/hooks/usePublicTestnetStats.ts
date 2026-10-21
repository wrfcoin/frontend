import { useEffect, useState } from 'react';

/**
 * The three read-only GET routes the public edge admits for an anonymous
 * visitor (infra#924). Every other API path 404s for a visitor, so the public
 * landing page must read these and nothing else.
 *
 * Paths are relative and hard-coded rather than derived from
 * `services/config` (`API_BASE_URL`): the public deployment serves the app and
 * the edge from one origin, and keeping the origin out of this module means an
 * env override cannot silently point the anonymous landing page at a different
 * host. It also keeps this module free of `import.meta.env`, which throws
 * under this repo's Jest/ts-jest ESM setup.
 */
export const PUBLIC_TESTNET_ENDPOINTS = {
  status: '/api/blockchain/status',
  latestBlock: '/api/blockchain/blocks?limit=1',
  coverageZones: '/api/weather/coverage-zones',
} as const;

/** Give up rather than spin forever on a hung edge. */
const REQUEST_TIMEOUT_MS = 8000;

export type PublicTestnetStatsState = 'loading' | 'ready' | 'unavailable';

export interface PublicTestnetStats {
  state: PublicTestnetStatsState;
  /** Chain height from /api/blockchain/status, or null when unavailable. */
  blockHeight: number | null;
  /** ISO-8601 timestamp of the newest block, or null when unavailable. */
  latestBlockTime: string | null;
  /** Number of coverage zones reported by the weather API, or null. */
  coverageZoneCount: number | null;
}

const EMPTY: Omit<PublicTestnetStats, 'state'> = {
  blockHeight: null,
  latestBlockTime: null,
  coverageZoneCount: null,
};

async function getJson(path: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(path, {
    method: 'GET',
    signal,
    // No cookies, no auth header: this is the anonymous public read path.
    credentials: 'omit',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`${path} responded ${response.status}`);
  }

  return await response.json();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * A height is only shown when it is a real, finite, non-negative number.
 * `null` (which the backend emits when core4 does not answer), `undefined`,
 * numeric strings, and NaN all mean "we do not know" — never a placeholder.
 */
export function readBlockHeight(payload: unknown): number | null {
  const record = asRecord(payload);
  const height = record?.blockHeight;

  return typeof height === 'number' && Number.isFinite(height) && height >= 0
    ? height
    : null;
}

/**
 * core4 serialises block timestamps as RFC3339 strings and the backend passes
 * them through untouched, but accept epoch numbers too rather than rendering
 * an "Invalid Date" if that ever changes. Anything unparseable is treated as
 * unknown.
 */
export function readLatestBlockTime(payload: unknown): string | null {
  const record = asRecord(payload);
  const blocks = record?.blocks;

  if (!Array.isArray(blocks) || blocks.length === 0) {
    return null;
  }

  const timestamp = asRecord(blocks[0])?.timestamp;

  if (typeof timestamp === 'string') {
    const parsed = new Date(timestamp);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  if (typeof timestamp === 'number' && Number.isFinite(timestamp)) {
    // Heuristic: values below ~1e12 are seconds, above are milliseconds.
    const millis = timestamp < 1e12 ? timestamp * 1000 : timestamp;
    const parsed = new Date(millis);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  return null;
}

/** The count is the length of the returned zone list — never an estimate. */
export function readCoverageZoneCount(payload: unknown): number | null {
  const zones = asRecord(payload)?.zones;
  if (!Array.isArray(zones) || zones.length === 0) {
    // The backend answers HTTP 200 `{ zones: [] }` both for "no active
    // stations" and for a database failure (weather-routes.js coverage-zones
    // handler initialises `zones = []` and still responds 200 on a caught DB
    // error). The two cannot be told apart from the client, so an empty list
    // is treated as unavailable rather than shown as a known zero.
    return null;
  }
  return zones.length;
}

/**
 * Reads the public testnet's live numbers for an anonymous visitor.
 *
 * Each endpoint is settled independently: one failing route leaves its own
 * value `null` instead of blanking the others. The hook never substitutes a
 * placeholder or remembered value for a number it could not read — callers are
 * expected to render "unavailable" for a null.
 */
export function usePublicTestnetStats(): PublicTestnetStats {
  const [stats, setStats] = useState<PublicTestnetStats>({
    state: 'loading',
    ...EMPTY,
  });

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let active = true;

    Promise.allSettled([
      getJson(PUBLIC_TESTNET_ENDPOINTS.status, controller.signal),
      getJson(PUBLIC_TESTNET_ENDPOINTS.latestBlock, controller.signal),
      getJson(PUBLIC_TESTNET_ENDPOINTS.coverageZones, controller.signal),
    ]).then(([status, latestBlock, coverageZones]) => {
      if (!active) {
        return;
      }

      const blockHeight =
        status.status === 'fulfilled' ? readBlockHeight(status.value) : null;
      const latestBlockTime =
        latestBlock.status === 'fulfilled'
          ? readLatestBlockTime(latestBlock.value)
          : null;
      const coverageZoneCount =
        coverageZones.status === 'fulfilled'
          ? readCoverageZoneCount(coverageZones.value)
          : null;

      const nothingAvailable =
        blockHeight === null &&
        latestBlockTime === null &&
        coverageZoneCount === null;

      setStats({
        state: nothingAvailable ? 'unavailable' : 'ready',
        blockHeight,
        latestBlockTime,
        coverageZoneCount,
      });
    });

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return stats;
}

export default usePublicTestnetStats;
