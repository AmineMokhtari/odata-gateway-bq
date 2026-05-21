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
