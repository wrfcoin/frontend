import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const backendRepo = resolve(globalThis.process.argv[2] || '../backend');
const revision = globalThis.process.argv[3] || 'origin/main';
const output = resolve('src/routes/__fixtures__/backend-main-mounts.json');
const sourcePath = 'server/enhanced_unified_api_optimized.ts';
const source = execFileSync('git', ['-C', backendRepo, 'show', `${revision}:${sourcePath}`], {
  encoding: 'utf8',
});
const commit = execFileSync('git', ['-C', backendRepo, 'rev-parse', revision], {
  encoding: 'utf8',
}).trim();
const mounts = [...source.matchAll(/safeMount\(\s*['"]([^'"]+)['"]/g)]
  .map(match => match[1])
  .filter((value, index, values) => values.indexOf(value) === index)
  .sort();

// Routers mounted on bare `/api` cannot be summarized as a mount prefix (that
// would admit every path), so their exact GET routes are recorded instead.
const API_ROUTERS = [
  { factory: 'createStationDetailRouter', sourcePath: 'server/routes/station-detail-routes.ts' },
  { factory: 'createStationOwnerRouter', sourcePath: 'server/routes/station-owner-routes.ts' },
];
const routes = API_ROUTERS.flatMap(({ factory, sourcePath: routerPath }) => {
  if (!new RegExp(`app\\.use\\(\\s*['"]/api['"]\\s*,\\s*${factory}\\(`).test(source)) {
    throw new Error(`${factory} is not mounted on /api in ${sourcePath} at ${commit}`);
  }
  const routerSource = execFileSync('git', ['-C', backendRepo, 'show', `${revision}:${routerPath}`], {
    encoding: 'utf8',
  });
  return [...routerSource.matchAll(/router\.get\(\s*['"]([^'"]+)['"]/g)].map(match => `/api${match[1]}`);
}).sort();

writeFileSync(
  output,
  `${JSON.stringify({ backendCommit: commit, sourcePath, mounts, routes }, null, 2)}\n`,
);
globalThis.console.log(
  `wrote ${mounts.length} backend mounts and ${routes.length} routes from ${commit}`,
);
