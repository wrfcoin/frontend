const { test, expect } = require('@playwright/test');

test.describe('DAG Explorer Vertical Layout', () => {
  test('should render the DAG explorer with vertical blocks and scrollable container', async ({ page }) => {
    // Navigate to the DAG Explorer page
    await page.goto('http://localhost:5000/dag-explorer');

    // Wait for the SVG to render (this means D3 has populated it)
    await page.waitForSelector('svg g.blocks');

    // Check if blocks are present in the DOM
    const blocksCount = await page.locator('g.blocks > g').count();
    expect(blocksCount).toBeGreaterThan(0);

    // Get the container and verify it has overflow: auto for native scrolling
    const scrollContainer = page.locator('.MuiBox-root > svg').locator('..');

    // Evaluate CSS properties of the container
    const isScrollable = await scrollContainer.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.overflow === 'auto' || style.overflowY === 'auto';
    });

    expect(isScrollable).toBeTruthy();

    // Optional: verify that the layout is indeed vertical by checking
    // that the height of the SVG is large enough or greater than width
    const svgBox = await page.locator('svg').boundingBox();
    expect(svgBox).not.toBeNull();
    // In our new config, the vertical layout makes the height grow substantially.
    expect(svgBox.height).toBeGreaterThan(500);
  });
});
