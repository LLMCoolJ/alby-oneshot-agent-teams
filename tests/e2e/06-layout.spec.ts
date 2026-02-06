import { test, expect } from '@playwright/test';

const SCENARIO_NAMES = [
  'Simple Payment',
  'Lightning Address',
  'Notifications',
  'Hold Invoice',
  'Proof of Payment',
  'Transaction History',
  'Nostr Zap',
  'Fiat Conversion',
];

const SCENARIO_PATHS = [
  '/simple-payment',
  '/lightning-address',
  '/notifications',
  '/hold-invoice',
  '/proof-of-payment',
  '/transaction-history',
  '/nostr-zap',
  '/fiat-conversion',
];

test.describe('06 - Layout & Navigation', () => {
  test('app loads with sidebar and main content visible', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Sidebar should be present
    const aside = page.locator('aside');
    await expect(aside).toBeAttached();

    // Lightning Demo title should exist in sidebar
    await expect(page.locator('aside h1')).toHaveText('Lightning Demo');

    // Main content area should exist
    const main = page.locator('main');
    await expect(main).toBeAttached();

    await page.screenshot({ path: 'tests/e2e/screenshots/06-layout-initial.png' });

    expect(consoleErrors).toHaveLength(0);
  });

  test('all 8 scenario links are present in sidebar', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('aside nav');
    for (const name of SCENARIO_NAMES) {
      await expect(nav.getByText(name)).toBeVisible();
    }

    // Verify correct link count
    const links = nav.locator('a');
    await expect(links).toHaveCount(8);

    expect(consoleErrors).toHaveLength(0);
  });

  test('default route redirects to /simple-payment', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should redirect to /simple-payment
    expect(page.url()).toContain('/simple-payment');

    expect(consoleErrors).toHaveLength(0);
  });

  test('navigation between scenarios works', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Lightning Address scenario
    await page.locator('aside nav').getByText('Lightning Address').click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/lightning-address');

    // Navigate to Notifications scenario
    await page.locator('aside nav').getByText('Notifications').click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/notifications');

    await page.screenshot({ path: 'tests/e2e/screenshots/06-layout-navigation.png' });

    expect(consoleErrors).toHaveLength(0);
  });

  test('external links have correct href and target', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Faucet link - use role-based locator to get the <a> directly
    const faucetAnchor = page.locator('aside a', { hasText: 'Get Testnet Sats' });
    await expect(faucetAnchor).toBeAttached();
    await expect(faucetAnchor).toHaveAttribute('href', 'https://faucet.nwc.dev');
    await expect(faucetAnchor).toHaveAttribute('target', '_blank');
    await expect(faucetAnchor).toHaveAttribute('rel', /noopener/);

    // SDK docs link
    const sdkAnchor = page.locator('aside a', { hasText: 'Alby SDK Docs' });
    await expect(sdkAnchor).toBeAttached();
    await expect(sdkAnchor).toHaveAttribute('href', 'https://github.com/getAlby/alby-js-sdk');
    await expect(sdkAnchor).toHaveAttribute('target', '_blank');
    await expect(sdkAnchor).toHaveAttribute('rel', /noopener/);

    expect(consoleErrors).toHaveLength(0);
  });

  test('scenario links have correct paths', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('aside nav');
    for (let i = 0; i < SCENARIO_NAMES.length; i++) {
      const link = nav.locator('a', { hasText: SCENARIO_NAMES[i] });
      await expect(link).toHaveAttribute('href', SCENARIO_PATHS[i]);
    }

    expect(consoleErrors).toHaveLength(0);
  });
});
