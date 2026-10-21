/**
 * @jest-environment node
 *
 * frontend#298 — parent nav items with chevrons were inconsistently
 * interactive and their direct URLs undiscoverable. Every top-level item now
 * goes through one activation path (click and keyboard), exposes
 * aria-expanded/aria-haspopup, and every parent `path` resolves to a real
 * route so a typed or bookmarked URL always lands somewhere.
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = rel => fs.readFileSync(new URL(rel, import.meta.url), 'utf8');
const stripComments = src => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*(?:\r?\n|$)/g, '');

describe('StartMenu parent items (frontend#298)', () => {
  const source = stripComments(read('../StartMenu.jsx'));

  it('routes click and keyboard through one activation handler with ARIA state', () => {
    expect(source).toMatch(/const activateMenuItem = \(event, item\) => \{/);
    expect(source).toMatch(/onClick=\{event => activateMenuItem\(event, item\)\}/);
    expect(source).toMatch(/onKeyDown=\{event => \{\s*if \(event\.key === 'Enter' \|\| event\.key === ' '\) \{\s*activateMenuItem\(event, item\);/);
    expect(source).toMatch(/aria-expanded=\{item\.submenu \? activeSubmenu === item\.name : undefined\}/);
    expect(source).toMatch(/aria-haspopup=\{item\.submenu \? 'true' : undefined\}/);
  });

  it('no menu entry links to a hard-coded sample entity', () => {
    // "My Stations" used to link to /weather/station/station-001 — a
    // fabricated station id that no visitor owns.
    expect(source).not.toMatch(/station-0\d\d/);
  });

  it('every menu path (parent and leaf) has a matching route, so direct URLs work', () => {
    const menuPaths = [...source.matchAll(/path: '(\/[^']*)'/g)].map(m => m[1]);
    expect(menuPaths.length).toBeGreaterThan(10);

    const routesDir = fileURLToPath(new URL('../../../routes/', import.meta.url));
    const routeSources = fs
      .readdirSync(routesDir)
      .filter(f => f.endsWith('.jsx'))
      .map(f => fs.readFileSync(`${routesDir}${f}`, 'utf8'))
      .concat(read('../../../App.jsx'));
    const routePaths = new Set(
      routeSources.flatMap(text => [...text.matchAll(/path="([^"]+)"/g)].map(m => m[1])),
    );
    // A splat route "/x/*" serves "/x" and everything below it.
    const hasRoute = p =>
      routePaths.has(p) ||
      [...routePaths].some(r => r.endsWith('/*') && (p === r.slice(0, -2) || p.startsWith(r.slice(0, -1))));

    const missing = menuPaths.filter(p => !hasRoute(p));
    expect(missing).toEqual([]);
  });
});
