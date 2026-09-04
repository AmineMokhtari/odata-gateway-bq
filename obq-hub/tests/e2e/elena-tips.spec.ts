/*
Copyright 2026 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import { test, expect } from '@playwright/test';

test.describe('Elena Tips E2E Journey (ATDD)', () => {
  test('[P1] should apply a quick fix from Elena Drawer when budget is exceeded', async ({ page }) => {
    test.setTimeout(60000);

    // 1. Navigate to the builder
    await page.goto('/web/builder');

    // 2. Select Project
    await page.getByText('Select Project', { exact: true }).click();
    await page.getByRole('option', { name: 'governed-project' }).click();

    // 3. Select Dataset (this triggers the fetch)
    await page.getByText('Select Dataset', { exact: true }).click();
    await page.getByRole('option', { name: 'blocked-dataset' }).click();

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

    // 4. Apply Quick Fix (e.g., 'Select fewer columns')
    await drawer.getByRole('button', { name: /Select fewer columns/i }).click();

    // 5. Verify the drawer closes or some action happens (depending on implementation)
    // For now, just ensure it received the click
    await expect(drawer).not.toBeVisible();
  });
});
