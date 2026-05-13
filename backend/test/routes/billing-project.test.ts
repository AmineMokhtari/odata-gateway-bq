import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'
import { SignJWT, generateKeyPair, exportJWK } from 'jose'
import { Readable } from 'node:stream'

test('Story 7.1: Billing project decoupling', async (t) => {
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

  // Mock OIDC
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

  let capturedOptions: any = null
  let capturedDataProjectId: string | undefined

  const mockBQ = {
    projectId: 'billing-project',
    dataset: (id: string, options: any) => {
      capturedDataProjectId = options?.projectId
      return {
        getMetadata: async () => [{ location: 'US' }],
      }
    },
    query: async (options: any) => {
      // Mock INFORMATION_SCHEMA responses
      if (options.query.includes('INFORMATION_SCHEMA.TABLES')) {
        return [[{ table_name: 'table1' }]]
      }
      if (options.query.includes('INFORMATION_SCHEMA.COLUMNS')) {
        return [[{ table_name: 'table1', column_name: 'id', data_type: 'STRING', is_nullable: 'YES' }]]
      }
      return [[]]
    },
    createQueryJob: async (options: any) => {
      capturedOptions = options
      return [{
        id: 'job-123',
        metadata: { statistics: { totalBytesProcessed: '1024', query: { totalRows: '1' } } },
        getMetadata: async () => [{ statistics: { totalBytesProcessed: '1024', query: { totalRows: '1' } } }],
        getQueryResultsStream: () => {
          const s = new Readable({ objectMode: true, read() { this.push(null) } })
          return s
        }
      }]
    }
  }

  const app = await build(t, {
    getBQClient: (projectId: string) => {
      return mockBQ as any
    },
    logger: { level: 'silent' }
  })

  const dataProject = 'data-project'
  const datasetId = 'dataset1'
  const entitySet = 'table1'

  // Pre-seed cache to avoid discovery complexity in this test
  app.metadataCache.set(`${dataProject}:${datasetId}`, {
    projectId: dataProject,
    datasetId,
    location: 'US',
    tables: [{ name: entitySet, columns: [{ name: 'id', type: 'STRING', isNullable: true }], relationships: [] }]
  })

  const res = await app.inject({
    method: 'GET',
    url: `/v1/${dataProject}/${datasetId}/${entitySet}`,
    headers: {
      authorization: `Bearer ${validToken}`,
      'x-forwarded-email': 'user1@example.com',
      'x-forwarded-sub': 'user1'
    }
  })

  assert.strictEqual(res.statusCode, 200)
  
  // Verify that the query SQL targets the data project
  assert.ok(capturedOptions.query.includes(`\`${dataProject}.${datasetId}.${entitySet}\``), 'SQL should target data project')
  
  // Verify that labels include the data project ID (our enhancement)
  assert.strictEqual(capturedOptions.labels.data_project_id, 'data-project', 'Labels should include sanitized data project ID')
  assert.strictEqual(capturedOptions.labels.dataset_id, 'dataset1', 'Labels should include sanitized dataset ID')
  
  // Verify metadata access (dataset retrieval) used the explicit data project ID
  // This is what getDatasetMetadata calls: bq.dataset(id, { projectId: dataProjectId })
  // In our test, we called it in the route but it was already cached.
  // Let's clear cache and re-run to verify metadata access too.
  app.metadataCache.clear()
  
  const res2 = await app.inject({
    method: 'GET',
    url: `/v1/${dataProject}/${datasetId}/${entitySet}`,
    headers: {
      authorization: `Bearer ${validToken}`,
      'x-forwarded-email': 'user1@example.com',
      'x-forwarded-sub': 'user1'
    }
  })
  
  assert.strictEqual(res2.statusCode, 200)
  assert.strictEqual(capturedDataProjectId, dataProject, 'Metadata discovery should explicitly target data project ID')
})
