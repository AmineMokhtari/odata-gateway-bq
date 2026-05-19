/**
 * Copyright 2026 Amine MOKHTARI
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import fp from 'fastify-plugin'
import { LRUCache } from 'lru-cache'
import { DatasetMetadata } from '../services/bq-introspection.js'

export interface MetadataCachePluginOptions {
  max?: number
  ttl?: number
}

export default fp<MetadataCachePluginOptions>(async (fastify, opts) => {
  const cache = new LRUCache<string, DatasetMetadata>({
    // Maximum number of dataset schemas to keep in memory
    max: opts.max || 100,
    // Default TTL matching 24h requirement
    ttl: opts.ttl || 1000 * 60 * 60 * 24,
  })

  /**
   * Decorate fastify with metadata cache helpers.
   * Sharding is achieved by using 'projectId:datasetId' as the key.
   */
  fastify.decorate('metadataCache', {
    get: (key: string) => cache.get(key),
    set: (key: string, value: DatasetMetadata) => cache.set(key, value),
    delete: (key: string) => cache.delete(key),
    clear: () => cache.clear(),
    has: (key: string) => cache.has(key)
  })
}, {
  name: 'metadata-cache'
})

declare module 'fastify' {
  interface FastifyInstance {
    metadataCache: {
      get: (key: string) => DatasetMetadata | undefined
      set: (key: string, value: DatasetMetadata) => void
      delete: (key: string) => boolean
      clear: () => void
      has: (key: string) => boolean
    }
  }
}
