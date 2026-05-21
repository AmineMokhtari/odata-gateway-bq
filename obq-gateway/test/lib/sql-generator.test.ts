import { test } from 'node:test'
import * as assert from 'node:assert'
import { translateODataToSql } from '../../src/lib/sql-generator.js'

test('SQL Generator', async (t) => {
  const table = 'my_dataset.Sales'

  await t.test('should handle empty query', () => {
    const { sql } = translateODataToSql(table, '')
    assert.equal(sql, 'SELECT * FROM `my_dataset.Sales` t')
  })

  await t.test('should translate simple filter', () => {
    const { sql, params } = translateODataToSql(table, '$filter=Region eq \'West\'')
    assert.equal(sql, 'SELECT * FROM `my_dataset.Sales` t WHERE (`Region` = @p0)')
    assert.equal(params.p0, 'West')
  })

  await t.test('should translate multiple filters', () => {
    const { sql, params } = translateODataToSql(table, '$filter=Region eq \'West\' and Amount gt 100')
    assert.equal(sql, 'SELECT * FROM `my_dataset.Sales` t WHERE ((`Region` = @p0) AND (`Amount` > @p1))')
    assert.equal(params.p0, 'West')
    assert.equal(params.p1, 100)
  })

  await t.test('should translate select', () => {
    const { sql } = translateODataToSql(table, '$select=Id,Region,Amount')
    assert.equal(sql, 'SELECT `Id`, `Region`, `Amount` FROM `my_dataset.Sales` t')
  })

  await t.test('should translate orderby', () => {
    const { sql } = translateODataToSql(table, '$orderby=Amount desc')
    assert.equal(sql, 'SELECT * FROM `my_dataset.Sales` t ORDER BY `Amount` DESC')
  })

  await t.test('should translate paging (top and skip)', () => {
    const { sql, params } = translateODataToSql(table, '$top=10&$skip=20')
    assert.equal(sql, 'SELECT * FROM `my_dataset.Sales` t LIMIT @p0 OFFSET @p1')
    assert.equal(params.p0, 10)
    assert.equal(params.p1, 20)
  })

  await t.test('should combine select, filter, orderby, top', () => {
    const { sql, params } = translateODataToSql(table, '$select=Region,Amount&$filter=Amount gt 500&$orderby=Amount desc&$top=5')
    assert.equal(sql, 'SELECT `Region`, `Amount` FROM `my_dataset.Sales` t WHERE (`Amount` > @p0) ORDER BY `Amount` DESC LIMIT @p1')
    assert.equal(params.p0, 500)
    assert.equal(params.p1, 5)
  })

  await t.test('should apply JSON casting when metadata is provided', () => {
    const metadata = {
      name: 'Sales',
      columns: [
        { name: 'Id', type: 'INT64', isNullable: false },
        { name: 'Details', type: 'RECORD', isNullable: true }
      ],
      relationships: []
    }
    const { sql } = translateODataToSql(table, '$select=Id,Details', metadata as any)
    assert.equal(sql, 'SELECT `Id`, TO_JSON_STRING(`Details`) AS `Details` FROM `my_dataset.Sales` t')
  })

  await t.test('should translate $apply with groupby and aggregate', () => {
    const { sql } = translateODataToSql(table, '$apply=groupby((Region),aggregate(Amount with sum as Total))')
    assert.equal(sql, 'SELECT `Region`, SUM(`Amount`) AS `Total` FROM `my_dataset.Sales` t GROUP BY `Region`')
  })

  await t.test('should throw PartitionFilterRequiredError when filter is missing', () => {
    const metadata = {
      name: 'Sales',
      columns: [],
      relationships: [],
      requiresPartitionFilter: true,
      partitionColumn: 'CreatedAt'
    }
    assert.throws(() => {
      translateODataToSql(table, '$select=Id', metadata as any)
    }, { name: 'PartitionFilterRequiredError', message: /requires a filter on column CreatedAt/ })
  })

  await t.test('should pass partition guard when filter is present', () => {
    const metadata = {
      name: 'Sales',
      columns: [],
      relationships: [],
      requiresPartitionFilter: true,
      partitionColumn: 'CreatedAt'
    }
    const { sql, params } = translateODataToSql(table, '$filter=CreatedAt ge 2023-01-01', metadata as any)
    assert.ok(sql.includes('`CreatedAt` >= @p0'))
    assert.equal(params.p0, '2023-01-01')
  })

  await t.test('should translate single-level $expand with select into ARRAY(SELECT AS STRUCT)', () => {
    const metadata = {
      name: 'Sales',
      columns: [
        { name: 'Id', type: 'INT64', isNullable: false },
        { name: 'Amount', type: 'NUMERIC', isNullable: true }
      ],
      relationships: [
        {
          name: 'Payments',
          column: 'Id',
          referencedTable: 'Payments',
          referencedColumn: 'SaleId',
          type: 'TO_MANY'
        }
      ]
    }
    const { sql } = translateODataToSql(table, '$select=Id&$expand=Payments($select=Id,Amount)', metadata as any)
    assert.equal(
      sql,
      'SELECT `Id`, ARRAY(SELECT AS STRUCT `Id`, `Amount` FROM `my_dataset.Payments` WHERE `SaleId` = `my_dataset.Sales`.`Id`) AS `Payments` FROM `my_dataset.Sales` t'
    )
  })

  await t.test('should translate multi-level nested $expand (Sales -> Payments -> Audits) recursively', () => {
    const allTables = [
      {
        name: 'Sales',
        columns: [{ name: 'Id', type: 'INT64', isNullable: false }],
        relationships: [
          {
            name: 'Payments',
            column: 'Id',
            referencedTable: 'Payments',
            referencedColumn: 'SaleId',
            type: 'TO_MANY'
          }
        ]
      },
      {
        name: 'Payments',
        columns: [{ name: 'Id', type: 'INT64', isNullable: false }],
        relationships: [
          {
            name: 'Audits',
            column: 'Id',
            referencedTable: 'Audits',
            referencedColumn: 'PaymentId',
            type: 'TO_MANY'
          }
        ]
      },
      {
        name: 'Audits',
        columns: [{ name: 'Id', type: 'INT64', isNullable: false }],
        relationships: []
      }
    ]
    const rootMetadata = allTables[0]
    
    const { sql } = translateODataToSql(
      table,
      '$select=Id&$expand=Payments($select=Id;$expand=Audits($select=Id))',
      rootMetadata as any,
      allTables as any[]
    )
    
    assert.equal(
      sql,
      'SELECT `Id`, ARRAY(SELECT AS STRUCT `Id`, ARRAY(SELECT AS STRUCT `Id` FROM `Audits` WHERE `PaymentId` = `Payments`.`Id`) AS `Audits` FROM `my_dataset.Payments` WHERE `SaleId` = `my_dataset.Sales`.`Id`) AS `Payments` FROM `my_dataset.Sales` t'
    )
  })
})
