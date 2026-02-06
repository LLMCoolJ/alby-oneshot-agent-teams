import { test, expect } from '@playwright/test';

// Fiat conversion page fetches live exchange rates on load.
// In offline/sandboxed E2E environments these network calls fail,
// producing expected console errors that we filter out.
const EXPECTED_ERROR_PATTERNS = [
  'ERR_INTERNET_DISCONNECTED',
  'Failed to fetch',
  'Fiat rate error',
  'net::ERR_',
];

function isExpectedError(msg: string): boolean {
  return EXPECTED_ERROR_PATTERNS.some(pattern => msg.includes(pattern));
}

test.describe('14 - Fiat Conversion', () => {
  test('page loads with title and description', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !isExpectedError(msg.text())) consoleErrors.push(msg.text());
    });

    await page.goto('/fiat-conversion');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Fiat Conversion' })).toBeVisible();
    await expect(page.getByText('See Lightning amounts in both satoshis and fiat currency with real-time exchange rates.')).toBeVisible();

    await page.screenshot({ path: 'tests/e2e/screenshots/14-fiat-conversion-initial.png' });

    expect(consoleErrors).toHaveLength(0);
  });

  test('currency selector is visible with USD default', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !isExpectedError(msg.text())) consoleErrors.push(msg.text());
    });

    await page.goto('/fiat-conversion');
    await page.waitForLoadState('networkidle');

    const currencySelect = page.getByTestId('currency-select');
    await expect(currencySelect).toBeVisible();
    await expect(currencySelect).toHaveValue('USD');

    expect(consoleErrors).toHaveLength(0);
  });

  test('currency settings section displays exchange rate area', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !isExpectedError(msg.text())) consoleErrors.push(msg.text());
    });

    await page.goto('/fiat-conversion');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Currency Settings')).toBeVisible();
    await expect(page.getByText('Display Currency')).toBeVisible();
    await expect(page.getByText('Current Exchange Rate')).toBeVisible();

    // Change currency to EUR and take screenshot
    const currencySelect = page.getByTestId('currency-select');
    await currencySelect.selectOption('EUR');
    await expect(currencySelect).toHaveValue('EUR');

    await page.screenshot({ path: 'tests/e2e/screenshots/14-fiat-conversion-currency-change.png' });

    expect(consoleErrors).toHaveLength(0);
  });

  test('quick reference section loads with reference amounts', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !isExpectedError(msg.text())) consoleErrors.push(msg.text());
    });

    await page.goto('/fiat-conversion');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Quick Reference')).toBeVisible();

    // Reference items should render even when API calls fail (they show em-dash for values)
    await expect(page.getByTestId('reference-item-1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('reference-item-100')).toBeVisible();
    await expect(page.getByTestId('reference-item-1000')).toBeVisible();
    await expect(page.getByTestId('reference-item-10000')).toBeVisible();
    await expect(page.getByTestId('reference-item-100000')).toBeVisible();
    await expect(page.getByTestId('reference-item-1000000')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('Alice and Bob wallet cards are present', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !isExpectedError(msg.text())) consoleErrors.push(msg.text());
    });

    await page.goto('/fiat-conversion');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('wallet-card-alice')).toBeVisible();
    await expect(page.getByTestId('wallet-card-bob')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('educational content about satoshis is visible', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !isExpectedError(msg.text())) consoleErrors.push(msg.text());
    });

    await page.goto('/fiat-conversion');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Did you know?')).toBeVisible();
    await expect(page.getByText(/A satoshi \(sat\) is the smallest unit of Bitcoin/)).toBeVisible();
    await expect(page.getByText(/100,000,000 sats in 1 BTC/)).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('wallet connection forms are present when disconnected', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !isExpectedError(msg.text())) consoleErrors.push(msg.text());
    });

    await page.goto('/fiat-conversion');
    await page.waitForLoadState('networkidle');

    const aliceCard = page.getByTestId('wallet-card-alice');
    const bobCard = page.getByTestId('wallet-card-bob');

    await expect(aliceCard.getByText('NWC Connection String')).toBeVisible();
    await expect(aliceCard.getByText('Connect Wallet')).toBeVisible();

    await expect(bobCard.getByText('NWC Connection String')).toBeVisible();
    await expect(bobCard.getByText('Connect Wallet')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('transaction log section exists', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !isExpectedError(msg.text())) consoleErrors.push(msg.text());
    });

    await page.goto('/fiat-conversion');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Transaction Log')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('sidebar navigation link for fiat conversion', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !isExpectedError(msg.text())) consoleErrors.push(msg.text());
    });

    // Start from a different page
    await page.goto('/simple-payment');
    await page.waitForLoadState('networkidle');

    // On mobile viewports the sidebar is hidden; open it via the menu button
    const menuButton = page.getByLabel('Open menu');
    if (await menuButton.isVisible()) {
      await menuButton.click();
    }

    // Click Fiat Conversion in sidebar
    await page.locator('aside nav').getByText('Fiat Conversion').click();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/fiat-conversion');
    await expect(page.getByRole('heading', { name: 'Fiat Conversion' })).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('page has no unexpected console errors on load', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !isExpectedError(msg.text())) consoleErrors.push(msg.text());
    });

    await page.goto('/fiat-conversion');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/fiat-conversion');

    expect(consoleErrors).toHaveLength(0);
  });
});
