import { expect, test } from '@playwright/test';

// Synthetic backend list rows, matching the public read-only explorer contract.
const testnetBlock = {
  height: 101,
  hash: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0101',
  previousHash: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0100',
  timestamp: '2026-05-28T20:26:40Z',
  transactions: 3,
};
const useWrongShape = process.env.EXPLORER_HEALTH_STUB_SHAPE === 'wrong';

async function installTestnetApiStub(page, { unavailable = false } = {}) {
  const requests = { blocks: 0, unexpected: [] };
  // All API traffic is intercepted: this probe never needs a running backend.
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/capabilities') {
      await route.fulfill({ json: { features: {}, timestamp: '2026-05-28T20:26:40Z' } });
    } else if (url.pathname === '/api/blockchain/blocks' && url.search === '?limit=25') {
      requests.blocks += 1;
      await route.fulfill({
        status: unavailable ? 503 : 200,
        json: unavailable ? { error: 'unavailable' } : useWrongShape ? { items: [] } : { blocks: [testnetBlock] },
      });
    } else {
      requests.unexpected.push(url.pathname);
      await route.abort();
    }
  });
  return requests;
}

test.describe('testnet explorer health probe', () => {
  test('renders public block cards from the public list contract', async ({ page }) => {
    const requests = await installTestnetApiStub(page);
    await page.goto('/explore');
    const explorer = page.getByTestId('public-readonly-explorer');
    await expect(explorer.getByRole('heading', { name: 'Block Explorer', exact: true })).toBeVisible();
    const card = explorer.getByTestId('explorer-block-card');
    await expect(card).toHaveCount(1);
    await expect(card.getByRole('heading', { name: 'Block 101', exact: true })).toBeVisible();
    await expect(card.getByText('3 txs', { exact: true })).toBeVisible();
    await expect(card.locator('time')).toHaveAttribute('datetime', '2026-05-28T20:26:40.000Z');
    await expect(card.getByTitle(testnetBlock.hash, { exact: true })).toHaveText('01234567…ef0101');
    await expect(card.getByRole('button', { name: 'Copy block hash', exact: true })).toBeVisible();
    await expect(card.getByRole('link', { name: '/explore#block-101' })).toHaveAttribute('href', '#block-101');
    await expect(explorer.getByText('Per-transaction detail is not published on the public site.', { exact: false })).toBeVisible();
    expect(requests.blocks).toBeGreaterThan(0);
    expect(requests.unexpected).toEqual([]);
    await expect(page.getByText(/error boundary/i)).toHaveCount(0);
  });

  test('reports unavailable blocks without rendering invented cards', async ({ page }) => {
    const requests = await installTestnetApiStub(page, { unavailable: true });
    await page.goto('/explore');
    await expect(page.getByText('Live block data is unavailable', { exact: true })).toBeVisible();
    await expect(page.getByTestId('explorer-block-card')).toHaveCount(0);
    expect(requests.blocks).toBeGreaterThan(0);
    expect(requests.unexpected).toEqual([]);
  });
});
