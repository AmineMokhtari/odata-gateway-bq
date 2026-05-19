import { test } from 'node:test'
import * as assert from 'node:assert'
import { validateScanBudget } from '../../src/middleware/audit/dry-run-gate.js'

test('Dry-Run Gate Audit Labels', async (t) => {
  const table = 'p.d.t'
  const sql = 'SELECT * FROM `p.d.t`'

  await t.test('should pass and include labels in dry run', async () => {
    let capturedOptions: any
    const mockBq: any = {
      createQueryJob: async (options: any) => {
        capturedOptions = options
        return [{
          metadata: {
            statistics: {
              totalBytesProcessed: '1024'
            }
          }
        }]
      }
    }

    const estimate = await validateScanBudget({
      bq: mockBq,
      sql,
      budgetBytes: 2048,
      userEmail: 'user@example.com',
      correlationId: 'req-1'
    })

    assert.equal(estimate, 1024)
    assert.equal(capturedOptions.labels.user_identity, 'user_example_com')
    assert.equal(capturedOptions.labels.correlation_id, 'req-1')
  })

  await t.test('should throw error when estimate exceeds budget', async () => {
    const mockBq: any = {
      createQueryJob: async () => [{
        metadata: {
          statistics: {
            totalBytesProcessed: '5000'
          }
        }
      }]
    }

    await assert.rejects(
      () => validateScanBudget({
        bq: mockBq,
        sql,
        budgetBytes: 1000,
        userEmail: 'user@example.com',
        correlationId: 'req-1'
      }),
      (err: any) => {
        assert.equal(err.code, 'BudgetExceeded')
        return true
      }
    )
  })
})
