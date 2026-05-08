import { test } from 'node:test'
import * as assert from 'node:assert'
import { generateEdm } from '../../src/services/odata-metadata.js'
import { DatasetMetadata } from '../../src/services/bq-introspection.js'

test('OData EDM Generation', async (t) => {
  const dummyMetadata: DatasetMetadata = {
    projectId: 'my-project',
    datasetId: 'my_dataset',
    location: 'US',
    tables: [
      {
        name: 'Sales',
        columns: [
          { name: 'id', type: 'INT64', isNullable: false },
          { name: 'region', type: 'STRING', isNullable: true }
        ],
        relationships: []
      }
    ]
  }

  await t.test('should generate valid OData V4 XML', () => {
    const xml = generateEdm(dummyMetadata)
    
    assert.ok(xml.includes('<?xml version="1.0" encoding="utf-8"?>'))
    assert.ok(xml.includes('Version="4.0"'))
    assert.ok(xml.includes('Namespace="GCP.my_project.my_dataset"'))
    assert.ok(xml.includes('<EntityType Name="Sales">'))
    assert.ok(xml.includes('<Property Name="id" Type="Edm.Int64" Nullable="false">'))
    assert.ok(xml.includes('<Property Name="region" Type="Edm.String">'))
    assert.ok(xml.includes('<EntitySet Name="Sales" EntityType="GCP.my_project.my_dataset.Sales" />'))
  })
})
