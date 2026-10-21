// Vite config for the visual-QA harness: the repo's own config plus a fixed port,
// no `/api` dev proxy (the harness stubs every backend call itself; the proxy
// would also swallow the SPA route /api-terms) and an fs allow list that covers
// a symlinked node_modules (worktrees often share one install).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = Number(process.env.VISUAL_QA_PORT || 5199);

const mod = await import(path.join(ROOT, 'vite.config.js'));
const base = typeof mod.default === 'function'
  ? await mod.default({ command: 'serve', mode: 'development' })
  : mod.default;

// Worktrees often share one install through symlinks (node_modules itself, or
// every package inside it): allow the real location of each linked package.
const allow = new Set([ROOT]);
function allowReal(dir) { try { allow.add(fs.realpathSync(dir)); } catch { /* not present */ } }
const nodeModules = path.join(ROOT, 'node_modules');
allowReal(nodeModules);
try {
  for (const entry of fs.readdirSync(nodeModules, { withFileTypes: true })) {
    if (!entry.isSymbolicLink()) continue;
    const real = fs.realpathSync(path.join(nodeModules, entry.name));
    allow.add(entry.name.startsWith('@') ? real : path.dirname(real));
  }
} catch { /* no node_modules dir */ }
for (const dir of (process.env.VISUAL_QA_FS_ALLOW || '').split(':').filter(Boolean)) allowReal(dir);

export default {
  ...base,
  server: {
    ...(base.server || {}),
    host: '127.0.0.1',
    port: PORT,
    strictPort: true,
    hmr: { port: PORT },
    proxy: {},
    fs: { allow: [...allow] },
  },
};
