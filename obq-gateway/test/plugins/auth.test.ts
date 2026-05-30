import { test } from 'node:test'
import * as assert from 'node:assert'
import Fastify from 'fastify'
import Auth from '../../src/plugins/auth.js'
import TokenCache from '../../src/plugins/00-metadata-cache.js'
import { generateKeyPair, SignJWT, createLocalJWKSet, exportJWK } from 'jose'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

test('auth plugin', async (t) => {
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

  const jwksJson = {
    keys: [
      {
        ...jwk,
        alg: 'RS256',
        use: 'sig',
        kid: 'test-kid'
      }
    ]
  }

  // Create a local JWK set to avoid fetch in jwtVerify
  const jwks = createLocalJWKSet(jwksJson) as any

  // Setup MSW to mock OIDC discovery
  const server = setupServer(
    http.get(`${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`, () => {
      return HttpResponse.json({
        issuer,
        jwks_uri: `${issuer}jwks.json`,
        authorization_endpoint: `${issuer}auth`,
        token_endpoint: `${issuer}token`
      })
    }),
    http.get(`${issuer}jwks.json`, () => {
      return HttpResponse.json(jwksJson)
    })
  )

  server.listen({ onUnhandledRequest: 'bypass' })
  t.after(() => server.close())

  const dummyFetch = async () => ({ ok: true, status: 200, json: async () => ({}) })

  await t.test('should skip auth for /health even with query params', async (t) => {
    const fastify = Fastify()
    await fastify.register(Auth, { issuer, audience, jwks, fetch: dummyFetch as any, anonymousMode: false })
    fastify.get('/health', async () => ({ status: 'ok' }))
    await fastify.ready()

    const res = await fastify.inject({
      url: '/health?v=1'
    })
    assert.equal(res.statusCode, 200)
  })

  await t.test('should protect root / by default', async (t) => {
    const fastify = Fastify()
    await fastify.register(Auth, { issuer, audience, jwks, fetch: dummyFetch as any, anonymousMode: false })
    fastify.get('/', async () => ({ status: 'ok' }))
    await fastify.ready()

    const res = await fastify.inject({
      url: '/'
    })
    assert.equal(res.statusCode, 401)
  })

  await t.test('should reject request without token', async (t) => {
    const fastify = Fastify()
    await fastify.register(Auth, { issuer, audience, jwks, fetch: dummyFetch as any, anonymousMode: false })
    fastify.get('/protected', async () => ({ ok: true }))
    await fastify.ready()

    const res = await fastify.inject({
      url: '/protected'
    })
    assert.equal(res.statusCode, 401)
  })

  await t.test('should return WWW-Authenticate header with fallback authorization_uri for 401 responses', async (t) => {
    const fastify = Fastify()
    await fastify.register(Auth, { issuer, audience, jwks, fetch: dummyFetch as any, anonymousMode: false })
    fastify.get('/protected', async () => ({ ok: true }))
    await fastify.ready()

    const res = await fastify.inject({
      url: '/protected'
    })
    assert.equal(res.statusCode, 401)
    const wwwAuthHeader = res.headers['www-authenticate']
    assert.ok(wwwAuthHeader)
    assert.match(String(wwwAuthHeader), /Bearer authorization_uri="http:\/\/localhost\/oauth2\/authorize", resource="api:\/\/test-audience"/)
  })

  await t.test('should return WWW-Authenticate header with explicit authorizationEndpoint for 401 responses', async (t) => {
    const fastify = Fastify()
    await fastify.register(Auth, { issuer, audience, jwks, fetch: dummyFetch as any, anonymousMode: false, authorizationEndpoint: `${issuer}auth` })
    fastify.get('/protected', async () => ({ ok: true }))
    await fastify.ready()

    const res = await fastify.inject({
      url: '/protected'
    })
    assert.equal(res.statusCode, 401)
    const wwwAuthHeader = res.headers['www-authenticate']
    assert.ok(wwwAuthHeader)
    assert.match(String(wwwAuthHeader), /Bearer authorization_uri="http:\/\/localhost\/auth", resource="api:\/\/test-audience"/)
  })

  await t.test('should accept request with valid token', async (t) => {
    const fastify = Fastify()
    await fastify.register(Auth, { 
      issuer, 
      audience, 
      jwks,
      fetch: dummyFetch as any,
      anonymousMode: false
    })
    fastify.get('/protected', async (request) => ({ user: request.user }))
    await fastify.ready()

    const res = await fastify.inject({
      url: '/protected',
      headers: {
        authorization: `Bearer ${validToken}`
      }
    })

    assert.equal(res.statusCode, 200)
    assert.equal(res.json().user.sub, 'user1')
    assert.equal(res.json().user.email, 'user1@example.com')
  })

  await t.test('should extract normalized email and groups from JWT', async (t) => {
    const fastify = Fastify()
    const tokenWithGroups = await new SignJWT({ 
        sub: 'user-unique-id',
        upn: 'normalized@example.com',
        groups: ['Analyst', 'Marketing']
      })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-kid' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(privateKey)

    await fastify.register(Auth, { issuer, audience, jwks, fetch: dummyFetch as any, anonymousMode: false })
    fastify.get('/identity', async (request) => ({ user: request.user }))
    await fastify.ready()

    const res = await fastify.inject({
      url: '/identity',
      headers: { authorization: `Bearer ${tokenWithGroups}` }
    })

    assert.equal(res.statusCode, 200)
    const user = res.json().user
    assert.equal(user.sub, 'user-unique-id')
    assert.equal(user.email, 'normalized@example.com')
    assert.deepStrictEqual(user.groups, ['Analyst', 'Marketing'])
  })

  await t.test('should fail closed if config is missing', async (t) => {
    const fastify = Fastify()
    // Override env vars with empty strings to trigger mandatory check
    await assert.rejects(async () => {
      await fastify.register(Auth, { issuer: '', audience: '', fetch: dummyFetch as any, anonymousMode: false })
      await fastify.ready()
    }, /mandatory/)
  })

  await t.test('should retry discovery on transient failure', async (t) => {
    const fastify = Fastify()
    let calls = 0
    const mockFetch = async (url: any) => {
      const urlStr = String(url)
      if (urlStr.includes('openid-configuration')) {
        calls++
        if (calls === 1) return { ok: false, status: 500 }
        return {
          ok: true,
          status: 200,
          json: async () => ({ jwks_uri: 'http://localhost/jwks.json' })
        }
      }
      return { ok: true, status: 200, json: async () => ({}) }
    }

    await fastify.register(Auth, { issuer, audience, fetch: mockFetch as any, anonymousMode: false })
    await fastify.ready()
    assert.equal(calls, 2)
  })
})
