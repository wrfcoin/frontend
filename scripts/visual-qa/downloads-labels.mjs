// Local-only Android publication-label captures, using the shared QA fixtures.
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { buildFixtures, installRoutes } from './fixtures.mjs';
const stage = process.argv[2];
if (!['before', 'after'].includes(stage)) throw new Error('Pass before or after');
const origin = 'http://127.0.0.1:5208';
try { await fetch(origin); throw new Error('Port 5208 already in use'); }
catch (e) { if (e.message === 'Port 5208 already in use') throw e; }
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'scripts/visual-qa/vite.config.mjs'], {
  env: { ...process.env, VISUAL_QA_PORT: '5208' }, stdio: 'ignore',
});
let browser;
try {
  let ready = false;
  for (let i = 0; i < 120; i++) {
    if (server.exitCode !== null) throw new Error('Local Vite exited');
    try { if ((await fetch(origin)).ok) { ready = true; break; } } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  if (!ready) throw new Error('Local Vite did not start');
  browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
  const out = `docs/screenshots/launch/public-strings/${stage}`;
  await mkdir(out, { recursive: true });
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1200 } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await installRoutes(page, buildFixtures({ origin, host: '127.0.0.1:5208' }), { manifest: 'shipped' });
    await page.goto(`${origin}/downloads`);
    await page.getByRole('heading', { name: 'Downloads', exact: true }).waitFor({ timeout: 60000 });
    await page.getByRole('button', { name: 'Android', exact: true }).click();
    await page.getByRole('heading', { name: 'Android app', exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/android-${width}.png` });
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(`PASS ${stage} Android ${width}, no page errors`);
    await page.close();
  }
} finally { await browser?.close(); server.kill('SIGTERM'); }
