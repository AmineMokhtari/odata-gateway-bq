import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'
import { generateKeyPair, SignJWT, exportJWK } from 'jose'

test('admin routes', async (t) => {
  const { publicKey, privateKey } = await generateKeyPair('RS256')
  const jwk = await exportJWK(publicKey)
  
  const issuer = 'http://localhost/'
  const audience = 'test-audience'

  const validToken = await new SignJWT({ sub: 'admin', email: 'admin@example.com' })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-kid' })
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(privateKey)

  // Mock fetch for auth
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

  const app = await build(t)

  await t.test('POST /admin/refresh/:projectId/:datasetId should clear specific cache', async () => {
    // Manually seed cache
    const projectId = 'my-project'
    const datasetId = 'my_dataset'
    app.metadataCache.set(`${projectId}:${datasetId}`, {} as any)
    
    const res = await app.inject({
      method: 'POST',
      url: `/v1/admin/refresh/${projectId}/${datasetId}`,
      headers: {
        authorization: `Bearer ${validToken}`
      }
    })

    assert.equal(res.statusCode, 200)
    assert.equal(res.json().refreshed, true)
    assert.ok(!app.metadataCache.has(`${projectId}:${datasetId}`))
  })

  await t.test('POST /admin/refresh-all should clear all cache', async () => {
    app.metadataCache.set('p1:d1', {} as any)
    app.metadataCache.set('p2:d2', {} as any)
    
    const res = await app.inject({
      method: 'POST',
      url: '/v1/admin/refresh-all',
      headers: {
        authorization: `Bearer ${validToken}`
      }
    })

    assert.equal(res.statusCode, 200)
    assert.ok(!app.metadataCache.has('p1:d1'))
    assert.ok(!app.metadataCache.has('p2:d2'))
  })

  await t.test('GET /admin/usage/:projectId/:datasetId should return usage', async () => {
    const projectId = 'my-project'
    const datasetId = 'my_dataset'
    app.usageTracker.recordUsage(projectId, datasetId, 5000)

    const res = await app.inject({
      url: `/v1/admin/usage/${projectId}/${datasetId}`,
      headers: {
        authorization: `Bearer ${validToken}`
      }
    })

    assert.equal(res.statusCode, 200)
    const usage = res.json().usage
    assert.ok(usage.totalBytesProcessed >= 5000)
    assert.ok(usage.queryCount >= 1)
  })

  await t.test('GET /health should be public and return status', async () => {
    const res = await app.inject({
      url: '/health'
    })

    assert.equal(res.statusCode, 200)
    assert.equal(res.json().status, 'ok')
  })
})
