import { test } from 'node:test'
import * as assert from 'node:assert'

test('simple test', async (t) => {
  console.log('Running simple test')
  assert.equal(1, 1)
})
