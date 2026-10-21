/** @jest-environment node */
import { readFileSync } from 'node:fs';

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*(?:\r?\n|$)/g, '')
    .trim();
}

describe('NotFound launch leak surface', () => {
  it('keeps root links to only launch-allowed surfaces', () => {
    const source = stripComments(readFileSync(new URL('../NotFound.jsx', import.meta.url), 'utf8'));
    const links = [...source.matchAll(/to="(\/[^"]*)"/g)].map(([, value]) => value);
    const allowed = new Set(['/', '/security', '/terms', '/privacy', '/api-terms']);
    const extras = links.filter(href => href.startsWith('/') && !allowed.has(href));

    expect(extras).toHaveLength(0);
    expect(links).toEqual(expect.arrayContaining(['/', '/terms', '/privacy', '/api-terms', '/security']));
  });
});
