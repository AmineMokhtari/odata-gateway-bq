import { test } from 'node:test'
import * as assert from 'node:assert'
import { Readable } from 'node:stream'
import { build } from '../helper.js'
import { generateKeyPair, SignJWT, exportJWK } from 'jose'

process.on('uncaughtException', (err) => {
  console.error('DEBUG UNCAUGHT:', err)
})
process.on('unhandledRejection', (reason) => {
  console.error('DEBUG UNHANDLED:', reason)
})

test('v1 smart paging ($skiptoken)', async (t) => {
  const { publicKey, privateKey } = await generateKeyPair('RS256')
  const jwk = await exportJWK(publicKey)
  
  const issuer = 'http://localhost/'
  const audience = 'test-audience'

  const validToken = await new SignJWT({ sub: 'user1', email: 'user1@example.com' })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-kid' })
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(privateKey)

  // Override the global fetch mock
  const originalFetch = globalThis.fetch
  // @ts-ignore
  globalThis.fetch = async (url: any) => {
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
          keys: [
            {
              ...jwk,
              alg: 'RS256',
              use: 'sig',
              kid: 'test-kid'
            }
          ]
        })
      }
    }
    return { ok: false, status: 404 }
  }

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  const mockJob = {
    id: 'mock-job-id',
    metadata: {
      statistics: {
        totalBytesProcessed: '1024',
        query: {
          totalRows: '100'
        }
      },
      labels: {
        user_identity: 'user1_example_com'
      }
    },
    getMetadata: async () => [{ 
      statistics: { totalBytesProcessed: '1024', query: { totalRows: '100' } },
      labels: { user_identity: 'user1_example_com' }
    }],
    get: async function() { return [this] },
    getQueryResultsStream: (options?: any) => {
      const startIndex = Number(options?.startIndex || 0)
      const maxResults = Number(options?.maxResults || 10)
      const s = new Readable({
        objectMode: true,
        read() {
          const count = Math.min(maxResults, 100 - startIndex)
          for (let i = 0; i < count; i++) {
            this.push({ id: startIndex + i + 1 })
          }
          this.push(null)
        }
      })
      return s
    },
    cancel: async () => {}
  }

  const mockBQ = {
    projectId: 'my-project',
    dataset: (id: string) => ({
      getMetadata: async () => [{ location: 'US' }],
      table: (id: string) => ({
        getMetadata: async () => [{}]
      })
    }),
    job: (id: string) => mockJob,
    query: async () => [[{ table_name: 'test_table' }], [{ table_name: 'test_table', column_name: 'id', data_type: 'INT64', is_nullable: 'NO' }], []],
    createQueryJob: async (options: any) => {
      if (options.dryRun) {
        return [{
          metadata: { statistics: { totalBytesProcessed: '1024' } }
        }]
      }
      return [mockJob]
    }
  }

  const app = await build(t, {
    getBQClient: () => mockBQ,
    logger: { level: 'info' }
  })

  const projectId = 'my-project'
  const datasetId = 'my_dataset'
  const entitySet = 'test_table'

  // Pre-seed cache to avoid BigQuery discovery queries
  app.metadataCache.set(`${projectId}:${datasetId}`, {
    projectId, datasetId, location: 'US',
    tables: [{ name: 'test_table', columns: [{ name: 'id', type: 'INT64', isNullable: false }], relationships: [] }]
  })

  await t.test('First page should return nextLink', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/${projectId}/${datasetId}/${entitySet}?$top=10`,
      headers: {
        authorization: `Bearer ${validToken}`,
        'x-forwarded-email': 'user1@example.com',
        'x-forwarded-sub': 'user1_example_com'
      }
    })

    assert.strictEqual(res.statusCode, 200)
    const body = JSON.parse(res.payload)
    assert.strictEqual(body.value.length, 10)
    assert.ok(body['@odata.nextLink'])
    assert.match(body['@odata.nextLink'], /(\$|%24)skiptoken=mock-job-id(%3A|:)10/)
  })

  await t.test('Second page using $skiptoken should resume results', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/${projectId}/${datasetId}/${entitySet}?$top=10&$skiptoken=mock-job-id:10`,
      headers: {
        authorization: `Bearer ${validToken}`,
        'x-forwarded-email': 'user1@example.com',
        'x-forwarded-sub': 'user1_example_com'
      }
    })

    assert.strictEqual(res.statusCode, 200)
    const body = JSON.parse(res.payload)
    assert.strictEqual(body.value.length, 10)
    assert.strictEqual(body.value[0].id, 11)
    assert.match(body['@odata.nextLink'], /(\$|%24)skiptoken=mock-job-id(%3A|:)20/)
  })

  await t.test('Final page should NOT have nextLink', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/${projectId}/${datasetId}/${entitySet}?$top=10&$skiptoken=mock-job-id:90`,
      headers: {
        authorization: `Bearer ${validToken}`,
        'x-forwarded-email': 'user1@example.com',
        'x-forwarded-sub': 'user1_example_com'
      }
    })

    assert.strictEqual(res.statusCode, 200)
    const body = JSON.parse(res.payload)
    assert.strictEqual(body.value.length, 10)
    assert.strictEqual(body.value[0].id, 91)
    assert.strictEqual(body['@odata.nextLink'], undefined)
  })

  await t.test('Should fail if Job ID belongs to another user', async () => {
    // Modify mockJob to return a different user identity
    const otherJob = {
      ...mockJob,
      metadata: {
        ...mockJob.metadata,
        labels: { user_identity: 'other_user' }
      }
    }
    // Temporary override mockBQ.job
    const originalJobMock = mockBQ.job
    mockBQ.job = () => otherJob as any

    const res = await app.inject({
      method: 'GET',
      url: `/v1/${projectId}/${datasetId}/${entitySet}?$top=10&$skiptoken=mock-job-id:10`,
      headers: {
        authorization: `Bearer ${validToken}`, // user1@example.com -> user1_example_com
        'x-forwarded-email': 'user1@example.com',
        'x-forwarded-sub': 'user1_example_com'
      }
    })

    assert.strictEqual(res.statusCode, 403)
    const body = JSON.parse(res.payload)
    assert.strictEqual(body.error.code, 'AccessDenied')

    // Restore mock
    mockBQ.job = originalJobMock
  })
})
