import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'

test('default root route', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    url: '/'
  })
  // If OIDC is enabled, this will be 401. If disabled (by missing env), it will be 200.
  // Given our new "fail closed" policy, if env is missing, app WON'T start.
  // If env is present, this will be 401.
  assert.equal(res.statusCode, 401)
})
