import { test } from 'node:test'
import * as assert from 'node:assert'
import { Readable } from 'node:stream'
import { build } from '../helper.js'
import { generateKeyPair, SignJWT, exportJWK } from 'jose'

/**
 * [Epic 3] Integration Test: Governed Data Streaming
 * Verifies SQL Translation, Budget Enforcement, Cancellation, and Paging.
 */
test('Epic 3: Governed data streaming engine', async (t) => {
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
      return { ok: true, status: 200, json: async () => ({ jwks_uri: 'http://localhost/jwks.json' }) }
    }
    if (urlStr.includes('jwks.json')) {
      return { ok: true, status: 200, json: async () => ({ keys: [{ ...jwk, alg: 'RS256', use: 'sig', kid: 'test-kid' }] }) }
    }
    return { ok: false, status: 404 }
  }) as typeof fetch

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  // Mock BigQuery for streaming and dry-runs
  let dryRunBytes = '1024'
  const mockBQ = {
    projectId: 'my-project',
    dataset: (id: string) => ({
      getMetadata: async () => [{ location: 'US' }]
    }),
    createQueryJob: async (options: any) => {
      if (options.dryRun) {
        return [{
          metadata: { statistics: { totalBytesProcessed: dryRunBytes } }
        }]
      }
      return [{
        id: 'mock-job-id',
        metadata: { 
          statistics: { 
            totalBytesProcessed: '1024',
            query: { totalRows: '100' }
          } 
        },
        getMetadata: async () => [{ 
          statistics: { query: { totalRows: '100' } } 
        }],
        getQueryResultsStream: () => {
          const s = new Readable({
            objectMode: true,
            read() {
              this.push({ id: 1, name: 'Test' })
              this.push(null)
            }
          })
          return s
        },
        cancel: async () => {}
      }]
    },
    job: (id: string) => ({
      get: async () => [{
        id,
        metadata: { 
          statistics: { query: { totalRows: '100' } },
          labels: { user_identity: 'elena_example_com' }
        },
        getQueryResultsStream: () => {
           const s = new Readable({
            objectMode: true,
            read() {
              this.push({ id: 2, name: 'Paged' })
              this.push(null)
            }
          })
          return s
        }
      }]
    })
  }

  const app = await build(t, {
    getBQClient: () => mockBQ
  })

  const projectId = 'my-project'
  const datasetId = 'my_dataset'
  const authorizedToken = await createToken('elena1', 'elena@example.com')

  // Pre-seed cache
  app.metadataCache.set(`${projectId}:${datasetId}`, {
    projectId, datasetId, location: 'US',
    tables: [{ name: 'Sales', columns: [{ name: 'id', type: 'INT64', isNullable: false }], relationships: [] }]
  })

  // 1. Verify Budget Enforcement (Circuit Breaker)
  await t.test('[Story 4.4] should block queries exceeding the scan budget', async () => {
    dryRunBytes = (20 * 1024 * 1024 * 1024).toString() // 20GB
    
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}/Sales`,
      headers: { authorization: `Bearer ${authorizedToken}` }
    })

    assert.equal(res.statusCode, 400)
    const body = res.json()
    assert.equal(body.error.code, 'BudgetExceeded')
    assert.ok(body.error.details.some((d: any) => d.code === 'ELENA_TIP'), 'Should include Elena Tip')
  })

  // 2. Verify Smart Paging ($skiptoken and nextLink)
  await t.test('[Story 8.1] should generate nextLink and resume from skiptoken', async () => {
    dryRunBytes = '1024' // Reset budget
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}/Sales?$top=10`,
      headers: { authorization: `Bearer ${authorizedToken}` }
    })

    assert.equal(res.statusCode, 200)
    const body = res.json()
    assert.ok(body['@odata.nextLink'], 'Should include nextLink')
    assert.match(body['@odata.nextLink'], /(\$|%24)skiptoken=mock-job-id(%3A|:)10/, 'nextLink should contain skiptoken')

    // Resume from skiptoken
    const resumeRes = await app.inject({
      url: `/v1/${projectId}/${datasetId}/Sales?$skiptoken=mock-job-id:10`,
      headers: { authorization: `Bearer ${authorizedToken}` }
    })
    assert.equal(resumeRes.statusCode, 200)
    assert.equal(resumeRes.json().value[0].name, 'Paged')
  })

  // 3. Verify $count support
  await t.test('[Story 8.3] should include @odata.count when requested', async () => {
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}/Sales?$count=true`,
      headers: { authorization: `Bearer ${authorizedToken}` }
    })
    assert.equal(res.statusCode, 200)
    assert.equal(res.json()['@odata.count'], 100)
  })
})
