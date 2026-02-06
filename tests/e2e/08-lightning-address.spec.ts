import { test, expect } from '@playwright/test';

test.describe('08 - Lightning Address Payment', () => {
  test('page loads at /lightning-address route', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/lightning-address');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/lightning-address');

    await page.screenshot({ path: 'tests/e2e/screenshots/08-lightning-address-initial.png' });

    expect(consoleErrors).toHaveLength(0);
  });

  test('page title and description are displayed', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/lightning-address');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Lightning Address Payment' })).toBeVisible();
    await expect(page.getByText('Pay to a Lightning Address (like email) without needing an invoice.')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('Alice and Bob wallet cards are present', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/lightning-address');
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

    await page.goto('/lightning-address');
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

    await page.goto('/lightning-address');
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

    await page.goto('/lightning-address');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Transaction Log')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('navigating to page from sidebar works', async ({ page }) => {
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

    // Click Lightning Address in sidebar
    await page.locator('aside nav').getByText('Lightning Address').click();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/lightning-address');
    await expect(page.getByRole('heading', { name: 'Lightning Address Payment' })).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('lightning address sidebar link is highlighted as active', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/lightning-address');
    await page.waitForLoadState('networkidle');

    const lightningAddressLink = page.locator('aside nav a[href="/lightning-address"]');
    await expect(lightningAddressLink).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('scenario content is not shown when wallets are disconnected', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/lightning-address');
    await page.waitForLoadState('networkidle');

    // The PayToAddressForm and LightningAddressDisplay should not be visible
    // because wallets are not connected
    await expect(page.getByTestId('address-input')).not.toBeVisible();
    await expect(page.getByTestId('address-display')).not.toBeVisible();
    await expect(page.getByTestId('submit-button')).not.toBeVisible();

    await page.screenshot({ path: 'tests/e2e/screenshots/08-lightning-address-form-filled.png' });

    expect(consoleErrors).toHaveLength(0);
  });
});
