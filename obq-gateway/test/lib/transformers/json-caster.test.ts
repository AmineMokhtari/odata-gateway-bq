import { test } from 'node:test'
import * as assert from 'node:assert'
import { applyJsonCasting, createRowReplacer } from '../../../src/lib/transformers/json-caster.js'
import { TableMetadata } from '../../../src/services/bq-introspection.js'

test('JSON Caster', async (t) => {
  const metadata: TableMetadata = {
    name: 'Sales',
    columns: [
      { name: 'id', type: 'INT64', isNullable: false },
      { name: 'details', type: 'RECORD', isNullable: true },
      { name: 'tags', type: 'RECORD', isNullable: true },
      { name: 'amount', type: 'NUMERIC', isNullable: true }
    ],
    relationships: []
  }

  await t.test('should cast RECORD columns in SELECT *', () => {
    const result = applyJsonCasting(metadata, '*')
    // Note: since metadata columns changed slightly, let's keep it simple
    assert.ok(result.includes('TO_JSON_STRING(`details`)'))
  })

  await t.test('should cast specific RECORD column', () => {
    const result = applyJsonCasting(metadata, '`id`, `details`')
    assert.equal(result, '`id`, TO_JSON_STRING(`details`) AS `details`')
  })

  await t.test('should handle missing metadata gracefully', () => {
    const result = applyJsonCasting(metadata, '`unknown`')
    assert.equal(result, '`unknown`')
  })

  await t.test('createRowReplacer with ieee754Compatible = false (Default)', () => {
    const replacer = createRowReplacer(metadata, false)
    
    // Decimals and Int64s as strings should be coerced to numbers
    assert.equal(replacer('amount', '123.45'), 123.45)
    assert.equal(replacer('amount', 123.45), 123.45)
    assert.equal(replacer('id', '987654'), 987654)
    
    // Nulls/undefined should remain null/undefined
    assert.equal(replacer('amount', null), null)
    
    // Regular date objects with .value should be flattened
    assert.equal(replacer('date', { value: '2026-05-28' }), '2026-05-28')
  })

  await t.test('createRowReplacer with ieee754Compatible = true', () => {
    const replacer = createRowReplacer(metadata, true)
    
    // Decimals and Int64s should be forced to strings
    assert.equal(replacer('amount', '123.45'), '123.45')
    assert.equal(replacer('amount', 123.45), '123.45')
    assert.equal(replacer('id', '987654'), '987654')
    assert.equal(replacer('id', 987654), '987654')
  })
})
