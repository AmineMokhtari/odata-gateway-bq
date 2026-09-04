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
