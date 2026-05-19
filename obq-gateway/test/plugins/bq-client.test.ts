import { test } from 'node:test'
import * as assert from 'node:assert'
import Fastify from 'fastify'
import BQClient from '../../src/plugins/bq-client.js'

test('bq-client plugin', async (t) => {
  const fastify = Fastify()
  await fastify.register(BQClient)
  await fastify.ready()

  await t.test('should provide a BigQuery client factory', () => {
    assert.equal(typeof fastify.getBQClient, 'function')
    
    const client = fastify.getBQClient('test-project', 'US')
    assert.ok(client)
    assert.equal(client.projectId, 'test-project')
    assert.equal(client.location, 'US')
  })
})
