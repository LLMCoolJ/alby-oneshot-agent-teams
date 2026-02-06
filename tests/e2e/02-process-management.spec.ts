import { test, expect } from '@playwright/test';

test.describe('Process Management - Smoke Test', () => {
  test('app loads correctly after process management changes', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');

    // Verify the page loads with the expected heading
    await expect(page.locator('h1')).toHaveText('Lightning Wallet Demo');

    // Verify the root element rendered
    await expect(page.locator('#root')).not.toBeEmpty();

    // Take screenshot to confirm no regressions
    await page.screenshot({ path: 'tests/e2e/screenshots/02-process-management-smoke.png' });

    // Verify no console errors
    expect(consoleErrors).toHaveLength(0);
  });
});
