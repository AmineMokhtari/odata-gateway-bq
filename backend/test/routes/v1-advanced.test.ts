import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'
import * as jose from 'jose'

test('v1 advanced routing and admin', async (t) => {
  const { publicKey, privateKey } = await jose.generateKeyPair('RS256')
  const jwk = await jose.exportJWK(publicKey)
  
  const issuer = 'http://localhost/'
  const audience = 'test-audience'

  const validToken = await new jose.SignJWT({ sub: 'user1', email: 'user1@example.com', groups: ['admins'] })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-kid' })
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(privateKey)

  // Mock fetch for OIDC
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

  let queryCount = 0
  const mockBQ = {
    projectId: 'my-project',
    dataset: (id: string) => ({
      getMetadata: async () => [{ location: 'US' }]
    }),
    query: async (options: any) => {
      queryCount++
      if (options.query.includes('INFORMATION_SCHEMA.COLUMNS') && options.params?.tableName === 'FreshTable') {
        return [[
          { column_name: 'id', data_type: 'INT64', is_nullable: 'NO' }
        ]]
      }
      return [[]]
    },
    createQueryJob: async (options: any) => {
      if (options.dryRun && options.query.includes('OverBudget')) {
        const err = new Error('Budget Exceeded')
        // @ts-ignore
        err.code = 'BudgetExceeded'
        // @ts-ignore
        err.estimatedBytes = 5 * 1024 * 1024 * 1024 // 5GB
        // @ts-ignore
        err.budgetBytes = 1 * 1024 * 1024 * 1024 // 1GB
        throw err
      }
      return [{
        metadata: { statistics: { totalBytesProcessed: '100' } }
      }]
    }
  }

  const app = await build(t, {
    getBQClient: () => mockBQ,
    logger: { level: 'error' }
  })

  const projectId = 'my-project'
  const datasetId = 'my_dataset'

  // Pre-seed cache with minimal metadata
  app.metadataCache.set(`${projectId}:${datasetId}`, {
    projectId,
    datasetId,
    location: 'US',
    tables: [
      { name: 'Sales', columns: [{ name: 'id', type: 'INT64', isNullable: false }] }
    ]
  })

  await t.test('Live Discovery: should fetch missing table from INFORMATION_SCHEMA', async () => {
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}/FreshTable?explain=true`,
      headers: { authorization: `Bearer ${validToken}` }
    })

    assert.equal(res.statusCode, 200)
    const payload = res.json()
    assert.ok(payload.sql.includes('FreshTable'))
    
    // Check if it was added to cache
    const cached = app.metadataCache.get(`${projectId}:${datasetId}`)
    assert.ok(cached.tables.find((t: any) => t.name === 'FreshTable'))
  })

  await t.test('Budget: should return 400 with visual explanation for BudgetExceeded', async () => {
    // We force a budget exceeded by using a table name that triggers our mock error
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}/OverBudget`,
      headers: { authorization: `Bearer ${validToken}` }
    })

    assert.equal(res.statusCode, 400)
    const payload = res.json()
    assert.equal(payload.error.code, 'BudgetExceeded')
    assert.ok(payload.error.message.includes('[Visual Explanation:'))
  })

  await t.test('Admin: should refresh cache', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/v1/admin/refresh/${projectId}/${datasetId}`,
      headers: { authorization: `Bearer ${validToken}` }
    })

    assert.equal(res.statusCode, 200)
    assert.equal(res.json().refreshed, true)
    assert.equal(app.metadataCache.has(`${projectId}:${datasetId}`), false)
  })

  await t.test('Admin: should get usage stats', async () => {
    // Record some usage manually or via an inject
    app.usageTracker.recordUsage(projectId, datasetId, 1024)

    const res = await app.inject({
      url: `/v1/admin/usage/${projectId}/${datasetId}`,
      headers: { authorization: `Bearer ${validToken}` }
    })

    assert.equal(res.statusCode, 200)
    assert.equal(res.json().usage.totalBytesProcessed, 1024)
  })

  await t.test('Connection Pulse: should update lastActive on $metadata query', async () => {
    // Initial status
    let res = await app.inject({
      url: `/v1/connection-status/${projectId}/${datasetId}`,
      headers: { authorization: `Bearer ${validToken}` }
    })
    assert.equal(res.json().status, 'listening')

    // Trigger pulse via $metadata
    await app.inject({
      url: `/v1/${projectId}/${datasetId}/$metadata`,
      headers: { authorization: `Bearer ${validToken}` }
    })

    // Check updated status
    res = await app.inject({
      url: `/v1/connection-status/${projectId}/${datasetId}`,
      headers: { authorization: `Bearer ${validToken}` }
    })
    assert.equal(res.json().status, 'connected')
    assert.ok(res.json().lastActive)
  })
})
