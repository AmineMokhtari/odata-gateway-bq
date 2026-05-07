import { test } from 'node:test'
import * as assert from 'node:assert'
import { Readable } from 'node:stream'
import { build } from '../helper.js'
import { generateKeyPair, SignJWT, exportJWK } from 'jose'
import { getUserUsage } from '../../src/services/usage-audit.js'

/**
 * [Epic 4] Integration Test: Observability & Audit
 * Verifies Pulse Tracking, Protobuf Logging, and Usage Reporting.
 */
test('Epic 4: High-performance observability and audit', async (t) => {
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

  // Mock Storage Service
  const auditLogs: any[] = []
  const mockStorageService = {
    writeLog: async (event: any) => {
      auditLogs.push(event)
    }
  }

  const mockBQ = {
    projectId: 'my-project',
    dataset: (id: string) => ({
      getMetadata: async () => [{ location: 'US' }]
    }),
    query: async (options: any) => {
      const sql = options.query.toLowerCase()
      if (sql.includes('jobs_by_project')) {
        return [[{ total_bytes_billed: 5000000000 }]] // 5GB
      }
      if (sql.includes('audit_logs')) {
        return [[
          { id: 'corr-1', creation_time: { value: '2026-04-27T10:00:00Z' }, bytes: 1024, action: 'QUERY', status: 'SUCCESS' }
        ]]
      }
      return [[]]
    },
    createQueryJob: async () => {
      return [{
        id: 'job-1',
        metadata: { statistics: { totalBytesProcessed: '1024', query: { totalRows: '1' } } },
        getMetadata: async () => [{ statistics: { query: { totalRows: '1' } } }],
        getQueryResultsStream: () => {
          return Readable.from([{ id: 1 }])
        }
      }]
    }
  }

  const app = await build(t, {
    getBQClient: () => mockBQ,
    storageService: mockStorageService,
    logger: { level: 'debug' }
  })

  const projectId = 'my-project'
  const datasetId = 'my_dataset'
  const email = 'elena@example.com'
  const authorizedToken = await createToken('elena1', email)

  // Pre-seed cache
  app.metadataCache.set(`${projectId}:${datasetId}`, {
    projectId, datasetId, location: 'US',
    tables: [{ name: 'Sales', columns: [{ name: 'id', type: 'INT64', isNullable: false }] }]
  })

  // 1. Verify Pulse Tracking on Discovery
  await t.test('[Story 4.3] should record pulse on discovery requests', async () => {
    auditLogs.length = 0
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}`,
      headers: { authorization: `Bearer ${authorizedToken}` }
    })

    // Wait for fire-and-forget audit log (Story 8.5)
    await new Promise(resolve => setTimeout(resolve, 50))

    if (res.statusCode !== 200) {
      console.error(`[Test] Pulse Failure StatusCode: ${res.statusCode}`)
      console.error(`[Test] Pulse Failure Payload: ${res.payload}`)
    }
    assert.equal(res.statusCode, 200)

    const pulse = auditLogs.find(l => l.action === 'PULSE')
    assert.ok(pulse, 'Should have recorded a pulse')
    assert.equal(pulse.userEmail, email)
    assert.equal(pulse.projectId, projectId)
  })

  // 2. Verify Persistent Audit Logging on Query
  await t.test('[Story 8.5] should record query action in persistent audit log', async () => {
    auditLogs.length = 0
    await app.inject({
      url: `/v1/${projectId}/${datasetId}/Sales`,
      headers: { authorization: `Bearer ${authorizedToken}` }
    })

    // Wait for fire-and-forget audit log (Story 8.5)
    await new Promise(resolve => setTimeout(resolve, 50))

    const queryLog = auditLogs.find(l => l.action === 'QUERY')
    assert.ok(queryLog, 'Should have recorded a query log')
    assert.equal(queryLog.bytesProcessed, 1024)
    assert.ok(queryLog.correlationId, 'Should have a correlation ID')
  })

  // 3. Verify Unified Usage Reporting (Story 6.4)
  await t.test('[Story 6.4] should aggregate usage from INFORMATION_SCHEMA and audit logs', async () => {
    // Test the service directly
    const usageDirect = await getUserUsage(mockBQ as any, email, 'US')
    assert.equal(usageDirect.totalBytesBilled, 5000000000)
    
    // Test the endpoint
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}/usage`,
      headers: { authorization: `Bearer ${authorizedToken}` }
    })
    
    assert.equal(res.statusCode, 200)
    const payload = JSON.parse(res.payload)
    assert.equal(payload.totalBytesBilled, 5000000000)
    assert.equal(payload.userEmail, email)
    assert.ok(payload.budgetBytes > 0)
  })

  // 4. Verify Audit Resilience (Non-blocking)
  await t.test('[Resilience] should not fail request if audit logging fails', async () => {
    const failingStorage = {
      writeLog: async () => { throw new Error('gRPC Failure') }
    }
    const appWithFailingAudit = await build(t, {
      getBQClient: () => mockBQ,
      storageService: failingStorage,
      logger: { level: 'debug' }
    })

    // Seed cache for this instance too
    appWithFailingAudit.metadataCache.set(`${projectId}:${datasetId}`, {
      projectId, datasetId, location: 'US',
      tables: [{ name: 'Sales', columns: [{ name: 'id', type: 'INT64', isNullable: false }] }]
    })

    const res = await appWithFailingAudit.inject({
      url: `/v1/${projectId}/${datasetId}/Sales`,
      headers: { authorization: `Bearer ${authorizedToken}` }
    })

    assert.equal(res.statusCode, 200, 'Request should succeed even if audit logging fails')
  })
})
