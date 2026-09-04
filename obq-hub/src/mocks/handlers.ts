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
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('*/v1/governed-project/blocked-dataset', () => {
    return HttpResponse.json({
      error: {
        code: 'BudgetExceeded',
        message: 'Query blocked by governance rules',
      },
      elena_tip: {
        message: 'This dataset is under strict budget control. Elena suggests picking only essential columns.',
        quick_fixes: [
          { label: 'Apply Column Filter', action: 'SELECT_COLUMNS' }
        ]
      }
    }, { status: 403 })
  }),
  http.get('*/v1/connection-status/governed-project/blocked-dataset', () => {
    return HttpResponse.json({
      status: 'listening',
      lastActive: null,
      serverTime: Date.now()
    })
  }),
]
