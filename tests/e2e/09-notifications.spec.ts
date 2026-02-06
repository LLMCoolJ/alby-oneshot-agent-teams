import { test, expect } from '@playwright/test';

test.describe('09 - Real-time Payment Notifications', () => {
  test('page loads at /notifications route', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/notifications');

    await page.screenshot({ path: 'tests/e2e/screenshots/09-notifications-initial.png' });

    expect(consoleErrors).toHaveLength(0);
  });

  test('page title and description are displayed', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Real-time Payment Notifications' })).toBeVisible();
    await expect(page.getByText('Bob subscribes to notifications and sees incoming payments in real-time as Alice sends them.')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('Alice and Bob wallet cards are present', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/notifications');
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

    await page.goto('/notifications');
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

    await page.goto('/notifications');
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

    await page.goto('/notifications');
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

    // Click Notifications in sidebar
    await page.locator('aside nav').getByText('Notifications').click();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/notifications');
    await expect(page.getByRole('heading', { name: 'Real-time Payment Notifications' })).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('notifications sidebar link is highlighted as active', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    const notificationsLink = page.locator('aside nav a[href="/notifications"]');
    await expect(notificationsLink).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('scenario content is not shown when wallets are disconnected', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    // The NotificationSubscriber and QuickPayButtons should not be visible
    // because wallets are not connected
    await expect(page.getByTestId('subscribe-button')).not.toBeVisible();
    await expect(page.getByTestId('notification-list')).not.toBeVisible();
    await expect(page.getByTestId('address-input')).not.toBeVisible();
    await expect(page.getByTestId('quick-pay-100')).not.toBeVisible();
    await expect(page.getByTestId('quick-pay-500')).not.toBeVisible();
    await expect(page.getByTestId('quick-pay-1000')).not.toBeVisible();

    await page.screenshot({ path: 'tests/e2e/screenshots/09-notifications-form.png' });

    expect(consoleErrors).toHaveLength(0);
  });
});
