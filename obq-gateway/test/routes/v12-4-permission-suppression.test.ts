import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'

test('Story 12.4: Dynamic Permission Suppression backend dry-run', async (t) => {
  const projectId = 'test-project'
  const datasetId = 'test_dataset'

  // Build the app with our default configurations
  const app = await build(t, {
    logger: { level: 'silent' }
  })

  // Pre-seed the metadata cache with tables Sales and Billing
  app.metadataCache.set(`${projectId}:${datasetId}`, {
    projectId,
    datasetId,
    location: 'US',
    schemaVersion: 'mock-version-hash-xyz',
    tables: [
      { name: 'Sales', columns: [{ name: 'id', type: 'INT64', isNullable: false }], relationships: [] },
      { name: 'Billing', columns: [{ name: 'id', type: 'INT64', isNullable: false }], relationships: [] }
    ]
  })

  await t.test('should return 403 Forbidden with decorated ELENA_TIP when querying restricted Billing table', async () => {
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}/Billing`,
      headers: {
        'x-forwarded-email': 'elena@example.com',
        'x-forwarded-groups': 'Analyst'
      }
    })

    assert.equal(res.statusCode, 403)
    const body = res.json()
    assert.equal(body.error.code, 'Unauthorized')
    assert.ok(body.error.details, 'Error details should exist')
    
    const elenaTip = body.error.details.find((d: any) => d.code === 'ELENA_TIP')
    assert.ok(elenaTip, 'ELENA_TIP detail must be present')
    assert.match(elenaTip.message, /Billing/, 'Elena Tip message should mention Billing table')
  })

  await t.test('should pass successfully for regular Sales table', async () => {
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}/Sales`,
      headers: {
        'x-forwarded-email': 'elena@example.com',
        'x-forwarded-groups': 'Analyst'
      }
    })

    assert.equal(res.statusCode, 200)
  })
})
