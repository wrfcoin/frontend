const { chromium } = require('/home/tony/wrfcoin/frontend/node_modules/playwright');
const crypto = require('crypto');
const S = process.argv[2];
const PAGE_URL = 'http://localhost:5191/wallet/passkey';
const FROM_NONCE = '7';
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const results = [];
  for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
    for (const theme of ['light', 'dark']) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, deviceScaleFactor: mobile ? 2 : 1, colorScheme: theme });
      await ctx.addInitScript((t) => { try { localStorage.setItem('wrfcoin-theme-mode', t); } catch {} }, theme);
      const page = await ctx.newPage();
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('WebAuthn.enable');
      await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } });
      let submitMode = 'inactive'; let lastBody = null; let nonceHits = 0;
      await page.route((u) => u.pathname.startsWith('/api/'), (route) => {
        const u = new URL(route.request().url());
        if (u.pathname.startsWith('/api/wallet/send-passkey/nonce/')) { nonceHits++; return route.fulfill({ json: { address: u.pathname.split('/').pop(), nonce: FROM_NONCE } }); }
        if (u.pathname === '/api/wallet/send-passkey') {
          lastBody = JSON.parse(route.request().postData());
          return submitMode === 'ok'
            ? route.fulfill({ status: 202, json: { hash: 'tx_9f1c2a7e55b04d3c', status: 'submitted', settled: false } })
            : route.fulfill({ status: 503, json: { error: { code: 'FEATURE_NOT_ACTIVE', message: 'passkey_p256_auth is not active' } } });
        }
        return route.fulfill({ status: 404, json: {} });
      });
      const tag = `${w}-${theme}`;
      await page.goto(PAGE_URL); await page.waitForTimeout(4000);
      await page.goto(PAGE_URL); await page.waitForSelector('text=Passkey wallet', { timeout: 30000 });
      await page.screenshot({ path: `${S}/shots/passkey-1-initial-${tag}.png` });
      await page.click('text=Create passkey account');
      await page.waitForSelector('[data-testid=passkey-address]', { timeout: 15000 });
      const address = await page.textContent('[data-testid=passkey-address]');
      await page.waitForTimeout(1500);
      await page.fill('input[placeholder="0x…"]', '0x1111111111111111111111111111111111111111');
      await page.getByLabel('Amount (WRF)').fill('1.5');
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `${S}/shots/passkey-2-registered-${tag}.png` });
      await page.click('text=Send with passkey');
      await page.waitForSelector('text=not active on the chain yet', { timeout: 15000 });
      await page.screenshot({ path: `${S}/shots/passkey-3-not-active-${tag}.png` });
      const first = lastBody;
      submitMode = 'ok';
      await page.click('text=Send with passkey');
      await page.waitForSelector('text=Submitted', { timeout: 15000 });
      await page.screenshot({ path: `${S}/shots/passkey-4-submitted-${tag}.png` });
      results.push({ tag, address, nonceHits, body: first });
      await ctx.close();
    }
  }
  require('fs').writeFileSync(`${S}/shot-results.json`, JSON.stringify(results, null, 1));
  await browser.close();
})().catch((e) => { console.error('SHOT FAIL', e.message); process.exit(1); });
