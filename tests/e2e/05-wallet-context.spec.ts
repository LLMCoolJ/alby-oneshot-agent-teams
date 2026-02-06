import { test, expect } from '@playwright/test';

test.describe('05 - Wallet Context', () => {
  test('app loads without wallet context errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('http://localhost:5741');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/e2e/screenshots/05-wallet-context-load.png' });

    expect(consoleErrors).toHaveLength(0);
  });
});
