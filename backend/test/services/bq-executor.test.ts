import { test } from 'node:test'
import * as assert from 'node:assert'
import { createBigQueryStream, sanitizeLabelValue, performDryRun } from '../../src/services/bq-executor.js'

test('BQ Executor Audit Labels', async (t) => {
  
  await t.test('sanitizeLabelValue', () => {
    assert.equal(sanitizeLabelValue('User@Example.com'), 'user_example_com')
    assert.equal(sanitizeLabelValue('123-abc'), 'v_123-abc')
    assert.equal(sanitizeLabelValue('a'.repeat(100)), 'a'.repeat(63))
    assert.equal(sanitizeLabelValue('valid-label_123'), 'valid-label_123')
  })

  await t.test('should create query stream with audit labels', async (t) => {
    let capturedOptions: any
    const mockJob = { 
      id: 'job-123',
      getQueryResultsStream: () => ({ on: () => {} }) 
    }
    const mockBq: any = {
      createQueryJob: async (options: any) => {
        capturedOptions = options
        return [mockJob]
      }
    }

    const { stream, job } = await createBigQueryStream(
      mockBq,
      'SELECT * FROM `table`',
      'user@example.com',
      'req-123',
      {},
      'US'
    )

    assert.equal(capturedOptions.query, 'SELECT * FROM `table`')
    assert.equal(capturedOptions.labels.user_identity, 'user_example_com')
    assert.equal(capturedOptions.labels.correlation_id, 'req-123')
    assert.ok(stream)
    assert.equal(job.id, 'job-123')
  })

  await t.test('should perform dry run with audit labels', async (t) => {
    let capturedOptions: any
    const mockBq: any = {
      createQueryJob: async (options: any) => {
        capturedOptions = options
        return [{
          metadata: {
            statistics: {
              totalBytesProcessed: '500'
            }
          }
        }]
      }
    }

    const estimate = await performDryRun(
      mockBq,
      'SELECT * FROM `table`',
      'dry-run@example.com',
      'audit-456',
      {},
      'EU'
    )

    assert.equal(estimate, 500)
    assert.equal(capturedOptions.dryRun, true)
    assert.equal(capturedOptions.location, 'EU')
    assert.equal(capturedOptions.labels.user_identity, 'dry-run_example_com')
    assert.equal(capturedOptions.labels.correlation_id, 'audit-456')
  })
})
