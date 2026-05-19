import { test, expect } from '@playwright/test';

test.describe('Elena Tips E2E Journey (ATDD)', () => {
  test('[P1] should apply a quick fix from Elena Drawer when budget is exceeded', async ({ page }) => {
    test.setTimeout(60000);

    // 1. Navigate to the marketplace
    await page.goto('/web/marketplace');

    // 2. Select Project
    await page.getByText('Select Project', { exact: true }).click();
    await page.getByRole('option', { name: 'governed-project' }).click();

    // 3. Select Dataset (this triggers the fetch)
    const responsePromise = page.waitForResponse(response => response.url().includes('/v1/governed-project/blocked-dataset'));
    await page.getByText('Select Dataset', { exact: true }).click();
    await page.getByRole('option', { name: 'blocked-dataset' }).click();
    await responsePromise;

    // 2. Verify Pulse Badge shows Blocked (Red)
    const pulseBadge = page.getByTestId('pulse-badge');
    await expect(pulseBadge).toHaveAttribute('data-state', 'blocked', { timeout: 10000 });

    // 3. Elena Drawer should open automatically (or click if not)
    const drawer = page.getByRole('dialog', { name: /Elena/i });
    if (!(await drawer.isVisible())) {
      await pulseBadge.click({ force: true });
    }
    await expect(drawer).toBeVisible({ timeout: 10000 });
    await expect(drawer).toContainText('budget', { ignoreCase: true });

    // 4. Apply Quick Fix (e.g., 'Apply Column Filter')
    await drawer.getByRole('button', { name: 'Apply Column Filter' }).click();

    // 5. Verify the drawer closes or some action happens (depending on implementation)
    // For now, just ensure it received the click
    await expect(drawer).not.toBeVisible();
  });
});
