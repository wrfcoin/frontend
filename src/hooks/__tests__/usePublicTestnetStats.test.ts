/** @jest-environment jsdom */
import { readFileSync } from 'node:fs';
import {
  PUBLIC_TESTNET_ENDPOINTS,
  readBlockHeight,
  readCoverageZoneCount,
  readLatestBlockTime,
} from '../usePublicTestnetStats';

describe('usePublicTestnetStats endpoint policy', () => {
  it('targets exactly the three routes the public edge admits (infra#924)', () => {
    expect(Object.values(PUBLIC_TESTNET_ENDPOINTS)).toEqual([
      '/api/blockchain/status',
      '/api/blockchain/blocks?limit=1',
      '/api/weather/coverage-zones',
    ]);
  });

  it('keeps the request origin same-origin and env-independent', () => {
    // Comments are stripped first: the module documents why it avoids
    // `import.meta.env` / `API_BASE_URL`, and naming them in prose is not use.
    const source = readFileSync(
      new URL('../usePublicTestnetStats.ts', import.meta.url),
      'utf8',
    )
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*(?:\r?\n|$)/g, '');
    expect(source).not.toMatch(/import\.meta\.env|API_BASE_URL|https?:\/\//);
    for (const path of Object.values(PUBLIC_TESTNET_ENDPOINTS)) {
      expect(path.startsWith('/api/')).toBe(true);
    }
  });
});

describe('readBlockHeight', () => {
  it('reads the backend field name, not the one the type used to claim', () => {
    // server/routes/blockchain-routes.js emits `blockHeight`; `height` was the
    // bug frontend#282 fixed elsewhere.
    expect(readBlockHeight({ blockHeight: 41 })).toBe(41);
    expect(readBlockHeight({ height: 41 })).toBeNull();
  });

  it.each([
    [{ blockHeight: null }],
    [{ blockHeight: '41' }],
    [{ blockHeight: Number.NaN }],
    [{ blockHeight: -1 }],
    [{}],
    [null],
    ['not json'],
  ])('returns null rather than a placeholder for %p', payload => {
    expect(readBlockHeight(payload)).toBeNull();
  });

  it('keeps a genesis height of zero', () => {
    expect(readBlockHeight({ blockHeight: 0 })).toBe(0);
  });
});

describe('readLatestBlockTime', () => {
  it('parses the RFC3339 string core4 serialises', () => {
    expect(readLatestBlockTime({ blocks: [{ timestamp: '2026-09-09T04:05:06Z' }] })).toBe(
      '2026-09-09T04:05:06.000Z',
    );
  });

  it('accepts epoch seconds and milliseconds if the shape ever changes', () => {
    expect(readLatestBlockTime({ blocks: [{ timestamp: 1_767_225_906 }] })).toBe(
      new Date(1_767_225_906_000).toISOString(),
    );
    expect(readLatestBlockTime({ blocks: [{ timestamp: 1_767_225_906_000 }] })).toBe(
      new Date(1_767_225_906_000).toISOString(),
    );
  });

  it.each([
    [{ blocks: [] }],
    [{ blocks: [{ timestamp: 'not a date' }] }],
    [{ blocks: [{}] }],
    [{ blocks: 'nope' }],
    [{}],
  ])('returns null instead of an Invalid Date for %p', payload => {
    expect(readLatestBlockTime(payload)).toBeNull();
  });
});

describe('readCoverageZoneCount', () => {
  it('counts the zones actually returned', () => {
    expect(readCoverageZoneCount({ zones: [{}, {}, {}] })).toBe(3);
    expect(readCoverageZoneCount({ zones: [{}] })).toBe(1);
  });

  it('treats the 200 `{ zones: [] }` failure-shaped response as unavailable, never a known zero', () => {
    // weather-routes.js sends 200 `{ zones: [] }` on a caught database error,
    // indistinguishable from a genuinely empty network.
    expect(readCoverageZoneCount({ zones: [] })).toBeNull();
  });

  it.each([[{ zones: null }], [{ zones: 7 }], [{}], [null]])(
    'returns null for %p',
    payload => {
      expect(readCoverageZoneCount(payload)).toBeNull();
    },
  );
});
