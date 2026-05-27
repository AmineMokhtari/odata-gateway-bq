import { test } from 'node:test'
import * as assert from 'node:assert'
import { Readable } from 'node:stream'
import { build } from '../helper.js'
import { generateKeyPair, SignJWT, exportJWK } from 'jose'

test('v1 data routing', async (t) => {
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

  // Override the global fetch mock to return our test JWK
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

  const mockBQ = {
    projectId: 'my-project',
    dataset: (id: string) => ({
      getMetadata: async () => [{ location: 'US' }]
    }),
    createQueryJob: async (options: any) => {
      if (options.dryRun) {
        return [{
          metadata: {
            statistics: {
              totalBytesProcessed: '1024'
            }
          }
        }]
      }
      return [{
        id: 'mock-job-id',
        metadata: {
          statistics: {
            totalBytesProcessed: '1024',
            query: { totalRows: '1' }
          }
        },
        getMetadata: async () => [{
          statistics: { query: { totalRows: '1' } }
        }],
        getQueryResultsStream: () => {
          const s = new Readable({
            objectMode: true,
            read() {
              this.push({ id: 1 })
              this.push(null)
            }
          })
          return s
        },
        cancel: async () => {}
      }]
    }
  }

  const app = await build(t, {
    getBQClient: () => mockBQ,
    logger: { level: 'debug' }
  })

  const projectId = 'my-project'
  const datasetId = 'my_dataset'

  // Pre-seed cache to avoid BigQuery calls in integration tests
  app.metadataCache.set(`${projectId}:${datasetId}`, {
    projectId,
    datasetId,
    location: 'US',
    tables: [
      { name: 'Sales', columns: [{ name: 'id', type: 'INT64', isNullable: false }], relationships: [] }
    ]
  })
  app.metadataCache.set(`${projectId}:${datasetId}:xml`, '<?xml version="1.0" encoding="utf-8"?><Edmx xmlns="http://docs.oasis-open.org/odata/ns/edmx" Version="4.0"><DataServices><Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="GCP.my_project.my_dataset"><EntityType Name="Sales"><Key><PropertyRef Name="id"/></Key><Property Name="id" Type="Edm.Int64" Nullable="false"/></EntityType><EntityContainer Name="BigQueryContext"><EntitySet Name="Sales" EntityType="GCP.my_project.my_dataset.Sales"/></EntityContainer></Schema></DataServices></Edmx>' as any)

  await t.test('should parse projectId and datasetId correctly and return XML', async () => {
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}`,
      headers: {
        authorization: `Bearer ${validToken}`
      }
    })

    assert.equal(res.statusCode, 200)
    assert.ok(res.headers['content-type']?.includes('application/xml'))
    assert.ok(res.payload.includes('<EntityType Name="'))
  })

  await t.test('should return $metadata as XML', async () => {
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}/$metadata`,
      headers: {
        authorization: `Bearer ${validToken}`
      }
    })

    assert.equal(res.statusCode, 200)
    assert.ok(res.headers['content-type']?.includes('application/xml'))
    assert.ok(res.payload.includes('<EntityType Name="'))
    assert.ok(res.payload.includes('Namespace="GCP.my_project.my_dataset"'))
  })

  await t.test('should return explain info when explain=true', async () => {
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}/Sales?explain=true`,
      headers: {
        authorization: `Bearer ${validToken}`
      }
    })

    assert.equal(res.statusCode, 200)
    const payload = res.json()
    assert.ok(payload.sql)
    assert.ok(typeof payload.estimatedBytes === 'number')
    assert.ok(payload.budgetBytes)
  })

  await t.test('should fetch data from EntitySet', async () => {
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}/Sales?$top=2`,
      headers: {
        authorization: `Bearer ${validToken}`
      }
    })

    assert.equal(res.statusCode, 200)
    const body = res.json()
    assert.equal(body.value.length, 1)
    assert.equal(body.value[0].id, 1)
  })

  await t.test('should return 400 for invalid projectId', async () => {
    const res = await app.inject({
      url: `/v1/invalid_project/${datasetId}`,
      headers: {
        authorization: `Bearer ${validToken}`
      }
    })

    assert.equal(res.statusCode, 400)
  })
})
