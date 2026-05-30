/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'
import { writeFileSync, readFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

test('Story 12.5: Periodic Schema Validation & Orphan Relationship Pruning', async (t) => {
  const projectId = 'test-project'
  const datasetId = 'test_dataset'
  const testManifestPath = join(process.cwd(), 'obq-gateway', 'config', 'relationships-test.json')

  // Set the environment variable to target our test manifest file
  process.env.RELATIONSHIPS_PATH = testManifestPath

  // Create a relationships-test.json manifest with valid and orphan mappings
  const initialManifest = {
    [`${projectId}:${datasetId}`]: [
      {
        name: 'FK_Customers_Policies',
        table: 'Customers',
        column: 'id',
        referencedTable: 'Policies',
        referencedColumn: 'customer_id',
        type: 'TO_MANY'
      },
      {
        name: 'FK_Customers_GhostTable',
        table: 'Customers',
        column: 'id',
        referencedTable: 'GhostTable',
        referencedColumn: 'customer_id',
        type: 'TO_MANY'
      },
      {
        name: 'FK_Customers_Policies_OrphanCol',
        table: 'Customers',
        column: 'non_existent_col',
        referencedTable: 'Policies',
        referencedColumn: 'customer_id',
        type: 'TO_MANY'
      }
    ]
  }

  writeFileSync(testManifestPath, JSON.stringify(initialManifest, null, 2), 'utf8')

  t.after(() => {
    try {
      unlinkSync(testManifestPath)
    } catch (_) {}
    delete process.env.RELATIONSHIPS_PATH
  })

  // Mock BigQuery client to simulate existing tables and columns
  const mockBq = {
    projectId,
    dataset: () => ({
      getMetadata: async () => [{ location: 'US' }]
    }),
    query: async (options: any) => {
      const sql = options.query.toLowerCase()
      if (sql.includes('information_schema.tables')) {
        return [[
          { table_name: 'Customers', description: 'Customer Table' },
          { table_name: 'Policies', description: 'Policies Table' }
        ]]
      }
      if (sql.includes('information_schema.columns')) {
        return [[
          { table_name: 'Customers', column_name: 'id', data_type: 'INT64', is_nullable: 'NO' },
          { table_name: 'Policies', column_name: 'policy_id', data_type: 'INT64', is_nullable: 'NO' },
          { table_name: 'Policies', column_name: 'customer_id', data_type: 'INT64', is_nullable: 'NO' }
        ]]
      }
      return [[]]
    },
    createQueryJob: async (opts?: any) => {
      const { Readable } = await import('node:stream')
      return [{
        id: 'mock-job-id',
        metadata: { statistics: { totalBytesProcessed: '1024', query: { totalRows: '1' } } },
        getMetadata: async () => [{ statistics: { query: { totalRows: '1' } } }],
        getQueryResultsStream: () => new Readable({ objectMode: true, read() { this.push({ id: 1 }); this.push(null) } }),
        cancel: async () => {}
      }]
    }
  }

  const app = await build(t, {
    getBQClient: () => mockBq,
    logger: { level: 'silent' },
    anonymousMode: true
  })

  await t.test('should load and merge manual relationships successfully during introspection', async () => {
    // Populate the cache or trigger getDatasetMetadata
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}/Customers`
    })

    if (res.statusCode !== 200) {
      console.error('FAILED REQUEST PAYLOAD:', res.payload)
    }
    assert.equal(res.statusCode, 200)
    
    // Check cached metadata (must contain manual relationships)
    const cachedMeta = app.metadataCache.get(`${projectId}:${datasetId}`)
    assert.ok(cachedMeta)
    
    const customersTable = cachedMeta.tables.find(t => t.name === 'Customers')
    assert.ok(customersTable)
    assert.equal(customersTable.relationships.length, 3) // Contains all 3 initial relationships before validation
  })

  await t.test('should prune invalid/orphan relationships from manifest and cache on cron-refresh trigger', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/admin/cron-refresh',
      headers: {
        'x-correlation-id': 'test-correlation-12345'
      }
    })

    assert.equal(res.statusCode, 200)
    const body = res.json()
    assert.equal(body.correlationId, 'test-correlation-12345')
    assert.equal(body.prunedAny, true)

    // Check that the manifest file on disk was pruned correctly
    const updatedManifest = JSON.parse(readFileSync(testManifestPath, 'utf8'))
    const datasetRels = updatedManifest[`${projectId}:${datasetId}`]
    assert.equal(datasetRels.length, 1)
    assert.equal(datasetRels[0].name, 'FK_Customers_Policies') // Only the valid one survives!

    // Verify cache eviction
    const isCached = app.metadataCache.has(`${projectId}:${datasetId}`)
    assert.equal(isCached, false) // Evicted!
  })
})
