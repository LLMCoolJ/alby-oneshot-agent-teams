import { test, expect } from '@playwright/test';

test.describe('Project Setup - Smoke Test', () => {
  test('app loads and renders without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');

    // Verify the page loads with the expected heading
    await expect(page.locator('h1')).toHaveText('Lightning Wallet Demo');

    // Verify the root element rendered
    await expect(page.locator('#root')).not.toBeEmpty();

    // Take screenshot of initial page load
    await page.screenshot({ path: 'tests/e2e/screenshots/01-project-setup-initial.png' });

    // Verify no console errors
    expect(consoleErrors).toHaveLength(0);
  });
});
