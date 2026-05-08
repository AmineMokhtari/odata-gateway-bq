import { test } from 'node:test'
import * as assert from 'node:assert'
import { Readable } from 'node:stream'
import { build } from '../helper.js'
import { generateKeyPair, SignJWT, exportJWK } from 'jose'

/**
 * [Epic 1] Integration Test: Identity -> Authorization -> Audit -> Execution Pipeline.
 * This test verifies that end-user identity and correlation IDs propagate correctly 
 * from the OIDC token through the internal rule engine and into BigQuery Job Labels.
 */
test('Epic 1: Identity propagation and rule-based authorization', async (t) => {
  const { publicKey, privateKey } = await generateKeyPair('RS256')
  const jwk = await exportJWK(publicKey)
  
  const issuer = 'http://localhost/'
  const audience = 'test-audience'

  // Helper to generate tokens for different users
  const createToken = async (sub: string, email: string, groups: string[] = []) => {
    return await new SignJWT({ sub, email, groups })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-kid' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(privateKey)
  }

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
          keys: [{ ...jwk, alg: 'RS256', use: 'sig', kid: 'test-kid' }]
        })
      }
    }
    return { ok: false, status: 404 }
  }

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  // Capture BQ query options for verification
  let lastQueryOptions: any = null
  const mockBQ = {
    projectId: 'my-project',
    dataset: (id: string) => ({
      getMetadata: async () => [{ location: 'US' }]
    }),
    createQueryJob: async (options: any) => {
      lastQueryOptions = options
      return [{
        id: 'mock-job-id',
        metadata: { 
          statistics: { 
            totalBytesProcessed: '1024',
            query: { totalRows: '1' }
          } 
        },
        getMetadata: async () => [{ 
          statistics: { 
            query: { totalRows: '1' } 
          } 
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

  // Pre-seed cache and internal rules (via mock/override)
  app.metadataCache.set(`${projectId}:${datasetId}`, {
    projectId, datasetId, location: 'US',
    tables: [{ name: 'Sales', columns: [{ name: 'id', type: 'INT64', isNullable: false }], relationships: [] }]
  })

  // 1. Verify Authorization Denial
  await t.test('[P0] should deny access if user is not in rules (Deny-by-Default)', async () => {
    const unauthorizedToken = await createToken('hacker1', 'malicious@hacker.com')
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}/Sales`,
      headers: { authorization: `Bearer ${unauthorizedToken}` }
    })
    assert.equal(res.statusCode, 403)
    assert.equal(res.json().error.code, 'Unauthorized')
  })

  // 2. Verify Authorization Success & Identity Propagation
  await t.test('[P0] should allow access and propagate labels to BQ', async () => {
    // Elena is an authorized email in the default tenants.yaml
    const authorizedToken = await createToken('elena1', 'elena@example.com', ['Analyst'])
    
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}/Sales`,
      headers: { authorization: `Bearer ${authorizedToken}` }
    })

    if (res.statusCode !== 200) {
      console.log('P0-Data-Failure Payload:', res.payload)
    }
    assert.equal(res.statusCode, 200)
    
    // Verify BQ Labels (Story 1.3 & 1.4)
    assert.ok(lastQueryOptions, 'BQ query should have been triggered')
    assert.equal(lastQueryOptions.labels.user_identity, 'elena_example_com')
    assert.ok(lastQueryOptions.labels.correlation_id, 'Correlation ID must be present')
    assert.match(lastQueryOptions.labels.correlation_id, /^[a-z][a-z0-9_-]*$/, 'Correlation ID should be a valid BQ label')
  })

  // 3. Verify Group-Based Authorization
  await t.test('[P0] should allow access based on group match', async () => {
    // Marketing group is authorized in the default tenants.yaml
    const groupToken = await createToken('group-user', 'someone@example.com', ['Marketing'])
    
    const res = await app.inject({
      url: `/v1/${projectId}/${datasetId}/Sales`,
      headers: { authorization: `Bearer ${groupToken}` }
    })

    assert.equal(res.statusCode, 200)
  })

  // 4. Verify Correlation ID uniqueness
  await t.test('[P1] should use unique correlation IDs across requests', async () => {
    const token = await createToken('user1', 'elena@example.com')
    
    await app.inject({
      url: `/v1/${projectId}/${datasetId}/Sales`,
      headers: { authorization: `Bearer ${token}` }
    })
    const firstId = lastQueryOptions.labels.correlation_id

    await app.inject({
      url: `/v1/${projectId}/${datasetId}/Sales`,
      headers: { authorization: `Bearer ${token}` }
    })
    const secondId = lastQueryOptions.labels.correlation_id

    assert.notEqual(firstId, secondId, 'Each request must have a unique correlation ID')
  })
})
