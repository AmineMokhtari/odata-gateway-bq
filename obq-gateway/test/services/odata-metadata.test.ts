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
