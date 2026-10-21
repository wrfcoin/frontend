/**
 * frontend#306 — /tabs/* rendered a "Multi-Tab Interface" whose seven tabs all
 * resolved to a placeholder-component div ("This is a functional
 * demonstration of the …") with a fake URL; none of the seven target
 * components existed. Scaffolding presented as pages. It is removed, not
 * labelled.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const src = fileURLToPath(new URL('../', import.meta.url));
const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (entry === 'node_modules' || entry === '__tests__') continue;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(jsx?|tsx?)$/.test(entry)) out.push(full);
  }
  return out;
};

describe('tabs scaffolding removal (frontend#306)', () => {
  it('the Tabs components, TabContext and their stories are gone', () => {
    for (const rel of ['components/Tabs', 'contexts/TabContext.jsx', 'contexts/TabContext', 'stories/auto-generated/Tabs']) {
      expect(existsSync(path.join(src, rel))).toBe(false);
    }
  });

  it('no route, nav item or import references /tabs or the placeholder component', () => {
    const offenders = walk(src).filter(file => {
      const text = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
      return /components\/Tabs\/|TabContext|placeholder-component|path: '\/tabs'|path="\/tabs/.test(text);
    });
    expect(offenders).toEqual([]);
  });
});
