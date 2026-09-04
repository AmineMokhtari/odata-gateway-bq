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
/**
 * Shared test data for ATDD scenarios.
 */
export const testUserData = {
  email: 'test@example.com',
  password: 'SecurePass123!',
};

export const mockElenaTips = {
  budgetExceeded: {
    message: 'Query too large for current budget.',
    quick_fixes: [
      { label: 'Select fewer columns', action: 'SELECT_COLUMNS' },
      { label: 'Add Date filter (Last 7 Days)', action: 'FILTER_DATE_7' }
    ]
  },
  unauthorized: {
    message: 'Session expired. Please refresh.',
    action: 'REFRESH_SESSION'
  }
};
