import { test } from 'node:test'
import assert from 'node:assert'
import Fastify from 'fastify'
import ConfigLoader from '../../src/plugins/00-config-loader.js'

test('config-loader plugin', async (t) => {
  const fastify = Fastify()
  await fastify.register(ConfigLoader)
  await fastify.ready()

  await t.test('should load sample config', () => {
    const tenants = fastify.tenantsConfig.all()
    assert.ok(tenants.length > 0)
  })

  await t.test('should get specific tenant', () => {
    const tenant = fastify.tenantsConfig.get('my-project', 'my_dataset')
    assert.ok(tenant)
    assert.equal(tenant?.scan_budget_gb, 10)
  })

  await t.test('should return undefined for unknown tenant', () => {
    const tenant = fastify.tenantsConfig.get('unknown', 'unknown')
    assert.equal(tenant, undefined)
  })
})
