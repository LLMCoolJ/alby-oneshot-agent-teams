import { test, expect } from '@playwright/test';

test.describe('07 - Simple Invoice Payment', () => {
  test('page loads at /simple-payment route', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/simple-payment');
    await page.waitForLoadState('networkidle');

    // Page should load without redirecting away
    expect(page.url()).toContain('/simple-payment');

    await page.screenshot({ path: 'tests/e2e/screenshots/07-simple-payment-initial.png' });

    expect(consoleErrors).toHaveLength(0);
  });

  test('page title and description are displayed', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/simple-payment');
    await page.waitForLoadState('networkidle');

    // Title
    await expect(page.getByRole('heading', { name: 'Simple Invoice Payment' })).toBeVisible();

    // Description
    await expect(page.getByText('Bob creates a BOLT-11 invoice, Alice pays it.')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('Alice and Bob wallet cards are present', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/simple-payment');
    await page.waitForLoadState('networkidle');

    // Both wallet cards should be visible
    await expect(page.getByTestId('wallet-card-alice')).toBeVisible();
    await expect(page.getByTestId('wallet-card-bob')).toBeVisible();

    await page.screenshot({ path: 'tests/e2e/screenshots/07-simple-payment-wallets.png' });

    expect(consoleErrors).toHaveLength(0);
  });

  test('wallet cards show connection forms when disconnected', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/simple-payment');
    await page.waitForLoadState('networkidle');

    // Both wallet cards should contain NWC URL inputs and Connect buttons
    const aliceCard = page.getByTestId('wallet-card-alice');
    const bobCard = page.getByTestId('wallet-card-bob');

    // Alice card should have connect form elements
    await expect(aliceCard.getByText('NWC Connection String')).toBeVisible();
    await expect(aliceCard.getByText('Connect Wallet')).toBeVisible();

    // Bob card should have connect form elements
    await expect(bobCard.getByText('NWC Connection String')).toBeVisible();
    await expect(bobCard.getByText('Connect Wallet')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('wallet cards display disconnected status badges', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/simple-payment');
    await page.waitForLoadState('networkidle');

    // Both should show Disconnected badge
    const disconnectedBadges = page.getByText('Disconnected');
    await expect(disconnectedBadges.first()).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('transaction log section is present', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/simple-payment');
    await page.waitForLoadState('networkidle');

    // Transaction log heading should be visible
    await expect(page.getByText('Transaction Log')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('navigating to page from sidebar works', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Start from a different page
    await page.goto('/lightning-address');
    await page.waitForLoadState('networkidle');

    // On mobile viewports the sidebar is hidden; open it via the menu button
    const menuButton = page.getByLabel('Open menu');
    if (await menuButton.isVisible()) {
      await menuButton.click();
    }

    // Click Simple Payment in sidebar
    await page.locator('aside nav').getByText('Simple Payment').click();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/simple-payment');
    await expect(page.getByRole('heading', { name: 'Simple Invoice Payment' })).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('default route redirects to simple payment page', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Default route should land on simple-payment
    expect(page.url()).toContain('/simple-payment');
    await expect(page.getByRole('heading', { name: 'Simple Invoice Payment' })).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('simple payment sidebar link is highlighted as active', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/simple-payment');
    await page.waitForLoadState('networkidle');

    // The Simple Payment link in sidebar should have active styling
    const simplePaymentLink = page.locator('aside nav a[href="/simple-payment"]');
    await expect(simplePaymentLink).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });
});
