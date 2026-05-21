import { test, expect } from '@playwright/test';

test.describe('Epic 13: Accessibility and Inclusive Interaction', () => {
  // Run tests sequentially to prevent UI drop-down race conditions
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/web/builder');
  });

  test('should verify canvas hiding and high-visibility skip link', async ({ page }) => {
    // 1. Verify skip-link is present in DOM and has correct target
    const skipLink = page.locator('a[href="#query-summary-sidebar"]');
    await expect(skipLink).toBeAttached();
    await expect(skipLink).toContainText('Skip to Query Summary Sidebar');

    // 2. Select Project and Dataset to reveal the interactive query builder
    await page.getByLabel('GCP Project').click();
    await page.getByRole('option', { name: 'my-project' }).click();

    await page.getByLabel('BigQuery Dataset').click();
    await page.getByRole('option', { name: 'my_dataset' }).click();

    // Select root table to render interactive canvas and sidebar
    await page.getByLabel('Primary Table').click();
    await expect(page.getByRole('option', { name: 'Customers' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('option', { name: 'Customers' }).click();

    // 3. Verify visual canvas has aria-hidden="true" to shield from screen readers
    const canvasContainer = page.locator('div[aria-hidden="true"]').first();
    await expect(canvasContainer).toBeVisible();

    // 4. Verify Query Summary Sidebar is rendered with correct id and focusability
    const sidebar = page.locator('#query-summary-sidebar');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator('h3')).toContainText('Query Summary');

    // 5. Verify screen reader aria-live polite region is present
    const liveAnnouncer = page.locator('div[aria-live="polite"]');
    await expect(liveAnnouncer).toBeAttached();

    // 6. Focus the skip link programmatically to simulate keyboard tab targeting it
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    
    // Activate skip link using keyboard Enter
    await page.keyboard.press('Enter');
    
    // Verify focus shifts directly to the Query Summary Sidebar
    await expect(sidebar).toBeFocused();
  });

  test('should verify alternative builder interactions and aria-live announcements', async ({ page }) => {
    // Select Project, Dataset, and Root Table
    await page.getByLabel('GCP Project').click();
    await page.getByRole('option', { name: 'my-project' }).click();

    await page.getByLabel('BigQuery Dataset').click();
    await page.getByRole('option', { name: 'my_dataset' }).click();

    await page.getByLabel('Primary Table').click();
    await expect(page.getByRole('option', { name: 'Customers' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('option', { name: 'Customers' }).click();

    // Verify initial table selection announcement in aria-live region
    const liveAnnouncer = page.locator('div[aria-live="polite"]');
    await expect(liveAnnouncer).toContainText(/Query updated for primary table Customers/i, { timeout: 10000 });

    // 1. Verify and test columns addition for root table Customers
    const selectColumn = page.locator('#add-column-select');
    await expect(selectColumn).toBeVisible();
    // Select column id
    await selectColumn.selectOption('id');
    // Verify column tag is visible inside selected columns
    const sidebar = page.locator('#query-summary-sidebar');
    await expect(sidebar.locator('button', { hasText: 'id' })).toBeVisible();
    // Verify aria-live announcement reflects column selection
    await expect(liveAnnouncer).toContainText(/selected column id on Customers table/i);

    // 2. Verify adding a join from the standard dropdown select menu (alternative builder)
    const selectJoin = page.locator('#add-join-select');
    await expect(selectJoin).toBeVisible();

    // Select "Orders" relationship to add automatic join
    await selectJoin.selectOption('Orders');

    // Verify that the relationship Orders is added to the active summary list
    await expect(sidebar.locator('span', { hasText: 'Orders' })).toBeVisible();

    // Verify live announcement is updated dynamically
    await expect(liveAnnouncer).toContainText(/added Orders expansion/i);

    // 3. Select columns for the expanded table Orders
    const selectOrdersColumn = page.locator('#add-column-select-Orders');
    await expect(selectOrdersColumn).toBeVisible();
    await selectOrdersColumn.selectOption('order_id');

    // Verify that order_id button exists in expanded table card
    await expect(sidebar.locator('button', { hasText: 'order_id' })).toBeVisible();
    await expect(liveAnnouncer).toContainText(/selected column order_id on Orders table/i);

    // 4. Remove projected column from the expanded table card via button click
    const removeBtn = sidebar.locator('button', { hasText: 'order_id' });
    await removeBtn.click();

    // Verify button is gone and aria-live announcement is updated
    await expect(removeBtn).not.toBeVisible();
    await expect(liveAnnouncer).toContainText(/unselected column order_id on Orders table/i);
  });

  test('should verify keyboard canvas navigation and focus rings', async ({ page }) => {
    // Select Project, Dataset, and Root Table
    await page.getByLabel('GCP Project').click();
    await page.getByRole('option', { name: 'my-project' }).click();

    await page.getByLabel('BigQuery Dataset').click();
    await page.getByRole('option', { name: 'my_dataset' }).click();

    await page.getByLabel('Primary Table').click();
    await expect(page.getByRole('option', { name: 'Customers' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('option', { name: 'Customers' }).click();

    // Verify root table node exists and is focusable
    const rootNode = page.locator('.react-flow__node[data-id="Customers"]');
    await expect(rootNode).toBeVisible();

    const innerNode = rootNode.locator('div[aria-label^="Table node"]').first();
    await expect(innerNode).toBeVisible();

    // Focus the inner node programmatically to test focus styles
    await innerNode.focus();
    await expect(innerNode).toBeFocused();

    // Verify Customers node is initially selected because it is the active primary table
    await expect(innerNode).toHaveClass(/border-primary/);

    // Press Space to toggle selection off
    await page.keyboard.press('Space');
    await expect(innerNode).not.toHaveClass(/border-primary/);

    // Press Space again to toggle selection back on
    await page.keyboard.press('Space');
    await expect(innerNode).toHaveClass(/border-primary/);
  });
});
