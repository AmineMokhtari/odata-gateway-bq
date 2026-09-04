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

test.describe('Elena Tips API Error Decoration (ATDD)', () => {
  test('[P0] should decorate 403 BudgetExceeded with elena_tip', async ({ request }) => {
    // THIS TEST WILL FAIL - Elena plugin implemented but might need handler integration
    const response = await request.get('/v1/project-id/dataset_id/Entities', {
      headers: {
        'Authorization': 'Bearer valid-token',
        'x-mock-error': 'BudgetExceeded' // Hypothetical mock header for testability
      }
    });

    expect(response.status()).toBe(403);
    const body = await response.json();

    expect(body.error).toMatchObject({
      code: 'BudgetExceeded',
      elena_tip: {
        message: expect.stringContaining('Query too large'),
        quick_fixes: expect.arrayContaining([
          expect.objectContaining({ label: expect.stringContaining('columns') }),
          expect.objectContaining({ label: expect.stringContaining('filter') })
        ])
      }
    });
  });

  test('[P1] should decorate 401 Unauthorized with session-refresh advice', async ({ request }) => {
    // THIS TEST WILL FAIL - Elena plugin implemented
    const response = await request.get('/v1/project-id/dataset_id/Entities', {
      headers: {
        'Authorization': 'Bearer expired-token',
        'x-mock-error': 'Unauthorized'
      }
    });

    expect(response.status()).toBe(401);
    const body = await response.json();

    expect(body.error).toMatchObject({
      code: 'Unauthorized',
      elena_tip: {
        message: expect.stringContaining('Session expired'),
        action: 'REFRESH_SESSION'
      }
    });
  });
});
