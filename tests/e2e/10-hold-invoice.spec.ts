import { test, expect } from '@playwright/test';

test.describe('10 - Hold Invoice (Escrow)', () => {
  test('page loads at /hold-invoice route', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/hold-invoice');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/hold-invoice');

    await page.screenshot({ path: 'tests/e2e/screenshots/10-hold-invoice-initial.png' });

    expect(consoleErrors).toHaveLength(0);
  });

  test('page title and description are displayed', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/hold-invoice');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Hold Invoice (Escrow)' })).toBeVisible();
    await expect(page.getByText('Conditional payments using hold invoices. Alice\'s payment is locked until Bob settles or cancels.')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('Alice and Bob wallet cards are present', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/hold-invoice');
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

    await page.goto('/hold-invoice');
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

    await page.goto('/hold-invoice');
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

    await page.goto('/hold-invoice');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Transaction Log')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('how hold invoices work explainer section is displayed', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/hold-invoice');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'How Hold Invoices Work' })).toBeVisible();
    await expect(page.getByText('Bob generates a preimage and its hash.')).toBeVisible();
    await expect(page.getByText('Alice pays, but funds are locked.')).toBeVisible();
    await expect(page.getByText('Bob reveals preimage to receive funds, or cancels to refund Alice.')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('scenario content is not shown when wallets are disconnected', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/hold-invoice');
    await page.waitForLoadState('networkidle');

    // CreateHoldInvoice form should not be visible when Bob is disconnected
    await expect(page.getByTestId('create-hold-invoice-form')).not.toBeVisible();
    await expect(page.getByTestId('create-hold-invoice-button')).not.toBeVisible();

    // PayHoldInvoice should not be visible when Alice is disconnected
    await expect(page.getByTestId('pay-hold-invoice-button')).not.toBeVisible();
    await expect(page.getByTestId('pay-hold-invoice-input')).not.toBeVisible();

    await page.screenshot({ path: 'tests/e2e/screenshots/10-hold-invoice-form.png' });

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

    // Click Hold Invoice in sidebar
    await page.locator('aside nav').getByText('Hold Invoice').click();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/hold-invoice');
    await expect(page.getByRole('heading', { name: 'Hold Invoice (Escrow)' })).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('hold invoice sidebar link is highlighted as active', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/hold-invoice');
    await page.waitForLoadState('networkidle');

    const holdInvoiceLink = page.locator('aside nav a[href="/hold-invoice"]');
    await expect(holdInvoiceLink).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });
});
