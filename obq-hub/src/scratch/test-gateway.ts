/*
Copyright 2026 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
/**
 * Manual verification for GatewayClient logic using dependency injection
 */
import { GatewayClient } from '../lib/gateway-client.js'

async function runTest() {
  // Mock deps
  const mockCookies = async () => ({
    toString: () => 'session=mock-cookie-123'
  })
  const mockHeaders = async () => new Map([['x-correlation-id', 'mock-corr-id']])

  const client = new GatewayClient({ 
    cookies: mockCookies as any, 
    headers: mockHeaders as any 
  })
  
  // Mock global fetch
  let capturedUrl = ''
  let capturedHeaders: any = null
  
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async (url: string, options: any) => {
    capturedUrl = url
    capturedHeaders = options.headers
    return {
      ok: true,
      json: async () => ({ status: 'ok' })
    }
  }) as any

  console.log('Testing gatewayClient.get()...')
  await client.get('/v1/projects')

  console.log('--- FETCH MOCK VERIFICATION ---')
  console.log('URL:', capturedUrl)
  console.log('Cookie Header:', capturedHeaders.get('Cookie'))
  console.log('Correlation ID:', capturedHeaders.get('x-correlation-id'))

  if (capturedHeaders.get('Cookie') === 'session=mock-cookie-123' && 
      capturedHeaders.get('x-correlation-id') === 'mock-corr-id') {
    console.log('SUCCESS: GatewayClient correctly injected headers!')
  } else {
    console.error('FAILURE: GatewayClient failed to inject headers correctly.')
    process.exit(1)
  }

  globalThis.fetch = originalFetch
}

runTest().catch(err => {
  console.error(err)
  process.exit(1)
})
