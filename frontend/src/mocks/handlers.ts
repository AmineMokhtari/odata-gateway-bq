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
