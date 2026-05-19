import { test } from 'node:test'
import * as assert from 'node:assert'
import Fastify from 'fastify'
import MetadataCache from '../../src/plugins/00-metadata-cache.js'
import { DatasetMetadata } from '../../src/services/bq-introspection.js'

test('metadata cache plugin', async (t) => {
  const fastify = Fastify()
  await fastify.register(MetadataCache)
  await fastify.ready()

  const dummyMetadata: DatasetMetadata = {
    projectId: 'p1',
    datasetId: 'd1',
    location: 'US',
    tables: []
  }

  await t.test('should store and retrieve metadata', async () => {
    const key = 'p1:d1'
    fastify.metadataCache.set(key, dummyMetadata)
    
    assert.ok(fastify.metadataCache.has(key))
    const cached = fastify.metadataCache.get(key)
    assert.deepStrictEqual(cached, dummyMetadata)
  })

  await t.test('should isolate different tenants', async () => {
    const key1 = 'p1:d1'
    const key2 = 'p2:d2'
    const meta2 = { ...dummyMetadata, projectId: 'p2', datasetId: 'd2' }
    
    fastify.metadataCache.set(key1, dummyMetadata)
    fastify.metadataCache.set(key2, meta2)
    
    assert.deepStrictEqual(fastify.metadataCache.get(key1), dummyMetadata)
    assert.deepStrictEqual(fastify.metadataCache.get(key2), meta2)
  })

  await t.test('should delete specific entry', async () => {
    const key = 'p1:delete'
    fastify.metadataCache.set(key, dummyMetadata)
    assert.ok(fastify.metadataCache.has(key))
    
    fastify.metadataCache.delete(key)
    assert.ok(!fastify.metadataCache.has(key))
  })

  await t.test('should clear all entries', async () => {
    fastify.metadataCache.set('a:b', dummyMetadata)
    fastify.metadataCache.clear()
    assert.ok(!fastify.metadataCache.has('a:b'))
  })
})
