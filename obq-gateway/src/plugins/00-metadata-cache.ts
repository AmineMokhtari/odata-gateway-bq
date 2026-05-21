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

  // Pre-seed mock data for E2E testing (my-project:my_dataset)
  cache.set('my-project:my_dataset', {
    projectId: 'my-project',
    datasetId: 'my_dataset',
    location: 'US',
    schemaVersion: 'e2e-mock-version',
    tables: [
      {
        name: 'Customers',
        description: 'Customer Master Data',
        columns: [
          { name: 'id', type: 'Edm.Int64', isNullable: false, description: 'Customer Unique ID' },
          { name: 'name', type: 'Edm.String', isNullable: true, description: 'Customer Name' }
        ],
        relationships: [
          {
            name: 'Orders',
            column: 'id',
            referencedProject: 'my-project',
            referencedDataset: 'my_dataset',
            referencedTable: 'Orders',
            referencedColumn: 'customer_id',
            type: 'TO_MANY'
          }
        ]
      },
      {
        name: 'Orders',
        description: 'Customer Orders Data',
        columns: [
          { name: 'order_id', type: 'Edm.Int64', isNullable: false, description: 'Order Unique ID' },
          { name: 'customer_id', type: 'Edm.Int64', isNullable: true, description: 'Associated Customer ID' },
          { name: 'amount', type: 'Edm.Decimal', isNullable: true, description: 'Order Total Amount' }
        ],
        relationships: [
          {
            name: 'Customers',
            column: 'customer_id',
            referencedProject: 'my-project',
            referencedDataset: 'my_dataset',
            referencedTable: 'Customers',
            referencedColumn: 'id',
            type: 'TO_ONE'
          }
        ]
      }
    ]
  })

  // Pre-seed mock data for drift_dataset (Schema Mismatch E2E)
  cache.set('my-project:drift_dataset', {
    projectId: 'my-project',
    datasetId: 'drift_dataset',
    location: 'US',
    schemaVersion: 'drift-version-0',
    tables: [
      {
        name: 'Customers',
        description: 'Customer Master Data',
        columns: [
          { name: 'id', type: 'Edm.Int64', isNullable: false, description: 'Customer Unique ID' },
          { name: 'name', type: 'Edm.String', isNullable: true, description: 'Customer Name' }
        ],
        relationships: [
          {
            name: 'Orders',
            column: 'id',
            referencedProject: 'my-project',
            referencedDataset: 'drift_dataset',
            referencedTable: 'Orders',
            referencedColumn: 'customer_id',
            type: 'TO_MANY'
          }
        ]
      },
      {
        name: 'Orders',
        description: 'Customer Orders Data',
        columns: [
          { name: 'order_id', type: 'Edm.Int64', isNullable: false, description: 'Order Unique ID' },
          { name: 'customer_id', type: 'Edm.Int64', isNullable: true, description: 'Associated Customer ID' },
          { name: 'amount', type: 'Edm.Decimal', isNullable: true, description: 'Order Total Amount' }
        ],
        relationships: [
          {
            name: 'Customers',
            column: 'customer_id',
            referencedProject: 'my-project',
            referencedDataset: 'drift_dataset',
            referencedTable: 'Customers',
            referencedColumn: 'id',
            type: 'TO_ONE'
          }
        ]
      }
    ]
  } as any)

  // Pre-seed mock data for forbidden_dataset (Access Control 403 E2E)
  cache.set('my-project:forbidden_dataset', {
    projectId: 'my-project',
    datasetId: 'forbidden_dataset',
    location: 'US',
    schemaVersion: 'forbidden-version',
    tables: [
      {
        name: 'Customers',
        description: 'Customer Master Data',
        columns: [
          { name: 'id', type: 'Edm.Int64', isNullable: false, description: 'Customer Unique ID' },
          { name: 'name', type: 'Edm.String', isNullable: true, description: 'Customer Name' }
        ],
        relationships: [
          {
            name: 'Billing',
            column: 'id',
            referencedProject: 'my-project',
            referencedDataset: 'forbidden_dataset',
            referencedTable: 'Billing',
            referencedColumn: 'customer_id',
            type: 'TO_MANY'
          }
        ]
      },
      {
        name: 'Billing',
        description: 'Sensitive Billing Records',
        columns: [
          { name: 'billing_id', type: 'Edm.Int64', isNullable: false, description: 'Billing ID' },
          { name: 'customer_id', type: 'Edm.Int64', isNullable: true, description: 'Customer ID' },
          { name: 'card_number', type: 'Edm.String', isNullable: true, description: 'Encrypted Credit Card' }
        ],
        relationships: []
      }
    ]
  })

  // Pre-seed mock data for huge_dataset (Performance Fallback E2E)
  const hugeTables: any[] = []
  for (let i = 1; i <= 55; i++) {
    hugeTables.push({
      name: `Table${i}`,
      description: `Mock Table ${i} for performance fallback testing`,
      columns: [
        { name: 'id', type: 'Edm.Int64', isNullable: false, description: 'ID' },
        { name: 'name', type: 'Edm.String', isNullable: true, description: 'Name' }
      ],
      relationships: i === 1 ? [
        {
          name: 'Table2',
          column: 'id',
          referencedProject: 'my-project',
          referencedDataset: 'huge_dataset',
          referencedTable: 'Table2',
          referencedColumn: 'id',
          type: 'TO_MANY'
        }
      ] : []
    })
  }
  cache.set('my-project:huge_dataset', {
    projectId: 'my-project',
    datasetId: 'huge_dataset',
    location: 'US',
    schemaVersion: 'huge-version',
    tables: hugeTables
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
