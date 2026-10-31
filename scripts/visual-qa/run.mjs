#!/usr/bin/env node
// Visual QA of the public website: every public route at 1440 and 390 (normal
// and tall viewport), plus the interactive states (forecast filled, banner
// dismissed, downloads with the shipped manifest, wallet unlocked after the real
// web-wallet setup, Send reviewed), against a local Vite build of THIS checkout
// with the backend replaced by fixtures. Never the live site.
//
//   npm run qa:visual                       # starts Vite on 127.0.0.1:5199, captures, stops it
//   npm run qa:visual -- --out ./some/dir   # output directory (default visual-qa-output/<timestamp>)
//   npm run qa:visual -- --base http://127.0.0.1:5173   # use a server you started yourself
//   npm run qa:visual -- --only home,map,wallet-unlocked --viewport phone-390
//   npm run qa:visual -- --theme light          # one theme (default both: dark, then light as *-light.png)
//
// Output: PNGs, report.json (per capture: title, h1, error boundary, banner/chip,
// horizontal overflow, page errors), index.html (contact sheet). Exit code 1 when
// any capture shows an error boundary, a page error, horizontal overflow or the
// loading splash.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { ROUTES, SCENARIOS, VIEWPORTS } from './plan.mjs';
import { buildFixtures, installRoutes } from './fixtures.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); return i === -1 ? fallback : args[i + 1]; };
const PORT = Number(process.env.VISUAL_QA_PORT || 5199);
const base = (opt('--base', '') || `http://127.0.0.1:${PORT}`).replace(/\/$/, '');
const startServer = !opt('--base', '');
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const outDir = path.resolve(ROOT, opt('--out', path.join('visual-qa-output', stamp)));
const only = (opt('--only', '') || '').split(',').filter(Boolean);
const viewportFilter = (opt('--viewport', '') || '').split(',').filter(Boolean);
const tallToo = !args.includes('--no-tall');
const auditA11y = args.includes('--axe');
// The site defaults to dark and ignores prefers-color-scheme; the taskbar toggle stores the choice
// under this key, so a theme is selected the way a returning visitor's browser would select it.
const THEME_STORAGE_KEY = 'wrfcoin-theme-mode';
const themeArg = opt('--theme', 'both');
if (!['dark', 'light', 'both'].includes(themeArg)) throw new Error(`--theme must be dark, light or both, not ${themeArg}`);
const themes = themeArg === 'both' ? ['dark', 'light'] : [themeArg];
const axeRules = opt('--axe-rules', '').split(',').filter(Boolean);
if (auditA11y && !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname)) throw new Error('Accessibility audit requires a loopback server');
const want = name => only.length === 0 || only.includes(name);

fs.mkdirSync(outDir, { recursive: true });
const origin = new URL(base).origin;
const host = new URL(base).host;

// ---- dev server ------------------------------------------------------------
async function waitForServer(url, ms = 120_000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try { const r = await fetch(url); if (r.ok) return; } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`dev server did not answer at ${url} within ${ms / 1000}s`);
}
let stopping = false;
async function portAnswers(url) {
  try { await fetch(url); return true; } catch { return false; }
}
function startVite() {
  const log = fs.createWriteStream(path.join(outDir, 'vite.log'));
  // Run Vite's own entry point (not through npx) so killing the child stops the server itself.
  const viteBin = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
  const child = spawn(process.execPath, [viteBin, '--config', 'scripts/visual-qa/vite.config.mjs'], {
    cwd: ROOT,
    env: {
      ...process.env,
      VISUAL_QA_PORT: String(PORT),
      VITE_PUBLIC_READONLY_PATHS: 'true',
      VITE_WRFCOIN_CHAIN_ID: process.env.VITE_WRFCOIN_CHAIN_ID || '777',
      VITE_WRFCOIN_NETWORK_ID: process.env.VITE_WRFCOIN_NETWORK_ID || 'testnet',
      // The wallet refuses to sign a login challenge unless the auth origin is configured; the
      // harness's own origin is the one the stubbed challenge carries.
      VITE_WALLET_AUTH_ORIGIN: process.env.VITE_WALLET_AUTH_ORIGIN || origin,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.pipe(log); child.stderr.pipe(log);
  // A server that dies (port taken, build error) must end the run, never let it
  // capture whatever else answers on that port.
  child.on('exit', (code, signal) => {
    if (stopping) return;
    console.error(`visual-qa: the dev server exited (${signal || `code ${code}`}) before the run finished; see ${path.join(outDir, 'vite.log')}`);
    process.exit(2);
  });
  return child;
}

// ---- browser helpers -------------------------------------------------------
function chromeExecutable() {
  if (process.env.VISUAL_QA_CHROME) return process.env.VISUAL_QA_CHROME;
  for (const candidate of ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser']) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined; // Playwright's bundled Chromium (npx playwright install chromium)
}
const settle = page => page.waitForTimeout(2500);
async function loadRoute(page, route, errors = []) {
  // A cold Vite server may re-optimise deps and abort the first lazy import
  // ("Failed to fetch dynamically imported module", with or without an error
  // boundary), and the app shows a "Loading WRFCoin testnet" splash while chunks
  // arrive: retry, and drop the errors of an attempt that gets retried.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    errors.length = 0;
    await page.goto(`${base}${route}`, { waitUntil: 'networkidle', timeout: 90_000 }).catch(() => undefined);
    await settle(page);
    const meta = await page.evaluate(META_SCRIPT);
    const chunkBoundary = /dynamically imported module/.test(meta.boundary || '');
    const chunkError = errors.some(e => /dynamically imported module/.test(e));
    if (!chunkBoundary && !chunkError && !meta.splash && !meta.pending) return;
    await page.waitForTimeout(3000);
  }
}
// The "Loading WRFCoin testnet…" splash is CSS on an EMPTY #root (index.html:
// `#root:empty::after { content: … }`), so it never appears in innerText; look at
// the mount node and its pseudo-element instead.
const META_SCRIPT = () => {
  const root = document.getElementById('root');
  const after = root ? getComputedStyle(root, '::after').content : '';
  // Page text excludes the shell (banner, taskbar): the route's own content is what must have mounted.
  const content = document.querySelector('.page-content') || root;
  const text = (content?.innerText || '').replace(/\s+/g, ' ').trim();
  const h1 = Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()).slice(0, 2);
  return {
    title: document.title,
    h1,
    // The route-level Suspense fallback ("Loading page…") while a lazy chunk is still arriving.
    pending: !h1.length && /^Loading page/.test(text),
    boundary: /Technical details/.test(document.body.innerText) ? (document.querySelector('details')?.textContent || '').slice(0, 200) : null,
    splash: !root || root.childElementCount === 0 || /Loading WRFCoin/.test(after),
    textLength: text.length,
    banner: !!document.querySelector('[aria-label="Testnet expectations"]'),
    chip: !!document.querySelector('[data-testid="testnet-chip"], .tn-chip'),
    theme: document.body.classList.contains('light-mode') ? 'light' : 'dark',
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  };
};
function pageMeta(page) {
  return page.evaluate(META_SCRIPT);
}
async function dismissBanner(page) {
  const btn = page.getByRole('button', { name: /^Dismiss/ });
  if (await btn.count()) { await btn.first().click(); await page.waitForTimeout(500); }
}
async function createWallet(page, errors) {
  await loadRoute(page, '/onboarding', errors);
  await page.getByRole('button', { name: 'Create New Wallet' }).click();
  await page.getByLabel('Browser password', { exact: true }).fill('qa-password-123');
  await page.getByLabel('Confirm browser password', { exact: true }).fill('qa-password-123');
  await page.getByRole('button', { name: 'Generate Recovery Words' }).click();
  const words = await page.locator('ol[aria-label="Recovery words"] li').allTextContents();
  await page.getByRole('button', { name: 'I have written down my words' }).click();
  await page.getByLabel('Verify your backup').fill(words.join(' '));
  await page.getByLabel(/stored my recovery words/).check();
  await page.getByRole('button', { name: 'Save and Connect Wallet' }).click();
  await page.waitForTimeout(3000);
}
async function goClientSide(page, pathname) {
  // Same SPA session: a full navigation would drop the in-memory signing identity.
  await page.evaluate(p => { window.history.pushState({}, '', p); window.dispatchEvent(new PopStateEvent('popstate')); }, pathname);
  await settle(page);
}

// ---- run -------------------------------------------------------------------
const report = [];
let wantTheme = 'dark';
function verdict(entry) {
  const problems = [];
  if (entry.boundary) problems.push('error boundary');
  if (entry.splash) problems.push('loading splash (empty #root)');
  // Every public page has either a heading or a few sentences; neither means nothing mounted.
  if (entry.pending) problems.push('page still loading (Suspense fallback)');
  if (!entry.splash && !entry.pending && !(entry.h1 || []).length && (entry.textLength ?? 0) < 120) problems.push('empty page (no h1, almost no text)');
  if (entry.overflowX) problems.push('horizontal overflow');
  if (entry.wantTheme && entry.theme && entry.theme !== entry.wantTheme) problems.push(`rendered ${entry.theme}, wanted ${entry.wantTheme}`);
  if (entry.pageErrors.length) problems.push(`${entry.pageErrors.length} page error(s)`);
  return problems;
}
async function capture(page, errors, name, route, suffix, extra = {}) {
  const meta = await pageMeta(page);
  const file = `${name}-${suffix}.png`;
  await page.screenshot({ path: path.join(outDir, file), fullPage: false });
  let accessibility;
  if (auditA11y) {
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    accessibility = await page.evaluate(async (rules) => {
      const result = await window.axe.run(document, rules.length ? { runOnly: { type: 'rule', values: rules } } : {});
      return { version: result.testEngine.version, violations: result.violations, incomplete: result.incomplete,
        headings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(e => ({ level: e.tagName, text: e.textContent })),
        activeElement: document.activeElement?.outerHTML,
        dialogs: [...document.querySelectorAll('[role="dialog"]')].map(e => ({label: e.getAttribute('aria-label'), modal: e.getAttribute('aria-modal')})) };
    }, axeRules);
    if (name === 'wallet-send-review' || name === 'connect-station-form') {
      const dialog = page.getByRole('dialog');
      const hasDialog = await dialog.count() > 0;
      if (name === 'connect-station-form') await page.getByLabel('Ambient API Key', { exact: true }).focus();
      const focus = [];
      for (let i = 0; i < 12; i += 1) {
        await page.keyboard.press('Tab');
        focus.push(await page.evaluate(() => {
          const el = document.activeElement;
          return { tag: el?.tagName, name: el?.getAttribute('aria-label') || el?.labels?.[0]?.textContent || el?.textContent?.slice(0, 80), inDialog: !!el?.closest('[role="dialog"]') };
        }));
      }
      accessibility.keyboard = { hasDialog, forward: focus };
      if (hasDialog && focus.some(f => !f.inDialog)) throw new Error('Focus escaped dialog');
      if (hasDialog) {
        const reverse = [];
        for (let i = 0; i < 6; i += 1) {
          await page.keyboard.press('Shift+Tab');
          reverse.push(await page.evaluate(() => ({ name: document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent?.slice(0, 80), inDialog: !!document.activeElement?.closest('[role="dialog"]') })));
        }
        if (reverse.some(f => !f.inDialog)) throw new Error('Reverse focus escaped dialog');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
        accessibility.keyboard.reverse = reverse;
        accessibility.keyboard.escapeClosed = await dialog.count() === 0;
        accessibility.keyboard.restoredFocus = await page.evaluate(() => document.activeElement?.textContent);
        if (!accessibility.keyboard.escapeClosed || accessibility.keyboard.restoredFocus !== 'Send') throw new Error('Dialog did not return focus to Send');
      }
    }
  }
  const entry = { accessibility, name, route, viewport: suffix, wantTheme, file, ...meta, ...extra, pageErrors: errors.slice(0, 3) };
  entry.problems = verdict(entry);
  if (auditA11y) {
    for (const violation of accessibility.violations) {
      if (['serious', 'critical'].includes(violation.impact)) entry.problems.push(`axe ${violation.id}: ${violation.nodes.length}`);
    }
  }
  report.push(entry);
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({ base, captures: report }, null, 1));
  if (auditA11y) console.log(' axe ', name, suffix, (accessibility?.violations || []).filter(v => ['serious', 'critical'].includes(v.impact)).map(v => `${v.id}:${v.nodes.length}`).join(', ') || 'no serious/critical');
  console.log(`${entry.problems.length ? 'FAIL' : ' ok '} ${name.padEnd(26)} ${suffix.padEnd(18)} ${entry.problems.join(', ')}`);
  errors.length = 0;
  return entry;
}

async function runViewport(browser, vp, tall, theme) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: tall ? vp.tall : vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor || 1 });
  await context.addInitScript(([key, mode]) => { try { window.localStorage.setItem(key, mode); } catch { /* storage blocked: the app falls back to dark */ } }, [THEME_STORAGE_KEY, theme]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
  const fx = buildFixtures({ origin, host });
  await installRoutes(page, fx);
  // Dark keeps the historical file names; light captures carry a -light suffix next to them.
  const suffix = `${vp.name}${tall ? '-tall' : ''}${theme === 'light' ? '-light' : ''}`;
  wantTheme = theme;
  try {
    // Warm the dev server once per context so a dependency re-optimisation never lands on a capture.
    await loadRoute(page, '/', errors);
    errors.length = 0;
    for (const { name, route } of ROUTES) {
      if (!want(name)) continue;
      await loadRoute(page, route, errors);
      await capture(page, errors, name, route, suffix);
    }
    if (want('forecast-filled')) {
      try {
        await loadRoute(page, '/weather/forecast', errors);
        await page.getByLabel(/latitude/i).first().fill('44.9');
        await page.getByLabel(/longitude/i).first().fill('-93.2');
        await page.getByRole('button', { name: /get forecast/i }).click();
        await page.waitForTimeout(3000);
        await capture(page, errors, 'forecast-filled', '/weather/forecast (44.9, -93.2)', suffix);
      } catch (e) { console.log('FAIL forecast-filled', suffix, String(e).slice(0, 160)); report.push({ name: 'forecast-filled', viewport: suffix, problems: ['scenario failed: ' + String(e).slice(0, 120)], pageErrors: [] }); }
    }
    if (want('home-dismissed')) {
      try {
        await loadRoute(page, '/', errors);
        await dismissBanner(page);
        await capture(page, errors, 'home-dismissed', '/ (banner dismissed)', suffix);
      } catch (e) { console.log('FAIL home-dismissed', suffix, String(e).slice(0, 160)); report.push({ name: 'home-dismissed', viewport: suffix, problems: ['scenario failed: ' + String(e).slice(0, 120)], pageErrors: [] }); }
    }
    if (want('downloads-unpublished')) {
      try {
        await page.unroute(() => true);
        await installRoutes(page, fx, { manifest: 'shipped' });
        await loadRoute(page, '/downloads', errors);
        await capture(page, errors, 'downloads-unpublished', '/downloads (shipped manifest)', suffix);
        await page.unroute(() => true);
        await installRoutes(page, fx);
      } catch (e) { console.log('FAIL downloads-unpublished', suffix, String(e).slice(0, 160)); report.push({ name: 'downloads-unpublished', viewport: suffix, problems: ['scenario failed: ' + String(e).slice(0, 120)], pageErrors: [] }); }
    }
    for (const [name, mode, route] of [['forecasters-empty', 'empty', '/forecasters'], ['forecaster-empty', 'empty', '/forecasters/c_0123456789abcdef01234567'], ['forecasters-unavailable', 'unavailable', '/forecasters']]) {
      if (!want(name)) continue;
      try {
        await page.unroute(() => true);
        await installRoutes(page, fx, { forecasters: mode });
        await loadRoute(page, route, errors);
        await capture(page, errors, name, `${route} (${mode})`, suffix);
        await page.unroute(() => true);
        await installRoutes(page, fx);
      } catch (e) { console.log(`FAIL ${name}`, suffix, String(e).slice(0, 160)); report.push({ name, viewport: suffix, problems: ['scenario failed: ' + String(e).slice(0, 120)], pageErrors: [] }); }
    }
    for (const [name, mode] of [['bond-grants-empty', 'empty'], ['bond-grants-unavailable', 'unavailable']]) {
      if (!want(name)) continue;
      try {
        await page.unroute(() => true);
        await installRoutes(page, fx, { bondGrants: mode });
        await loadRoute(page, '/faucet/bond-grants', errors);
        await capture(page, errors, name, `/faucet/bond-grants (${mode})`, suffix);
        await page.unroute(() => true);
        await installRoutes(page, fx);
      } catch (e) { console.log(`FAIL ${name}`, suffix, String(e).slice(0, 160)); report.push({ name, viewport: suffix, problems: ['scenario failed: ' + String(e).slice(0, 120)], pageErrors: [] }); }
    }
    for (const [name, mode] of [['proof-card-not-located', 'not_located'], ['proof-card-off', 'off']]) {
      if (!want(name)) continue;
      try {
        await page.unroute(() => true);
        await installRoutes(page, fx, { proofCard: mode });
        await loadRoute(page, `/proof/${fx.PROOF_COMMIT}`, errors);
        await capture(page, errors, name, `/proof/<commit> (${mode})`, suffix);
        await page.unroute(() => true);
        await installRoutes(page, fx);
      } catch (e) { console.log(`FAIL ${name}`, suffix, String(e).slice(0, 160)); report.push({ name, viewport: suffix, problems: ['scenario failed: ' + String(e).slice(0, 120)], pageErrors: [] }); }
    }
    for (const [name, mode] of [['nodes-partial', 'partial'], ['nodes-off', 'off']]) {
      if (!want(name)) continue;
      try {
        await page.unroute(() => true);
        await installRoutes(page, fx, { networkNodes: mode });
        await loadRoute(page, '/nodes', errors);
        await capture(page, errors, name, `/nodes (${mode})`, suffix);
        await page.unroute(() => true);
        await installRoutes(page, fx);
      } catch (e) { console.log(`FAIL ${name}`, suffix, String(e).slice(0, 160)); report.push({ name, viewport: suffix, problems: ['scenario failed: ' + String(e).slice(0, 120)], pageErrors: [] }); }
    }
    for (const [name, mode] of [['explore-address', 'populated'], ['explore-address-off', 'off']]) {
      if (!want(name)) continue;
      try {
        await page.unroute(() => true);
        await installRoutes(page, fx, { publicBalance: mode });
        await loadRoute(page, '/explore', errors);
        await page.getByTestId('address-lookup-input').fill('wrfc37f4be1a2d93e08b6c75f1e0a4d82c9b3e6f710');
        await page.getByRole('button', { name: /look up/i }).click();
        await page.getByTestId(mode === 'off' ? 'address-lookup-message' : 'address-lookup-result').waitFor({ timeout: 10_000 });
        await capture(page, errors, name, `/explore (address lookup, ${mode})`, suffix);
        await page.unroute(() => true);
        await installRoutes(page, fx);
      } catch (e) { console.log(`FAIL ${name}`, suffix, String(e).slice(0, 160)); report.push({ name, viewport: suffix, problems: ['scenario failed: ' + String(e).slice(0, 120)], pageErrors: [] }); }
    }
    if (want('wallet-unlocked') || want('connect-station-unlocked') || want('wallet-send-review')) {
      try {
        await createWallet(page, errors);
        if (want('wallet-unlocked')) { await goClientSide(page, '/wallet'); await page.getByText('Recent activity').first().waitFor({ timeout: 20_000 }).catch(() => undefined); await capture(page, errors, 'wallet-unlocked', '/wallet', suffix); }
        if (want('connect-station-unlocked')) {
          await goClientSide(page, '/connect-station');
          await capture(page, errors, 'connect-station-unlocked', '/connect-station', suffix);
          if (auditA11y) {
            await page.getByRole('button', { name: 'Use this wallet' }).click();
            await page.getByRole('button', { name: /Continue without test tokens|Skip for now/ }).click();
            await capture(page, errors, 'connect-station-form', '/connect-station (station details)', suffix);
          }
        }
        if (want('wallet-send-review')) {
          await goClientSide(page, '/wallet');
          await page.getByRole('button', { name: /^Send$/ }).click();
          await page.getByLabel('Recipient address').fill(fx.PEER);
          await page.getByLabel('Amount in WRF').fill('250');
          await page.getByRole('button', { name: 'Review transfer' }).click();
          await page.getByLabel('Wallet password for this send').waitFor({ timeout: 20_000 });
          await capture(page, errors, 'wallet-send-review', '/wallet (Send reviewed)', suffix);
        }
      } catch (e) {
        console.log('FAIL unlocked flow', suffix, String(e).slice(0, 200));
        await page.screenshot({ path: path.join(outDir, `wallet-unlocked-FAILED-${suffix}.png`), fullPage: false }).catch(() => undefined);
        report.push({ name: 'wallet-unlocked', viewport: suffix, problems: ['scenario failed: ' + String(e).slice(0, 120)], pageErrors: [] });
      }
    }
  } finally {
    await context.close();
  }
}

function writeIndex() {
  const groups = new Map();
  for (const e of report) { if (!groups.has(e.viewport)) groups.set(e.viewport, []); groups.get(e.viewport).push(e); }
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tiles = [...groups].map(([vp, entries]) => `<h2>${esc(vp)}</h2><div class="grid">${entries.map(e => `<figure class="${e.problems?.length ? 'bad' : ''}">${e.file ? `<a href="${esc(e.file)}"><img loading="lazy" src="${esc(e.file)}" alt="${esc(e.name)}"></a>` : ''}<figcaption><b>${esc(e.name)}</b> <code>${esc(e.route || '')}</code><br>${esc((e.h1 || []).join(' | '))}${e.problems?.length ? `<br><strong>${esc(e.problems.join(', '))}</strong>` : ''}</figcaption></figure>`).join('')}</div>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><title>Visual QA ${esc(stamp)}</title><style>body{font:14px system-ui;margin:16px;background:#0f172a;color:#e2e8f0}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}figure{margin:0;background:#1e293b;border-radius:8px;padding:8px;border:1px solid #334155}figure.bad{border-color:#ef4444}img{width:100%;height:auto;border-radius:4px;background:#000}code{color:#93c5fd}strong{color:#f87171}</style><h1>Visual QA · ${esc(base)} · ${esc(stamp)}</h1><p>${report.length} captures, ${report.filter(e => e.problems?.length).length} with problems. Details in <a href="report.json">report.json</a>.</p>${tiles}`;
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
}

(async () => {
  let vite = null;
  if (startServer) {
    if (await portAnswers(`${base}/`)) {
      console.error(`visual-qa: ${base} already answers; that is not this checkout's server. Stop it or pass --base <url> to test it on purpose.`);
      process.exit(2);
    }
    vite = startVite();
    await waitForServer(`${base}/`);
  }
  const browser = await chromium.launch({ executablePath: chromeExecutable(), headless: true });
  try {
    for (const vp of VIEWPORTS) {
      if (viewportFilter.length && !viewportFilter.includes(vp.name)) continue;
      for (const theme of themes) {
        for (const tall of tallToo ? [false, true] : [false]) await runViewport(browser, vp, tall, theme);
      }
    }
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({ base, generated: new Date().toISOString(), themes, routes: ROUTES, scenarios: SCENARIOS, captures: report }, null, 1));
    writeIndex();
    if (vite) { stopping = true; vite.kill('SIGTERM'); await new Promise(r => { vite.once('exit', r); setTimeout(() => { vite.kill('SIGKILL'); r(); }, 5000); }); }
  }
  const bad = report.filter(e => e.problems?.length);
  console.log(`\n${report.length} captures → ${outDir}\n${bad.length ? `${bad.length} with problems:\n` + bad.map(e => `  ${e.name} ${e.viewport}: ${e.problems.join(', ')}`).join('\n') : 'no error boundary, page error, overflow or splash'}`);
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
