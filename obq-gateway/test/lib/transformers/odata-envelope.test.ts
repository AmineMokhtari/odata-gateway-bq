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
import { test, describe } from 'node:test'
import assert from 'node:assert'
import { ODataEnvelopeTransformer } from '../../../src/lib/transformers/odata-envelope.js'
import { Readable } from 'node:stream'

describe('ODataEnvelopeTransformer', () => {
  test('should include @odata.count when provided', async () => {
    const transformer = new ODataEnvelopeTransformer({
      contextUrl: 'http://test/$metadata#Items',
      count: 100
    })

    const source = Readable.from([{ id: 1 }, { id: 2 }])
    let result = ''
    
    for await (const chunk of source.pipe(transformer)) {
      result += chunk
    }

    const json = JSON.parse(result)
    assert.strictEqual(json['@odata.context'], 'http://test/$metadata#Items')
    assert.strictEqual(json['@odata.count'], 100)
    assert.deepStrictEqual(json.value, [{ id: 1 }, { id: 2 }])
  })

  test('should include @odata.count even when value is empty', async () => {
    const transformer = new ODataEnvelopeTransformer({
      contextUrl: 'http://test/$metadata#Items',
      count: 5
    })

    const source = Readable.from([])
    let result = ''
    
    for await (const chunk of source.pipe(transformer)) {
      result += chunk
    }

    const json = JSON.parse(result)
    assert.strictEqual(json['@odata.count'], 5)
    assert.deepStrictEqual(json.value, [])
  })

  test('should not include @odata.count when not provided', async () => {
    const transformer = new ODataEnvelopeTransformer({
      contextUrl: 'http://test/$metadata#Items'
    })

    const source = Readable.from([{ id: 1 }])
    let result = ''
    
    for await (const chunk of source.pipe(transformer)) {
      result += chunk
    }

    const json = JSON.parse(result)
    assert.strictEqual(json['@odata.count'], undefined)
  })

  test('should flatten BigQuery wrapped values (timestamps, dates)', async () => {
    const transformer = new ODataEnvelopeTransformer({
      contextUrl: 'http://test/$metadata#Items'
    })

    const source = Readable.from([
      { 
        id: 1, 
        created: { value: '2023-10-27T10:00:00Z' },
        updated: { value: '2023-10-27T10:00:00' }, // Naive
        on: { value: '2023-10-27' }
      }
    ])
    let result = ''
    
    for await (const chunk of source.pipe(transformer)) {
      result += chunk
    }

    const json = JSON.parse(result)
    assert.deepStrictEqual(json.value[0], {
      id: 1,
      created: '2023-10-27T10:00:00Z',
      updated: '2023-10-27T10:00:00Z', // Should have Z appended
      on: '2023-10-27'
    })
  })
})
