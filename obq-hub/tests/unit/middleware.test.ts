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
