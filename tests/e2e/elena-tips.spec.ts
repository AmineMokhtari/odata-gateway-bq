import { test, expect } from '@playwright/test';

test.describe('Elena Tips E2E Journey (ATDD)', () => {
  test('[P1] should apply a quick fix from Elena Drawer when budget is exceeded', async ({ page }) => {
    // Mock the backend response to simulate 403 BudgetExceeded
    await page.route('**/v1/dev-env-mokhtari/aperio_ds_001', async route => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'BudgetExceeded',
            message: 'Mock Budget Exceeded',
            elena_tip: {
              message: 'Query too large for current budget. Elena suggests selecting fewer columns or adding a date filter.',
              quick_fixes: [
                { label: 'Select fewer columns', action: 'SELECT_COLUMNS' },
                { label: 'Add Date filter (Last 7 Days)', action: 'FILTER_DATE_7' }
              ]
            }
          }
        })
      });
    });

    // 1. Navigate to the marketplace
    await page.goto('/marketplace');

    // 2. Select Project
    await page.getByText('Select Project').click();
    await page.getByRole('option', { name: 'dev-env-mokhtari' }).click();

    // 3. Select Dataset (this triggers the fetch)
    await page.getByText('Select Dataset').click();
    await page.getByRole('option', { name: 'aperio_ds_001' }).click();

    // 2. Verify Pulse Badge shows Blocked (Red)
    const pulseBadge = page.getByTestId('pulse-badge');
    await expect(pulseBadge).toHaveAttribute('data-state', 'blocked', { timeout: 10000 });

    // 3. Open Elena Drawer
    await pulseBadge.click();
    const drawer = page.getByRole('dialog', { name: /Elena's Tips/i });
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('Query too large');

    // 4. Apply Quick Fix (e.g., 'Select fewer columns')
    await drawer.getByRole('button', { name: 'Select fewer columns' }).click();

    // 5. Verify the drawer closes or some action happens (depending on implementation)
    // For now, just ensure it received the click
    await expect(drawer).not.toBeVisible();
  });
});
