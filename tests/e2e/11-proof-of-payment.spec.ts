import { test, expect } from '@playwright/test';

test.describe('11 - Proof of Payment', () => {
  test('page loads at correct route', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/proof-of-payment');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/proof-of-payment');

    await page.screenshot({ path: 'tests/e2e/screenshots/11-proof-of-payment-initial.png' });

    expect(consoleErrors).toHaveLength(0);
  });

  test('page title and description displayed', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/proof-of-payment');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Proof of Payment' })).toBeVisible();
    await expect(page.getByText('Alice pays Bob and receives a preimage that cryptographically proves the payment was made.')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('Alice and Bob wallet cards present', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/proof-of-payment');
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

    await page.goto('/proof-of-payment');
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

    await page.goto('/proof-of-payment');
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

    await page.goto('/proof-of-payment');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Transaction Log')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('preimage verification section is displayed', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/proof-of-payment');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Preimage Verification' })).toBeVisible();
    await expect(page.getByTestId('manual-verify-toggle')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('why this matters educational section is displayed', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/proof-of-payment');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Why This Matters')).toBeVisible();
    await expect(page.getByText('The preimage is revealed only when payment succeeds')).toBeVisible();
    await expect(page.getByText('It\'s cryptographically impossible to guess the preimage')).toBeVisible();
    await expect(page.getByText('Anyone can verify the proof without trusting Alice or Bob')).toBeVisible();
    await expect(page.getByText('Used in atomic swaps, escrow, and dispute resolution')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('scenario content not shown when wallets are disconnected', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/proof-of-payment');
    await page.waitForLoadState('networkidle');

    // InvoiceCreator (Bob's side) should not be visible when disconnected
    await expect(page.getByTestId('create-invoice')).not.toBeVisible();

    // PayAndProve (Alice's side) should not be visible when disconnected
    await expect(page.getByTestId('pay-invoice')).not.toBeVisible();

    await page.screenshot({ path: 'tests/e2e/screenshots/11-proof-of-payment-form.png' });

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

    // Click Proof of Payment in sidebar
    await page.locator('aside nav').getByText('Proof of Payment').click();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/proof-of-payment');
    await expect(page.getByRole('heading', { name: 'Proof of Payment' })).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });
});
