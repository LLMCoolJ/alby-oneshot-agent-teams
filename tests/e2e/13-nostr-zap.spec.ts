import { test, expect } from '@playwright/test';

test.describe('13 - Nostr Zap', () => {
  test('page loads at correct route', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/nostr-zap');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/nostr-zap');

    await page.screenshot({ path: 'tests/e2e/screenshots/13-nostr-zap-initial.png' });

    expect(consoleErrors).toHaveLength(0);
  });

  test('page title and description displayed', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/nostr-zap');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Nostr Zap' })).toBeVisible();
    await expect(page.getByText('Alice zaps Bob\'s Nostr note with a Lightning payment. Zaps are social tips with cryptographic proof.')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('Alice and Bob wallet cards present', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/nostr-zap');
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

    await page.goto('/nostr-zap');
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

    await page.goto('/nostr-zap');
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

    await page.goto('/nostr-zap');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Transaction Log')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('how zaps work educational section displayed', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/nostr-zap');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('How Zaps Work')).toBeVisible();
    await expect(page.getByText('Zap Request (kind 9734)')).toBeVisible();
    await expect(page.getByText('Zap Receipt (kind 9735)')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('zap form not shown when wallets disconnected', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/nostr-zap');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('zap-form')).not.toBeVisible();
    await expect(page.getByTestId('mock-note')).not.toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('scenario content not shown when disconnected', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/nostr-zap');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('zap-form')).not.toBeVisible();
    await expect(page.getByTestId('mock-note')).not.toBeVisible();

    await page.screenshot({ path: 'tests/e2e/screenshots/13-nostr-zap-form.png' });

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

    // Click Nostr Zap in sidebar
    await page.locator('aside nav').getByText('Nostr Zap').click();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/nostr-zap');
    await expect(page.getByRole('heading', { name: 'Nostr Zap' })).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });
});
