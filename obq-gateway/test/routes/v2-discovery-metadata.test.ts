import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'
import { generateKeyPair, SignJWT, exportJWK } from 'jose'

/**
 * [Epic 2] Integration Test: Automated Data Marketplace
 * Verifies Metadata Discovery, Sharded Caching, and OData $metadata Generation.
 */
test('Epic 2: Metadata discovery and marketplace automation', async (t) => {
  const { publicKey, privateKey } = await generateKeyPair('RS256')
  const jwk = await exportJWK(publicKey)
  
  const issuer = 'http://localhost/'
  const audience = 'test-audience'

  const createToken = async (sub: string, email: string, groups: string[] = []) => {
    return await new SignJWT({ sub, email, groups })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-kid' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(privateKey)
  }

  const originalFetch = globalThis.fetch
  globalThis.fetch = (async (url: string | URL | Request) => {
    const urlStr = String(url)
    if (urlStr.includes('.well-known/openid-configuration')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ jwks_uri: 'http://localhost/jwks.json' })
      }
    }
    if (urlStr.includes('jwks.json')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          keys: [{ ...jwk, alg: 'RS256', use: 'sig', kid: 'test-kid' }]
        })
      }
    }
    return { ok: false, status: 404 }
  }) as typeof fetch

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  // Mock BigQuery with INFORMATION_SCHEMA support
  let queryCount = 0
  const mockBQ = {
    projectId: 'my-project',
    dataset: (id: string) => ({
      getMetadata: async () => [{ location: 'US' }]
    }),
    query: async (options: any) => {
      queryCount++
      const sql = options.query.toLowerCase()
      
      if (sql.includes('information_schema.tables')) {
        return [[{ table_name: 'Sales' }, { table_name: 'Products' }]]
      }
      if (sql.includes('information_schema.columns')) {
        return [[
          { table_name: 'Sales', column_name: 'OrderID', data_type: 'INT64', is_nullable: 'NO' },
          { table_name: 'Sales', column_name: 'Amount', data_type: 'FLOAT64', is_nullable: 'YES' },
          { table_name: 'Products', column_name: 'ProductID', data_type: 'INT64', is_nullable: 'NO' }
        ]]
      }
      // Options and Relationships return empty for simplicity
      return [[]]
    }
  }

  const app = await build(t, {
    getBQClient: () => mockBQ
  })

  // Clear metadata cache so [Story 2.2] starts with an empty cache to test live discovery fallback
  app.metadataCache.clear()

  const projectId = 'my-project'
  const datasetId = 'my_dataset'
  const authorizedToken = await createToken('elena1', 'elena@example.com')

  // 1. Verify Live Discovery Fallback (Cache Miss)
  await t.test('[Story 2.2] should discover metadata from BQ when cache is empty', async () => {
    queryCount = 0
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}`,
      headers: { authorization: `Bearer ${authorizedToken}` }
    })

    assert.equal(res.statusCode, 200)
    const body = res.json()
    console.log('BODY VALUE IS:', JSON.stringify(body, null, 2))
    assert.ok(body.value.some((v: any) => v.name === 'Sales'), 'Should discover Sales table')
    assert.ok(queryCount > 0, 'Should have queried BigQuery INFORMATION_SCHEMA')
  })

  // 2. Verify Sharded Caching (Cache Hit)
  await t.test('[Story 2.3] should serve from cache on subsequent requests', async () => {
    const startQueries = queryCount
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}`,
      headers: { authorization: `Bearer ${authorizedToken}` }
    })

    assert.equal(res.statusCode, 200)
    assert.equal(queryCount, startQueries, 'Should NOT have queried BigQuery (cache hit)')
  })

  // 3. Verify OData $metadata XML Generation
  await t.test('[Story 2.4] should generate valid EDM XML ($metadata)', async () => {
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}/$metadata`,
      headers: { authorization: `Bearer ${authorizedToken}` }
    })

    if (res.statusCode !== 200) {
      console.log('EDM Failure Payload:', res.payload)
      console.log('EDM Headers:', res.headers)
    }
    assert.equal(res.statusCode, 200)
    assert.match(res.headers['content-type'] as string, /application\/xml/)
    assert.ok(res.payload.includes('EntitySet Name="Sales"'), 'Should contain Sales EntitySet')
    assert.ok(res.payload.includes('Property Name="OrderID" Type="Edm.Int64"'), 'Should map INT64 to Edm.Int64')
  })

  // 4. Verify Multi-tenant Isolation
  await t.test('[Story 2.1] should isolate metadata between tenants', async () => {
    // Attempt to access a different tenant not in rules for Elena
    const otherProject = 'finance-prod'
    const otherDataset = 'audits'
    
    const res = await app.inject({
      url: `/v1/${otherProject}/${otherDataset}`,
      headers: { authorization: `Bearer ${authorizedToken}` }
    })

    // Elena is not authorized for finance-prod in default tenants.yaml
    assert.equal(res.statusCode, 403)
  })

  // 5. Verify Cache Invalidation (Admin Route)
  await t.test('[Admin] should invalidate cache via refresh endpoint', async () => {
    // 1. Ensure it's in cache
    await app.inject({
      url: `/v1/${projectId}/${datasetId}`,
      headers: { authorization: `Bearer ${authorizedToken}` }
    })
    
    // 2. Trigger Refresh
    const refreshRes = await app.inject({
      method: 'POST',
      url: `/v1/admin/refresh/${projectId}/${datasetId}`,
      headers: { authorization: `Bearer ${authorizedToken}` }
    })
    assert.equal(refreshRes.statusCode, 200)
    assert.equal(refreshRes.json().refreshed, true)

    // 3. Verify next request triggers BQ query again
    const startQueries = queryCount
    await app.inject({
      url: `/v1/${projectId}/${datasetId}`,
      headers: { authorization: `Bearer ${authorizedToken}` }
    })
    assert.ok(queryCount > startQueries, 'Should have re-queried BigQuery after cache invalidation')
  })
})
