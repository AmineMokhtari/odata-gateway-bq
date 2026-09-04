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
import { build } from '../helper.js'

test('telemetry endpoint responds 204 and processes asynchronously', async (t) => {
  const app = await build(t)

  const payload = {
    events: [
      {
        type: 'table_expanded',
        timestamp: Date.now(),
        metadata: { nodeId: 'Customers' }
      }
    ],
    clientVersion: '1.0.0',
    sessionId: 'test-session-id'
  }

  const res = await app.inject({
    method: 'POST',
    url: '/v1/telemetry',
    payload
  })

  assert.equal(res.statusCode, 204)
  assert.equal(res.payload, '')
})
