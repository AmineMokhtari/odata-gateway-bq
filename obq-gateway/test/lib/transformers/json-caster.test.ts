import { test } from 'node:test'
import * as assert from 'node:assert'
import { applyJsonCasting } from '../../../src/lib/transformers/json-caster.js'
import { TableMetadata } from '../../../src/services/bq-introspection.js'

test('JSON Caster', async (t) => {
  const metadata: TableMetadata = {
    name: 'Sales',
    columns: [
      { name: 'id', type: 'INT64', isNullable: false },
      { name: 'details', type: 'RECORD', isNullable: true },
      { name: 'tags', type: 'RECORD', isNullable: true },
      { name: 'amount', type: 'FLOAT64', isNullable: true }
    ],
    relationships: []
  }

  await t.test('should cast RECORD columns in SELECT *', () => {
    const result = applyJsonCasting(metadata, '*')
    assert.equal(result, '`id`, TO_JSON_STRING(`details`) AS `details`, TO_JSON_STRING(`tags`) AS `tags`, `amount`')
  })

  await t.test('should cast specific RECORD column', () => {
    const result = applyJsonCasting(metadata, '`id`, `details`')
    assert.equal(result, '`id`, TO_JSON_STRING(`details`) AS `details`')
  })

  await t.test('should not cast non-RECORD columns', () => {
    const result = applyJsonCasting(metadata, '`id`, `amount`')
    assert.equal(result, '`id`, `amount`')
  })

  await t.test('should handle missing metadata gracefully', () => {
    // metadata columns don't match select
    const result = applyJsonCasting(metadata, '`unknown`')
    assert.equal(result, '`unknown`')
  })
})
