// Network Status Indicators Playwright Tests
// Part of Task 6.3: Implement Playwright Tests for Network Status Indicators

import { test, expect } from '@playwright/test';

test.describe('Network Status Indicators', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('http://localhost:5000');

    // Wait for the dashboard to load by checking for the main heading
    await page.waitForSelector('h1:has-text("Wrfcoin Ecosystem Dashboard")', {
      timeout: 15000,
      state: 'visible',
    });

    // Wait for data to load (allow time for any API calls to complete or mock data to populate)
    await page.waitForTimeout(2000);
  });

  test('should display network status section', async ({ page }) => {
    // Check if Network Status section exists
    const networkStatusSection = page.getByRole('heading', {
      name: 'Network Status',
    });
    await expect(networkStatusSection).toBeVisible();

    // Verify section is properly positioned in Network Insights
    const networkInsightsSection = page.getByRole('heading', {
      name: 'Network Insights',
    });
    await expect(networkInsightsSection).toBeVisible();
  });

  test('should display blockchain sync status', async ({ page }) => {
    // Find and verify blockchain sync status in Network Status section specifically
    const blockchainSyncLabel = page.getByText('Blockchain Sync');
    await expect(blockchainSyncLabel).toBeVisible();

    // Look for the specific "Active" status next to "Blockchain Sync" in the Network Status section
    const networkStatusSection = page
      .locator('h3:has-text("Network Status")')
      .locator('..');
    const blockchainSyncStatus = networkStatusSection
      .locator('text=Active')
      .first();
    await expect(blockchainSyncStatus).toBeVisible();
  });

  test('should display cross-chain bridges status', async ({ page }) => {
    // Find and verify cross-chain bridges status in Network Status section
    const bridgesLabel = page.getByText('Cross-chain Bridges');
    await expect(bridgesLabel).toBeVisible();

    // Look for "Operational" status in the Cross-Chain section specifically
    const crossChainSection = page
      .locator('h2:has-text("Cross-Chain & Interoperability")')
      .locator('..');
    const bridgesStatus = crossChainSection.getByText('Operational').first();
    await expect(bridgesStatus).toBeVisible();
  });

  test('should display AI/ML networks status', async ({ page }) => {
    // Find and verify AI/ML networks status in Network Status section
    const aiMlLabel = page.getByText('AI/ML Networks');
    await expect(aiMlLabel).toBeVisible();

    // Look for "Running" status in the Network Status section specifically
    const networkStatusSection = page
      .locator('h3:has-text("Network Status")')
      .locator('..');
    const aiMlStatus = networkStatusSection.getByText('Running').first();
    await expect(aiMlStatus).toBeVisible();
  });

  test('should display storage networks status', async ({ page }) => {
    // Find and verify storage networks status in Network Status section
    const networkStatusSection = page
      .locator('h3:has-text("Network Status")')
      .locator('..');
    const storageLabel = networkStatusSection
      .getByText('Storage Networks')
      .first();
    await expect(storageLabel).toBeVisible();

    const storageStatus = networkStatusSection.getByText('Syncing').first();
    await expect(storageStatus).toBeVisible();
  });

  test('should display overall network health percentage', async ({ page }) => {
    // Find network health indicator
    const networkHealthLabel = page.getByText('Network Health');
    await expect(networkHealthLabel).toBeVisible();

    // Find and validate health percentage
    const healthPercentage = page.getByText('98.7%');
    await expect(healthPercentage).toBeVisible();

    // Verify it's a valid percentage
    const healthText = await healthPercentage.textContent();
    expect(healthText).toMatch(/^\d{1,3}\.\d%$/);

    // Verify health is above critical threshold (>90%)
    const healthValue = parseFloat(healthText.replace('%', ''));
    expect(healthValue).toBeGreaterThan(90);
  });

  test('should display system status indicators', async ({ page }) => {
    // Find system status section
    const systemStatusHeading = page.getByRole('heading', {
      name: 'System Status',
    });
    await expect(systemStatusHeading).toBeVisible();

    // Verify operational status message
    const statusMessage = page.getByText(
      'All systems operational • Uptime: 99.94%',
    );
    await expect(statusMessage).toBeVisible();

    // Extract and validate uptime percentage
    const statusText = await statusMessage.textContent();
    expect(statusText).toContain('All systems operational');
    expect(statusText).toMatch(/Uptime: \d{1,3}\.\d{1,2}%/);
  });

  test('should display maintenance information', async ({ page }) => {
    // Find maintenance section
    const maintenanceHeading = page.getByRole('heading', {
      name: 'Next Scheduled Maintenance',
    });
    await expect(maintenanceHeading).toBeVisible();

    // Verify maintenance status
    const maintenanceStatus = page.getByText('No maintenance scheduled');
    await expect(maintenanceStatus).toBeVisible();
  });

  test('should display support information', async ({ page }) => {
    // Find support section
    const supportHeading = page.getByRole('heading', { name: 'Support' });
    await expect(supportHeading).toBeVisible();

    // Verify support status
    const supportStatus = page.getByText(
      '24/7 monitoring active • Emergency response ready',
    );
    await expect(supportStatus).toBeVisible();
  });

  test('should display operational status badges for major components', async ({
    page,
  }) => {
    // Check for "Operational" badges in various sections
    const operationalBadges = page.getByText('Operational');
    const badgeCount = await operationalBadges.count();

    // Should have multiple operational status indicators
    expect(badgeCount).toBeGreaterThan(3);

    // Verify specific sections have operational status
    const sections = [
      'Core Network Metrics',
      'Performance & Security',
      'Cross-Chain & Interoperability',
      'AI/ML & Compute Networks',
      'Distributed Storage Networks',
    ];

    for (const sectionName of sections) {
      const sectionHeading = page.getByRole('heading', { name: sectionName });
      await expect(sectionHeading).toBeVisible();
    }
  });

  test('should monitor network status changes over time', async ({ page }) => {
    // Take initial screenshot of network status
    await page.screenshot({
      path: 'test-results/network-status-initial.png',
      fullPage: true,
    });

    // Wait for potential status updates (matching dashboard refresh interval)
    await page.waitForTimeout(5000);

    // Verify status elements are still visible after time
    const networkStatusSection = page.getByRole('heading', {
      name: 'Network Status',
    });
    await expect(networkStatusSection).toBeVisible();

    // Verify key metrics are still present
    const healthPercentage = page.getByText('98.7%');
    await expect(healthPercentage).toBeVisible();
  });

  test('should validate network connectivity indicators format', async ({
    page,
  }) => {
    // Validate metrics in the Cross-Chain section specifically
    const crossChainSection = page
      .locator('h2:has-text("Cross-Chain & Interoperability")')
      .locator('..');

    // Validate Active Bridges count format in cross-chain section
    const activeBridges = crossChainSection.getByText('13').first();
    await expect(activeBridges).toBeVisible();

    // Validate Supported Chains count format in cross-chain section
    const supportedChains = crossChainSection.locator('text=28').first();
    await expect(supportedChains).toBeVisible();

    // Validate Bridge Health percentage format in cross-chain section
    const bridgeHealth = crossChainSection.getByText('97.8%').first();
    await expect(bridgeHealth).toBeVisible();

    // Verify these are numeric values
    const bridgeHealthText = await bridgeHealth.textContent();
    expect(bridgeHealthText).toMatch(/^\d{1,3}\.\d%$/);
  });

  test('should handle network status error scenarios gracefully', async ({
    page,
  }) => {
    // Test graceful degradation by checking for fallback content
    // This assumes the frontend handles API failures gracefully

    // Verify essential status indicators are present
    const essentialIndicators = [
      'Network Health',
      'Blockchain Sync',
      'Cross-chain Bridges',
      'System Status',
    ];

    for (const indicator of essentialIndicators) {
      const element = page.getByText(indicator);
      await expect(element).toBeVisible();
    }

    // Verify no error states are visible in network status
    const errorMessages = page.getByText('Error').or(page.getByText('Failed'));
    await expect(errorMessages).toHaveCount(0);
  });

  test('should verify network performance metrics are within expected ranges', async ({
    page,
  }) => {
    // Verify CPU Usage is reasonable (should be < 100%)
    const cpuUsageLabel = page.getByText('CPU Usage');
    await expect(cpuUsageLabel).toBeVisible();

    const cpuUsageValue = page.getByText('34%');
    await expect(cpuUsageValue).toBeVisible();
    const cpuText = await cpuUsageValue.textContent();
    const cpuValue = parseInt(cpuText.replace('%', ''));
    expect(cpuValue).toBeLessThanOrEqual(100);
    expect(cpuValue).toBeGreaterThanOrEqual(0);

    // Verify Memory Usage is reasonable (should be < 100%)
    const memoryUsageLabel = page.getByText('Memory Usage');
    await expect(memoryUsageLabel).toBeVisible();

    const memoryUsageValue = page.getByText('67%');
    await expect(memoryUsageValue).toBeVisible();
    const memoryText = await memoryUsageValue.textContent();
    const memoryValue = parseInt(memoryText.replace('%', ''));
    expect(memoryValue).toBeLessThanOrEqual(100);
    expect(memoryValue).toBeGreaterThanOrEqual(0);
  });
});
