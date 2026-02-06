import { test, expect } from '@playwright/test';

test.describe('12 - Transaction History', () => {
  test('page loads at correct route', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/transaction-history');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/transaction-history');

    await page.screenshot({ path: 'tests/e2e/screenshots/12-transaction-history-initial.png' });

    expect(consoleErrors).toHaveLength(0);
  });

  test('page title and description displayed', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/transaction-history');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Transaction History' })).toBeVisible();
    await expect(page.getByText('View and filter your Lightning transaction history with detailed information.')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('Alice and Bob wallet cards present', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/transaction-history');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('wallet-card-alice')).toBeVisible();
    await expect(page.getByTestId('wallet-card-bob')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('wallet cards show connection forms when disconnected', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/transaction-history');
    await page.waitForLoadState('networkidle');

    const aliceCard = page.getByTestId('wallet-card-alice');
    const bobCard = page.getByTestId('wallet-card-bob');

    await expect(aliceCard.getByText('NWC Connection String')).toBeVisible();
    await expect(aliceCard.getByText('Connect Wallet')).toBeVisible();

    await expect(bobCard.getByText('NWC Connection String')).toBeVisible();
    await expect(bobCard.getByText('Connect Wallet')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('wallet cards display disconnected status badges', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/transaction-history');
    await page.waitForLoadState('networkidle');

    const disconnectedBadges = page.getByText('Disconnected');
    await expect(disconnectedBadges.first()).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('transaction log section is present', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/transaction-history');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Transaction Log')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('transaction list not shown when wallets disconnected', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/transaction-history');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('alice-filter')).not.toBeVisible();
    await expect(page.getByTestId('bob-filter')).not.toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('no transaction details panel shown initially', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/transaction-history');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('transaction-details')).not.toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('scenario content not shown when disconnected', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/transaction-history');
    await page.waitForLoadState('networkidle');

    // TransactionList components should not be visible when disconnected
    await expect(page.getByTestId('alice-filter')).not.toBeVisible();
    await expect(page.getByTestId('bob-filter')).not.toBeVisible();
    await expect(page.getByTestId('transaction-details')).not.toBeVisible();

    await page.screenshot({ path: 'tests/e2e/screenshots/12-transaction-history-form.png' });

    expect(consoleErrors).toHaveLength(0);
  });

  test('navigating from sidebar works', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Start from a different page
    await page.goto('/simple-payment');
    await page.waitForLoadState('networkidle');

    // On mobile viewports the sidebar is hidden; open it via the menu button
    const menuButton = page.getByLabel('Open menu');
    if (await menuButton.isVisible()) {
      await menuButton.click();
    }

    // Click Transaction History in sidebar
    await page.locator('aside nav').getByText('Transaction History').click();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/transaction-history');
    await expect(page.getByRole('heading', { name: 'Transaction History' })).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });
});
