import { test } from 'node:test'
import * as assert from 'node:assert'
import { getDatasetMetadata } from '../../src/services/bq-introspection.js'

test('BQ Metadata Introspection', async (t) => {
  const mockBq: any = {
    projectId: 'test-project',
    dataset: (id: string) => ({
      getMetadata: async () => [{ location: 'EU' }]
    }),
    query: async (options: any) => {
      if (options.query.includes('INFORMATION_SCHEMA.TABLES')) {
        return [[
          { table_name: 'Users' },
          { table_name: 'Orders' }
        ]]
      }
      if (options.query.includes('INFORMATION_SCHEMA.COLUMNS')) {
        return [[
          { table_name: 'Users', column_name: 'id', data_type: 'INT64', is_nullable: 'NO' },
          { table_name: 'Users', column_name: 'email', data_type: 'STRING', is_nullable: 'YES' },
          { table_name: 'Orders', column_name: 'id', data_type: 'INT64', is_nullable: 'NO' },
          { table_name: 'Orders', column_name: 'total', data_type: 'FLOAT64', is_nullable: 'YES' }
        ]]
      }
      return [[]]
    }
  }

  await t.test('should successfully introspect dataset', async () => {
    const metadata = await getDatasetMetadata(mockBq, 'test_dataset')
    
    assert.equal(metadata.projectId, 'test-project')
    assert.equal(metadata.datasetId, 'test_dataset')
    assert.equal(metadata.location, 'EU')
    assert.equal(metadata.tables.length, 2)
    
    const usersTable = metadata.tables.find(t => t.name === 'Users')
    assert.ok(usersTable)
    assert.equal(usersTable?.columns.length, 2)
    assert.equal(usersTable?.columns[0].name, 'id')
    assert.equal(usersTable?.columns[0].type, 'INT64')
    assert.equal(usersTable?.columns[0].isNullable, false)
  })

  await t.test('should handle missing tables/columns', async () => {
    const emptyBq: any = {
      projectId: 'empty-project',
      dataset: () => ({
        getMetadata: async () => [{ location: 'US' }]
      }),
      query: async () => [[]]
    }
    
    const metadata = await getDatasetMetadata(emptyBq, 'empty_dataset')
    assert.equal(metadata.tables.length, 0)
  })
})
