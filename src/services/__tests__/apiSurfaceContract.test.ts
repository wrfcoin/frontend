/** @jest-environment node */
import { toStationAlias } from '../../utils/stationAlias';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { jest } from '@jest/globals';
import { WeatherService } from '../apiClient/weatherService';
import { resolveServiceBaseUrls } from '../apiClient/runtime';
import operations from '../__fixtures__/backend-weather-operations.json';
import manifest from '../__fixtures__/backend-mounts.json';
import baseline from '../__fixtures__/api-surface-baseline.json';

const require = createRequire(`${process.cwd()}/package.json`);
const { apiFamilies, checkSurface, checksum, mountedFamilies, generateManifest, apiOperations, checkOperations, generateOperationManifest } = require('./scripts/lib/api-surface.cjs');
function scan(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (/__tests__|__mocks__|__fixtures__|stories|mocks/.test(entry.name)) return [];
    const path = join(dir, entry.name);
    return entry.isDirectory() ? scan(path) : /\.[jt]sx?$/.test(path) && !/\.(test|spec)\./.test(path)
      ? apiFamilies(readFileSync(path, 'utf8')) : [];
  });
}
const callers: string[] = [...new Set<string>(scan(join(process.cwd(), 'src')))].sort();
(process.env.BACKEND_REPO ? it : it.skip)('reproduces the fixture from fetched backend origin/main when BACKEND_REPO is supplied', () => {
  expect(generateManifest(process.env.BACKEND_REPO)).toEqual(manifest);
});
it('checks all source API families against generated backend main and a shrinking baseline', () => {
  expect(() => checkSurface(callers, manifest, baseline)).not.toThrow();
});
it('rejects new unmounted families and stale baseline entries', () => {
  expect(() => checkSurface([...callers, 'synthetic-unmounted'], manifest, baseline)).toThrow('added=synthetic-unmounted');
  expect(() => checkSurface(callers, manifest, [...baseline, 'synthetic-stale'])).toThrow('stale=synthetic-stale');
});
it('rejects an edited fixture and a zero-caller scan', () => {
  expect(() => checkSurface(callers, { ...manifest, families: [...manifest.families, 'invented'] }, baseline)).toThrow('manifest');
  expect(() => checkSurface([], manifest, baseline)).toThrow('VOID');
  expect(manifest.backendShortSha).toBe(manifest.backendCommit.slice(0, 12));
});
it('extracts code literals/templates, ignores comments, and distinguishes versioned families', () => {
  expect(apiFamilies('// /api/comment\nconst x = `/api/identity/${id}`; fetch(`${API_BASE_URL}/fleet/status`); fetch("/api/v1/defi/staking");'))
    .toEqual(['fleet', 'identity', 'v1/defi']);
});
it('finds relative client calls, aliases and URL definitions in production config', () => {
  expect(apiFamilies('import { apiClient as client } from \'../services/apiClient\'; apiClient.get(\'/synthetic-relative/items\'); client.post(`/synthetic-alias/${id}`);'))
    .toEqual(['synthetic-alias', 'synthetic-relative']);
  expect(apiFamilies('export const API = { missing: \'/api/synthetic-config\' };'))
    .toEqual(['synthetic-config']);
  const content = readFileSync(join(process.cwd(), 'src/config/publicReadonlyApi.ts'), 'utf8');
  expect(callers).toEqual(expect.arrayContaining(apiFamilies(content)));
});
it('includes the real validator adapter fallback families in the retirement guard', () => {
  const source = readFileSync(join(process.cwd(), 'src/services/apiClient/validatorService.ts'), 'utf8');
  expect(apiFamilies(source)).toEqual(['governance', 'staking', 'validators']);
  expect(() => checkSurface(apiFamilies(source), manifest, ['staking'])).toThrow('added=validators');
});
it('tracks constructed ApiClient aliases, typed fallback arrays and direct relative calls', () => {
  const source = `import { ApiClient as Http } from './client';
    class Service { constructor() { this.weatherClient = new Http({ baseUrl: '/api' }); }
      run() { this.weatherClient.getWithFallback<Row>(['/synthetic-fallback/a', \`/v1/synthetic-version/\${id}\`]);
        this.weatherClient.postWithFallback(['/synthetic-submit'], {}); this.weatherClient.get('/synthetic-direct'); }
    }
    const client = new Http({ baseUrl: '/api' }); client.getWithFallback(['/synthetic-variable']);
    const unrelated = new OtherClient(); unrelated.getWithFallback(['/unrelated-client']);
    function otherScope() { const client = axios.create({ baseURL: '/services/other' }); client.get('/not-a-top-level-family'); }`;
  expect(apiFamilies(source)).toEqual(['synthetic-direct', 'synthetic-fallback', 'synthetic-submit', 'synthetic-variable', 'v1/synthetic-version']);
});
it('inventories concrete routes below /api without admitting every family', () => {
  const source = 'import { createRouter } from \'./routes/sample.js\'; safeMount(\'/api/wallet\', \'./routes/wallet\'); app.use(\'/api\', createRouter());';
  const families = mountedFamilies(source, () => 'router.get(\'/stations/:id\', handler);');
  expect(families).toEqual(['stations', 'wallet']);
  const payload = { backendCommit: 'a'.repeat(40), families };
  expect(() => checkSurface(['defi'], { ...payload, checksum: checksum(payload) }, [])).toThrow('added=defi');
});

it('binds initialized class properties without admitting unrelated fields from another class', () => {
  const source = `import { ApiClient as Http } from './client';
    class Service { private client = new Http({ baseUrl: '/api' });
      run() { this.client.getWithFallback<Row>(['/synthetic-field/a', '/v1/synthetic-field-version']); this.client.post('/synthetic-field-submit', {}); }
    }
    class OtherService { private client = new OtherClient(); run() { this.client.get('/unrelated-field'); } }`;
  expect(apiFamilies(source)).toEqual(['synthetic-field', 'synthetic-field-submit', 'v1/synthetic-field-version']);
  expect(() => checkSurface(apiFamilies(source), manifest, [])).toThrow('added=synthetic-field');
});

// This tranche inventories only WeatherService, with its actual default base.
// Mounted source operations do not imply public-edge or deployed availability.
type Operation = { method: string; path: string };
const weatherSource = readFileSync(join(process.cwd(), 'src/services/apiClient/weatherService.ts'), 'utf8');
const weatherBase = resolveServiceBaseUrls({});
const weatherCallers: Operation[] = apiOperations(weatherSource, { 'baseUrls.weather': weatherBase.weather });
it('contracts all five retained WeatherService methods against pinned mounted operations', () => {
  expect(weatherBase.weather).toBe('/api');
  expect(weatherCallers).toEqual([
    { method: 'GET', path: '/api/weather/stations' },
    { method: 'GET', path: '/api/stations/:parameter/observations?limit=1' },
    { method: 'GET', path: '/api/stations/:parameter/quality' },
    { method: 'GET', path: '/api/stations/:parameter/ownership' },
    { method: 'GET', path: '/api/stations/:parameter/submissions' },
  ]);
  expect(() => checkOperations(weatherCallers, operations, manifest.backendCommit)).not.toThrow();
});
it('rejects nonexistent subpaths and wrong verbs inside already-mounted families', () => {
  for (const caller of [
    { method: 'GET', path: '/api/weather/stations/no-such-operation' },
    { method: 'GET', path: '/api/stations/synthetic-alias/quality/no-such-operation' },
    { method: 'POST', path: '/api/weather/health' },
    { method: 'POST', path: '/api/stations/synthetic-alias/quality' },
  ]) {
    expect(() => checkOperations([caller], operations, manifest.backendCommit)).toThrow('Unmounted operation');
  }
});
it('refuses zero callers, edited fixtures and stale operation pins even with a valid checksum', () => {
  expect(() => checkOperations([], operations, manifest.backendCommit)).toThrow('VOID');
  expect(() => checkOperations(weatherCallers, { ...operations, operations: [] }, manifest.backendCommit)).toThrow('manifest');
  const { checksum: _recorded, ...payload } = operations;
  const stale = { ...payload, backendCommit: 'a'.repeat(40) };
  expect(() => checkOperations(weatherCallers, { ...stale, checksum: checksum(stale) }, manifest.backendCommit)).toThrow('Stale');
});
it('binds nested computed literal bases and constructed aliases without leaking class receivers', () => {
  const source = `import { ApiClient as Http } from './client';
    const ROOT = '/api'; const settings = { nested: { weather: \`\${ROOT}\` } };
    class Service { private client = new Http({ baseUrl: settings.nested.weather });
      run() { this.client.get(\`/stations/\${encodeURIComponent(id)}/quality\`); } }
    class Other { private client = new OtherClient(); run() { this.client.get('/unrelated'); } }`;
  const found = apiOperations(source);
  expect(found).toEqual([{ method: 'GET', path: '/api/stations/:parameter/quality' }]);
  expect(() => checkOperations(found, operations, manifest.backendCommit)).not.toThrow();
});
it('refuses unsupported dynamic bases, partial parameters and ambiguous client bindings', () => {
  const prefix = 'import { ApiClient as Http } from \'./client\'; ';
  expect(() => apiOperations(prefix + 'const client = new Http({ baseUrl: process.env.BASE }); client.get(\'/weather/stations\');')).toThrow('Unsupported');
  expect(() => apiOperations(prefix + 'const client = new Http({ baseUrl: \'/api\' }); client.get(`/stations/prefix${encodeURIComponent(id)}/quality`);')).toThrow('partial');
  expect(() => apiOperations(prefix + 'const client = new Http({ baseUrl: \'/api\' }); client.get(\'/weather/stations\'); function other(){ const client = new OtherClient(); client.get(\'/unrelated\'); }')).toThrow('shadowed');
});
it('matches real WeatherService and ApiClient HTTP requests to the same operation contract', async () => {
  const requests: Operation[] = [];
  const previousFetch = globalThis.fetch;
  globalThis.fetch = jest.fn<typeof fetch>(async (input, init) => {
    const path = String(input);
    requests.push({ method: init?.method ?? 'GET', path });
    const response = path.includes('/quality') ? { overall: 0, dimensions: [] } :
      path.includes('/observations') ? { observations: [] } :
        path.includes('/submissions') ? { submissions: [] } :
          path.includes('/ownership') ? { stationAlias: 'st_000000000000', owner: null, ownerNonce: 0, frozen: null, ownerDeactivated: false, rewardsSuspended: false, pendingRecovery: null, observedAtHeight: 1, settledHeight: 1 } : { stations: [] };
    return new Response(JSON.stringify(response), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  try {
    const service = new WeatherService(weatherBase);
    await service.getStations();
    await service.getLatestObservations('synthetic/alias');
    await service.getStationQuality('synthetic/alias');
    await service.getStationOwnership('synthetic/alias');
    await service.getSubmissionLog('synthetic/alias');
    const aliasPath = `/api/stations/${toStationAlias('synthetic/alias')}/ownership`;
    expect(requests).toEqual(weatherCallers.map(row => ({
      ...row,
      path: row.path.endsWith('/ownership') ? aliasPath : row.path.replace(':parameter', 'synthetic%2Falias'),
    })));
    expect(aliasPath).toMatch(/^\/api\/stations\/st_[0-9a-f]{12}\/ownership$/);
    expect(() => checkOperations(requests, operations, manifest.backendCommit)).not.toThrow();
  } finally { globalThis.fetch = previousFetch; }
});
(process.env.BACKEND_REPO ? it : it.skip)('reproduces the operation fixture from the same fetched canonical backend pin', () => {
  expect(generateOperationManifest(process.env.BACKEND_REPO)).toEqual(operations);
});

// External block-explorer links are hrefs, not API calls. Only templates built
// on the explorer base constant and addressed to /tx/ or /address/ are exempt.
it('does not count explorer href templates, but still counts real tx/address API calls', () => {
  expect(apiFamilies('const a = `${EXPLORER_BASE_URL}/tx/${hash}`; const b = `${EXPLORER_BASE_URL}/address/${who}`; const c = `${explorerBaseUrl}/tx/${hash}`;')).toEqual([]);
  expect(apiFamilies('fetch(\'/api/tx/abc\');')).toEqual(['tx']);
  expect(apiFamilies('fetch(`${API_BASE_URL}/tx/${hash}`);')).toEqual(['tx']);
  expect(apiFamilies('fetch(`${BASE_URL}/address/${who}`);')).toEqual(['address']);
  expect(apiFamilies('import { apiClient } from \'../services/apiClient\'; apiClient.get(\'/address/abc\'); apiClient.get(`/tx/${h}`);')).toEqual(['address', 'tx']);
  // The exemption is narrow: same constant, other path, is still an API shape.
  expect(apiFamilies('fetch(`${EXPLORER_BASE_URL}/stations/${id}`);')).toEqual(['stations']);
  expect(apiFamilies('fetch(`${someApiBase}/tx/${hash}`);')).toEqual(['tx']);
});
it('treats a scan whose only hits were exempt explorer links as zero callers', () => {
  const onlyExplorer = apiFamilies('const a = `${EXPLORER_BASE_URL}/tx/${hash}`;');
  expect(() => checkSurface(onlyExplorer, manifest, [])).toThrow('VOID');
});
it('keeps the real explorer link helpers out of the baseline', () => {
  for (const file of ['src/config/network.ts', 'src/components/Dashboard/RecentTransactions.jsx']) {
    expect(apiFamilies(readFileSync(join(process.cwd(), file), 'utf8'))).toEqual([]);
  }
  expect(baseline).not.toContain('tx');
  expect(baseline).not.toContain('address');
});
