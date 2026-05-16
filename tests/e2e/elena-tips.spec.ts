import { test, expect } from '@playwright/test';

test.describe('Elena Tips E2E Journey (ATDD)', () => {
  test('[P1] should apply a quick fix from Elena Drawer when budget is exceeded', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    const projectId = 'dev-env-mokhtari';
    const datasetId = 'aperio_ds_001';

    // Mock the backend response to simulate 403 BudgetExceeded
    // The builder fetches from /web/api/gateway/v1/...
    await page.route('**/web/api/gateway/v1/**', async route => {
      console.log('E2E-MOCK: Intercepted request to', route.request().url());
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

    // 1. Navigate directly to the builder
    await page.goto(`/catalog/${projectId}/${datasetId}/builder`);

    // 2. Verify Pulse Badge shows Blocked (Red)
    const pulseBadge = page.getByTestId('pulse-badge');
    await expect(pulseBadge).toHaveAttribute('data-state', 'blocked', { timeout: 15000 });

    // 3. Open Elena Drawer
    await pulseBadge.click();
    // The title in ElenaDrawer.tsx is "Elena's Advice" or "Elena's Tips" depending on activeTip.title
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('Elena');
    await expect(drawer).toContainText('Query too large');

    // 4. Apply Quick Fix (e.g., 'Select fewer columns')
    await drawer.getByRole('button', { name: 'Select fewer columns' }).click();

    // 5. Verify the drawer closes
    await expect(drawer).not.toBeVisible();
  });
});
