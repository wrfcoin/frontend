/**
 * @jest-environment node
 */
import fs from 'node:fs';

describe('StartMenu shell launch boundary', () => {
  it('keeps search-container/SearchBar behind allowShellHiddenFeatures', () => {
    const source = fs
      .readFileSync(new URL('../StartMenu.jsx', import.meta.url), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*(?:\r?\n|$)/g, '');

    expect(source).toMatch(/allowShellHiddenFeatures\s*&&\s*\(\s*<div className="search-container" data-testid="start-menu-search-container">\s*<SearchBar/);
  });

  it('keeps the taskbar metrics strip behind allowShellHiddenFeatures', () => {
    // The strip is fed only by the 'blocks' WebSocket subscription, which is
    // itself gated on allowShellHiddenFeatures. Rendered without that feed it
    // sits at its '...' placeholder forever, which reads to a public visitor
    // as live chain data that is perpetually loading.
    const source = fs
      .readFileSync(new URL('../StartMenu.jsx', import.meta.url), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*(?:\r?\n|$)/g, '');

    expect(source).toMatch(/allowShellHiddenFeatures\s*&&\s*\(\s*<div className="taskbar-center">/);
    expect(source).toMatch(/if \(!allowShellHiddenFeatures\) \{\s*return;/);
  });
});
