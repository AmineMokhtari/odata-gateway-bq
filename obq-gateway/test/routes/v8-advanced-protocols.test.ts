import { test } from 'node:test'
import * as assert from 'node:assert'
import { Readable } from 'node:stream'
import { build } from '../helper.js'
import { generateKeyPair, SignJWT, exportJWK } from 'jose'

/**
 * [Epic 8] Integration Test: Advanced OData Protocols
 * Verifies Nested Structs, Aggregations, and Partition Filtering.
 */
test('Epic 8: Advanced OData protocols engine', async (t) => {
  const { publicKey, privateKey } = await generateKeyPair('RS256')
  const jwk = await exportJWK(publicKey)
  
  const issuer = 'http://localhost/'
  const audience = 'test-audience'

  const createToken = async (sub: string, email: string) => {
    return await new SignJWT({ sub, email })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-kid' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(privateKey)
  }

  const originalFetch = globalThis.fetch
  // @ts-ignore
  globalThis.fetch = async (url: any) => {
    const urlStr = String(url)
    if (urlStr.includes('.well-known/openid-configuration')) {
      return { ok: true, status: 200, json: async () => ({ jwks_uri: 'http://localhost/jwks.json' }) }
    }
    if (urlStr.includes('jwks.json')) {
      return { ok: true, status: 200, json: async () => ({ keys: [{ ...jwk, alg: 'RS256', use: 'sig', kid: 'test-kid' }] }) }
    }
    return { ok: false, status: 404 }
  }

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  // Mock BigQuery for advanced queries
  const mockBQ = {
    projectId: 'my-project',
    dataset: (id: string) => ({
      getMetadata: async () => [{ location: 'US' }]
    }),
    createQueryJob: async (options: any) => {
      const sql = options.query
      
      // Simulate successful dry run
      if (options.dryRun) {
        return [{ metadata: { statistics: { totalBytesProcessed: '1024' } } }]
      }

      return [{
        id: 'mock-job-id',
        metadata: { statistics: { totalBytesProcessed: '1024', query: { totalRows: '1' } } },
        getMetadata: async () => [{ statistics: { query: { totalRows: '1' } } }],
        getQueryResultsStream: () => {
          let rows: any[] = []
          const upSql = (sql || '').toUpperCase()
          
          if (upSql.includes('STRUCT') || upSql.includes('DETAILS')) {
            // Expanded result
            rows = [{ id: 1, Category: 'Books', Details: { author: 'Elena', year: 2024 } }]
          } else if (upSql.includes('GROUP BY')) {
            // Aggregated result
            rows = [{ Category: 'Books', Total: 1500 }]
          } else {
            rows = [{ id: 1 }]
          }
          
          return Readable.from(rows)
        }
      }]
    }
  }

  const app = await build(t, {
    getBQClient: () => mockBQ,
    storageService: {
      writeLog: async () => {}
    }
  })

  const projectId = 'my-project'
  const datasetId = 'my_dataset'
  const authorizedToken = await createToken('user1', 'user1@example.com')

  // 1. Verify $expand with Nested $select (Story 8.2)
  await t.test('[Story 8.2] should support nested column selection via $expand', async () => {
    // Seed cache with relationship metadata
    app.metadataCache.set(`${projectId}:${datasetId}`, {
      projectId, datasetId, location: 'US',
      tables: [{ 
        name: 'Products', 
        columns: [{ name: 'id', type: 'INT64', isNullable: false }],
        relationships: [{
          name: 'Details',
          referencedTable: 'ProductDetails',
          referencedColumn: 'prod_id',
          column: 'id',
          type: 'TO_ONE'
        }]
      }]
    })

    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}/Products?$expand=Details($select=author,year)`,
      headers: { authorization: `Bearer ${authorizedToken}` }
    })

    assert.equal(res.statusCode, 200)
    const body = res.json()
    assert.deepEqual(body.value[0].Details, { author: 'Elena', year: 2024 })
  })

  // 2. Verify $apply Aggregations (Story 8.4)
  await t.test('[Story 8.4] should support groupby and aggregations via $apply', async () => {
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}/Products?$apply=groupby((Category),aggregate(Amount with sum as Total))`,
      headers: { authorization: `Bearer ${authorizedToken}` }
    })

    assert.equal(res.statusCode, 200)
    const body = res.json()
    assert.equal(body.value[0].Category, 'Books')
    assert.equal(body.value[0].Total, 1500)
  })

  // 3. Verify Partition Filter Enforcement (Story 8.5)
  await t.test('[Story 8.5] should block queries missing mandatory partition filters', async () => {
    // Seed cache with partition metadata
    app.metadataCache.set(`${projectId}:${datasetId}`, {
      projectId, datasetId, location: 'US',
      tables: [{ 
        name: 'Logs', 
        columns: [{ name: 'event_date', type: 'DATE', isNullable: false }],
        requiresPartitionFilter: true,
        partitionColumn: 'event_date',
        relationships: []
      }]
    })

    // Fail case: No filter
    const failRes = await app.inject({
      url: `/v1/${projectId}/${datasetId}/Logs`,
      headers: { authorization: `Bearer ${authorizedToken}` }
    })
    assert.equal(failRes.statusCode, 400)
    assert.equal(failRes.json().error.code, 'PARTITION_FILTER_REQUIRED')

    // Success case: With filter
    const successRes = await app.inject({
      url: `/v1/${projectId}/${datasetId}/Logs?$filter=event_date eq '2026-04-27'`,
      headers: { authorization: `Bearer ${authorizedToken}` }
    })
    assert.equal(successRes.statusCode, 200)
  })
})
