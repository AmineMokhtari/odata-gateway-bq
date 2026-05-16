import fp from 'fastify-plugin'

export interface ElenaTip {
  message: string
  quick_fixes?: Array<{ label: string, action: string }>
  action?: string
}

/**
 * Elena's Tips Plugin
 * Centralized error decoration for actionable guidance.
 */
export default fp(async (fastify) => {
  // Mock logic for ATDD testing (Story 6.1 Pivot)
  fastify.addHook('onRequest', async (request, reply) => {
    const mockError = request.headers['x-mock-error']
    if (mockError === 'BudgetExceeded') {
      const err = new Error('Mock Budget Exceeded')
      ;(err as any).code = 'BudgetExceeded'
      ;(err as any).statusCode = 403
      throw err
    } else if (mockError === 'Unauthorized') {
      const err = new Error('Mock Unauthorized')
      ;(err as any).code = 'Unauthorized'
      ;(err as any).statusCode = 401
      throw err
    }
  })

  // Global Error Decoration via onSend (catches both thrown and manual errors)
  fastify.addHook('onSend', async (request, reply, payload) => {
    if (reply.statusCode >= 400 && typeof payload === 'string') {
      const contentType = reply.getHeader('content-type')?.toString() || ''
      if (contentType.includes('application/json')) {
        try {
          const body = JSON.parse(payload)
          
          // Detect error identifiers
          const code = body.code || (body.error && typeof body.error === 'object' ? body.error.code : '') || ''
          const message = body.message || (body.error && typeof body.error === 'object' ? body.error.message : '') || ''
          const statusCode = reply.statusCode

          console.log(`[ElenaTips] Processing error: ${statusCode} ${code} ${message}`)

          // Skip if tip already exists
          if (body.elena_tip || (body.error && body.error.elena_tip)) {
            console.log(`[ElenaTips] Tip already exists, skipping`)
            return payload
          }

          let elenaTip = null

          if (statusCode === 403 || code === 'BudgetExceeded' || message.includes('BudgetExceeded')) {
            elenaTip = {
              message: 'Query too large for current budget. Elena suggests selecting fewer columns or adding a date filter.',
              quick_fixes: [
                { label: 'Select fewer columns', action: 'SELECT_COLUMNS' },
                { label: 'Add Date filter (Last 7 Days)', action: 'FILTER_DATE_7' }
              ]
            }
          } else if (statusCode === 401 || code === 'Unauthorized' || message.includes('Unauthorized')) {
            elenaTip = {
              message: 'Session expired. Elena suggests refreshing your session.',
              action: 'REFRESH_SESSION'
            }
          } else if (statusCode >= 500) {
            elenaTip = {
              message: 'Something went wrong on the server. Elena suggests trying again in a few minutes.',
              action: 'RETRY'
            }
          }

          if (elenaTip) {
            // Ensure OData-compliant error structure (Story 6.1 Pivot consistency)
            if (!body.error || typeof body.error !== 'object') {
              const oldError = body.error // Could be string like "Forbidden"
              body.error = {
                code: code || (statusCode === 403 ? 'BudgetExceeded' : statusCode === 401 ? 'Unauthorized' : 'Error'),
                message: message || oldError || 'An unexpected error occurred',
                elena_tip: elenaTip
              }
              // Optional: remove top-level duplicates if desired, but keeping for compatibility
            } else {
              body.error.elena_tip = elenaTip
              if (code && !body.error.code) body.error.code = code
            }
            return JSON.stringify(body)
          }
        } catch (e) {
          // Payload is not JSON or malformed - wrap it to prevent browser syntax errors (Story 6.1 Pivot Stability)
          console.log(`[ElenaTips] Wrapping non-JSON payload: ${payload}`)
          const wrapped = {
            error: {
              code: statusCode === 403 ? 'BudgetExceeded' : statusCode === 401 ? 'Unauthorized' : 'ServerError',
              message: payload,
              elena_tip: statusCode === 403 ? {
                message: 'Query too large for current budget. Elena suggests selecting fewer columns.',
                quick_fixes: [{ label: 'Select fewer columns', action: 'SELECT_COLUMNS' }]
              } : null
            }
          }
          return JSON.stringify(wrapped)
        }
      }
    }
    return payload
  })
}, {
  name: 'elena-tips'
})
