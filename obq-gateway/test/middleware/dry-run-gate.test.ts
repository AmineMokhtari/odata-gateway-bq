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
