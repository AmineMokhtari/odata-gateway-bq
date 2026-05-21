import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'
import * as jose from 'jose'

test('v1 neighborhood route', async (t) => {
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

  const app = await build(t, {
    logger: { level: 'error' }
  })

  const projectId = 'my-project'
  const datasetId = 'my_dataset'

  // Pre-seed cache with metadata representing relationships
  app.metadataCache.set(`${projectId}:${datasetId}`, {
    projectId,
    datasetId,
    location: 'US',
    schemaVersion: 'mock-schema-hash-123456',
    tables: [
      {
        name: 'Customers',
        columns: [
          { name: 'id', type: 'INT64', isNullable: false },
          { name: 'name', type: 'STRING', isNullable: true }
        ],
        relationships: [
          {
            name: 'FK_Customers_Policies',
            column: 'id',
            referencedTable: 'Policies',
            referencedColumn: 'customer_id',
            type: 'TO_MANY'
          },
          {
            name: 'FK_Customers_GhostTable',
            column: 'id',
            referencedTable: 'GhostTable',
            referencedColumn: 'customer_id',
            type: 'TO_MANY'
          }
        ]
      },
      {
        name: 'Policies',
        columns: [
          { name: 'policy_id', type: 'INT64', isNullable: false },
          { name: 'customer_id', type: 'INT64', isNullable: true }
        ],
        relationships: []
      }
    ]
  })

  await t.test('GET /neighborhood - Success with relationships and filtering ghost tables', async () => {
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}/neighborhood?table=Customers`,
      headers: { authorization: `Bearer ${validToken}` }
    })

    assert.equal(res.statusCode, 200)
    const payload = res.json()
    
    assert.equal(payload.table, 'Customers')
    assert.equal(payload.columns.length, 2)
    assert.equal(payload.relationships.length, 1) // FK_Customers_GhostTable must be suppressed as GhostTable does not exist in dataset!
    assert.equal(payload.schemaVersion, 'mock-schema-hash-123456')
    
    const rel = payload.relationships[0]
    assert.equal(rel.name, 'FK_Customers_Policies')
    assert.equal(rel.referencedTable, 'Policies')
    assert.equal(rel.type, 'TO_MANY')
  })

  await t.test('GET /neighborhood - 404 Table Not Found', async () => {
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}/neighborhood?table=NonExistentTable`,
      headers: { authorization: `Bearer ${validToken}` }
    })

    assert.equal(res.statusCode, 404)
    assert.equal(res.json().error.code, 'NotFound')
  })

  await t.test('GET /neighborhood - 400 Missing Query Param', async () => {
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}/neighborhood`,
      headers: { authorization: `Bearer ${validToken}` }
    })

    assert.equal(res.statusCode, 400)
  })
})
