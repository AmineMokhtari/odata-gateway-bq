import { test } from 'node:test'
import * as assert from 'node:assert'
import Fastify from 'fastify'
import Auth from '../../src/plugins/auth.js'
import Labels from '../../src/plugins/01-labels.js'
import AuthRoutes from '../../src/routes/auth/index.js'
import { generateKeyPair, SignJWT, exportJWK } from 'jose'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

test('auth session integration', async (t) => {
  const { publicKey, privateKey } = await generateKeyPair('RS256')
  const jwk = await exportJWK(publicKey)
  
  const issuer = 'http://localhost:9999/'
  const audience = 'test-audience'

  const validToken = await new SignJWT({ sub: 'user1', email: 'user1@example.com' })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-kid' })
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(privateKey)

  const jwks = {
    keys: [
      {
        ...jwk,
        alg: 'RS256',
        use: 'sig',
        kid: 'test-kid'
      }
    ]
  }

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
      return HttpResponse.json(jwks)
    })
  )

  server.listen({ onUnhandledRequest: 'bypass' })
  t.after(() => server.close())

  await t.test('should maintain identity across session after valid Bearer token', async (t) => {
    const fastify = Fastify({ logger: { level: 'debug' } })
    await fastify.register(Auth, { issuer, audience, anonymousMode: false })
    await fastify.register(Labels)
    await fastify.register(AuthRoutes, { prefix: '/auth' })
    fastify.get('/protected', async (request) => ({ user: request.user, email: request.user_email }))
    await fastify.ready()

    const res1 = await fastify.inject({
      url: '/protected',
      headers: {
        authorization: `Bearer ${validToken}`
      }
    })

    assert.equal(res1.statusCode, 200)
    assert.equal(res1.json().user.email, 'user1@example.com')
    assert.equal(res1.json().email, 'user1_example_com') // Sanitized version
  })

  await t.test('should authenticate via session cookie and logout', async (t) => {
    const fastify = Fastify({ logger: { level: 'debug' } })
    await fastify.register(Auth, { issuer, audience, anonymousMode: false })
    await fastify.register(AuthRoutes, { prefix: '/auth' })
    fastify.get('/protected', async (request) => ({ user: request.user }))
    
    // Manual session setter for testing (prefixed with /auth/ to bypass auth hook)
    fastify.get('/auth/set-session', async (request) => {
      const user = await fastify.verifyToken(validToken)
      request.session.set('user', user)
      return { ok: true }
    })

    await fastify.ready()

    const res1 = await fastify.inject({
      url: '/auth/set-session'
    })
    
    const cookies = res1.cookies
    const sessionCookie = cookies.find(c => c.name === 'session')
    assert.ok(sessionCookie, 'Session cookie should be set')

    const res2 = await fastify.inject({
      url: '/protected',
      cookies: {
        session: sessionCookie!.value
      }
    })

    assert.equal(res2.statusCode, 200)
    assert.equal(res2.json().user.email, 'user1@example.com')

    // Test Logout
    const res3 = await fastify.inject({
      method: 'POST',
      url: '/auth/logout',
      cookies: {
        session: sessionCookie!.value
      }
    })
    assert.equal(res3.statusCode, 200)

    const res4 = await fastify.inject({
      url: '/protected',
      cookies: {
        session: res3.cookies.find(c => c.name === 'session')?.value || ''
      }
    })
    assert.equal(res4.statusCode, 401)
  })
})
