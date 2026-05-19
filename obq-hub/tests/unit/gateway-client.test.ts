import { test } from 'node:test'
import * as assert from 'node:assert'
import { GatewayClient } from '../../src/lib/gateway-client.js'

test('GatewayClient: should inject cookies and correlation id', async () => {
  const mockCookies = async () => ({
    toString: () => 'session=test-session-123'
  })
  const mockHeaders = async () => new Map([['x-correlation-id', 'test-corr-id']])

  const client = new GatewayClient({ 
    cookies: mockCookies as any, 
    headers: mockHeaders as any 
  })
  
  const originalFetch = globalThis.fetch
  let capturedOptions: any = null

  globalThis.fetch = (async (url: string, options: any) => {
    capturedOptions = options
    return {
      ok: true,
      json: async () => ({})
    }
  }) as any

  await client.get('/test')

  assert.strictEqual(capturedOptions.headers.get('Cookie'), 'session=test-session-123')
  assert.strictEqual(capturedOptions.headers.get('x-correlation-id'), 'test-corr-id')

  globalThis.fetch = originalFetch
})

test('GatewayClient: should handle relative paths correctly', async () => {
  const mockCookies = async () => ({ toString: () => '' })
  const mockHeaders = async () => new Map()

  const client = new GatewayClient({ cookies: mockCookies as any, headers: mockHeaders as any })
  
  const originalFetch = globalThis.fetch
  let capturedUrl = ''

  globalThis.fetch = (async (url: string) => {
    capturedUrl = url
    return { ok: true, json: async () => ({}) }
  }) as any

  await client.get('v1/data')
  assert.strictEqual(capturedUrl, 'http://localhost:3005/v1/data')

  await client.get('/v1/data')
  assert.strictEqual(capturedUrl, 'http://localhost:3005/v1/data')

  globalThis.fetch = originalFetch
})

test('GatewayClient: should throw ResponseError on failure', async () => {
  const mockCookies = async () => ({ toString: () => '' })
  const mockHeaders = async () => new Map()
  const client = new GatewayClient({ cookies: mockCookies as any, headers: mockHeaders as any })
  
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () => {
    return {
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: { message: 'Auth failed' } })
    }
  }) as any

  await assert.rejects(async () => {
    await client.get('/test')
  }, (err: any) => {
    assert.strictEqual(err.name, 'ResponseError')
    assert.strictEqual(err.status, 401)
    assert.strictEqual(err.message, 'Auth failed')
    return true
  })

  globalThis.fetch = originalFetch
})
