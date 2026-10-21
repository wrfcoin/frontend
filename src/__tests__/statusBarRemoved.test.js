/**
 * frontend#307 — StatusBar was imported by App.jsx, never rendered anywhere,
 * and populated itself with hard-coded "mock metrics" on mount through
 * StatusMetricsContext.loadMockMetrics(): a second fabricated status bar one
 * import away from the live shell (the #295 pattern). Both are gone; the one
 * rendered ticker is LiveDataTicker (frontend#295).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const src = fileURLToPath(new URL('../', import.meta.url));
const read = (rel) => readFileSync(path.join(src, rel), 'utf8');
const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (entry === 'node_modules' || entry === '__tests__') continue;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(jsx?|tsx?)$/.test(entry)) out.push(full);
  }
  return out;
};

describe('StatusBar removal (frontend#307)', () => {
  it('the component, its story and the App.jsx import are gone', () => {
    expect(existsSync(path.join(src, 'components/common/StatusBar.jsx'))).toBe(false);
    expect(existsSync(path.join(src, 'stories/auto-generated/common/StatusBar.stories.ts'))).toBe(false);
    expect(read('App.jsx')).not.toMatch(/components\/common\/StatusBar/);
  });

  it('no source file imports or renders the common StatusBar', () => {
    const offenders = walk(src).filter(file => {
      const text = readFileSync(file, 'utf8');
      return /common\/StatusBar['"]/.test(text) || /<StatusBar[\s/>]/.test(text);
    });
    expect(offenders).toEqual([]);
  });

  it('StatusMetricsContext (orphaned once StatusBar was gone) is deleted and unwrapped from the shell', () => {
    // Review of PR #320: StatusBar was its only consumer, so the provider
    // wrapped the whole app doing nothing. Removed rather than left "unwired".
    expect(existsSync(path.join(src, 'contexts/StatusMetricsContext.jsx'))).toBe(false);
    expect(read('App.jsx')).not.toMatch(/StatusMetrics/);
    const offenders = walk(src).filter(file => /StatusMetricsContext|useStatusMetrics/.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('exactly one ticker component is rendered by the shell', () => {
    const app = read('App.jsx');
    expect(app.match(/<LiveDataTicker \/>/g)).toHaveLength(1);
  });
});
