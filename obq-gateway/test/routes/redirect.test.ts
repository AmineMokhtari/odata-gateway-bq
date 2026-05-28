import { test } from 'node:test'
import * as assert from 'node:assert'
import Fastify from 'fastify'
import fp from 'fastify-plugin'
import appPlugin from '../../src/app.js'
import { config } from '../helper.js'

test('redirect port preservation hook', async (t) => {
  const app = Fastify({ logger: { level: 'silent' } })

  // Register the app plugin wrapped in fp, using standard test config from helper
  await app.register(fp(appPlugin), { ...config(), anonymousMode: true })

  // Define custom dummy routes that trigger redirects to test all redirect cases
  app.get('/test-relative-redirect', async (request, reply) => {
    return reply.redirect('/target')
  })

  app.get('/test-absolute-local-redirect-no-port', async (request, reply) => {
    return reply.redirect('http://localhost/target')
  })

  app.get('/test-absolute-local-redirect-with-port', async (request, reply) => {
    return reply.redirect('http://localhost:3005/target')
  })

  app.get('/test-external-redirect', async (request, reply) => {
    return reply.redirect('https://google.com/auth')
  })

  await app.ready()
  t.after(() => app.close())

  await t.test('relative redirect should be converted to absolute preserving request host and port', async () => {
    const res = await app.inject({
      url: '/test-relative-redirect',
      headers: {
        host: 'localhost:3005'
      }
    })
    assert.equal(res.statusCode, 302)
    assert.equal(res.headers.location, 'http://localhost:3005/target')
  })

  await t.test('absolute local redirect without port should be updated to preserve request host and port', async () => {
    const res = await app.inject({
      url: '/test-absolute-local-redirect-no-port',
      headers: {
        host: 'localhost:3005'
      }
    })
    assert.equal(res.statusCode, 302)
    assert.equal(res.headers.location, 'http://localhost:3005/target')
  })

  await t.test('absolute local redirect with port already correct should remain unchanged', async () => {
    const res = await app.inject({
      url: '/test-absolute-local-redirect-with-port',
      headers: {
        host: 'localhost:3005'
      }
    })
    assert.equal(res.statusCode, 302)
    assert.equal(res.headers.location, 'http://localhost:3005/target')
  })

  await t.test('external redirect should remain completely unchanged', async () => {
    const res = await app.inject({
      url: '/test-external-redirect',
      headers: {
        host: 'localhost:3005'
      }
    })
    assert.equal(res.statusCode, 302)
    assert.equal(res.headers.location, 'https://google.com/auth')
  })
})
