/**
 * frontend#336 — `import.meta?.env?.VITE_X` always reads undefined under
 * Vite: both the dev-server env injection and the production `define`
 * replacement key on the literal text `import.meta.env`, which the optional
 * chain on `meta` breaks. `import.meta.env?.VITE_X` keeps the literal (so Vite
 * substitutes it) while still tolerating Jest, where `import.meta.env` is
 * undefined. Every FULL_STUDIO route/nav gate was silently stuck off.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = fileURLToPath(new URL('../', import.meta.url));
const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = `${dir}/${entry}`;
    if (entry === 'node_modules' || entry === '__tests__') continue;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(jsx?|tsx?)$/.test(entry)) out.push(full);
  }
  return out;
};

describe('import.meta.env access (frontend#336)', () => {
  it('no source file optional-chains on import.meta itself', () => {
    const offenders = walk(src.replace(/\/$/, '')).filter(file =>
      /import\.meta\?\./.test(readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')),
    );
    expect(offenders).toEqual([]);
  });
});
