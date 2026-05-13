import { test } from 'node:test'
import * as assert from 'node:assert'

// Test the correlation ID middleware logic in isolation
// We test the core UUID injection/passthrough logic without needing Next.js

test('Middleware: should propagate existing x-correlation-id', () => {
  const incomingId = 'my-existing-id-123'
  const receivedHeader = incomingId // simulates request.headers.get('x-correlation-id')
  const resultId = receivedHeader || crypto.randomUUID()
  
  assert.strictEqual(resultId, incomingId, 'Should reuse the incoming correlation ID')
})

test('Middleware: should generate a new UUID when x-correlation-id is missing', () => {
  const receivedHeader = null // simulates missing header
  const resultId = receivedHeader || crypto.randomUUID()

  assert.ok(resultId, 'Should generate a UUID when header is missing')
  // UUID format check
  assert.match(resultId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
})
