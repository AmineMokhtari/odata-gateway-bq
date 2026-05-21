import { test, expect } from '@playwright/test';

test.describe('OData URL Builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/web/builder');
  });

  test('should allow selecting project and dataset and generating URL', async ({ page }) => {
    // 1. Verify initial state
    const urlInput = page.locator('input[readonly]');
    await expect(urlInput).toHaveValue('');

    // 2. Select Project
    await page.getByLabel('GCP Project').click();
    await page.getByRole('option', { name: 'my-project' }).click();

    // 3. Select Dataset
    await page.getByLabel('BigQuery Dataset').click();
    await page.getByRole('option', { name: 'my_dataset' }).click();

    // 4. Verify URL is generated
    // The default gateway URL is http://localhost:3001, but in development it can be http://127.0.0.1:3005
    await expect(urlInput).toHaveValue(/http:\/\/(localhost|127\.0\.0\.1):(3001|3005)\/v1\/my-project\/my_dataset/, { timeout: 8000 });

    // 5. Check "Ready to Connect" badge
    await expect(page.getByText('Ready to Connect')).toBeVisible({ timeout: 8000 });

    // 6. Test Copy button
    const copyButton = page.getByRole('button').filter({ has: page.locator('svg.lucide-copy') });
    await copyButton.click();
    
    // Check for success toast
    await expect(page.getByText('OData URL copied to clipboard!')).toBeVisible();
  });
});

test.describe('Hero Section', () => {
  test('should navigate to catalog from home page', async ({ page }) => {
    await page.goto('/');
    
    const connectButton = page.getByRole('link', { name: /Deploy for Free/i });
    await expect(connectButton).toBeVisible();
    
    await connectButton.click();
    await expect(page).toHaveURL(/\/catalog/);
  });
});
