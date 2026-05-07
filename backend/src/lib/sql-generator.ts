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

import { Lexer } from '../../../odata-v4-gcp/src/lexer.js'
import { Parser } from '../../../odata-v4-gcp/src/parser.js'
import { Translator } from '../../../odata-v4-gcp/src/translator.js'
import { BigQueryDialect } from '../../../odata-v4-gcp/src/dialects/bigquery.js'
import { TableMetadata } from '../services/bq-introspection.js'
import { applyJsonCasting } from './transformers/json-caster.js'

export class PartitionFilterRequiredError extends Error {
  constructor(public tableName: string, public columnName: string) {
    super(`Table ${tableName} requires a filter on column ${columnName} to prevent excessive scan costs.`)
    this.name = 'PartitionFilterRequiredError'
  }
}

export interface TranslationResult {
  sql: string
  params: Record<string, any>
}

/**
 * Helper to parse $apply query option (Story 8.4).
 * Supports groupby and aggregate transformations.
 */
function parseApply(applyStr: string): { groupBy: string[], aggregations: string[] } {
  const result = { groupBy: [] as string[], aggregations: [] as string[] }
  
  const groupByMatch = applyStr.match(/groupby\(\((.*?)\)/i)
  if (groupByMatch) {
    result.groupBy = groupByMatch[1].split(',').map(s => s.trim()).filter(s => s !== '')
  }

  const aggregateMatch = applyStr.match(/aggregate\((.*?)\)/i)
  if (aggregateMatch) {
    const aggs = aggregateMatch[1].split(',')
    for (const agg of aggs) {
      const partsWith = agg.trim().match(/(.*?) with (.*?) as (.*)/i)
      const partsCount = agg.trim().match(/\$count as (.*)/i)

      if (partsWith) {
        const [, prop, func, alias] = partsWith
        let bqFunc = func.toLowerCase()
        if (bqFunc === 'sum') bqFunc = 'SUM'
        else if (bqFunc === 'average') bqFunc = 'AVG'
        else if (bqFunc === 'min') bqFunc = 'MIN'
        else if (bqFunc === 'max') bqFunc = 'MAX'
        else if (bqFunc === 'countdistinct') bqFunc = 'COUNT(DISTINCT '
        else if (bqFunc === 'count') bqFunc = 'COUNT'
        
        if (bqFunc === 'COUNT(DISTINCT ') {
          result.aggregations.push(`COUNT(DISTINCT \`${prop.trim()}\`) AS \`${alias.trim()}\``)
        } else {
          result.aggregations.push(`${bqFunc}(\`${prop.trim()}\`) AS \`${alias.trim()}\``)
        }
      } else if (partsCount) {
        result.aggregations.push(`COUNT(*) AS \`${partsCount[1].trim()}\``)
      }
    }
  }

  return result
}

/**
 * Validates that a query contains a filter on the partition column if required.
 */
export function validatePartitionFilter(tableMetadata: TableMetadata, query: string, visitorWhere: string): void {
  if (tableMetadata.requiresPartitionFilter && tableMetadata.partitionColumn) {
    const col = tableMetadata.partitionColumn
    const backtickedCol = `\`${col}\``
    if (!visitorWhere.includes(backtickedCol)) {
      throw new PartitionFilterRequiredError(tableMetadata.name, col)
    }
  }
}

/**
 * Translates OData V4 query options to BigQuery SQL using the custom ov4g engine.
 */
export function translateODataToSql(table: string, query: string, tableMetadata?: TableMetadata): TranslationResult {
  // 1. Detect and separate $apply and $expand (manual for now)
  const applyMatch = query.match(/\$apply=(.*?)(&|$)/)
  const applyData = applyMatch ? parseApply(decodeURIComponent(applyMatch[1])) : null

  const odataSearchParams = new URLSearchParams(query)
  // No longer delete $expand, ov4g handles it now
  let formalQuery = decodeURIComponent(odataSearchParams.toString())
  formalQuery = formalQuery.replace(/\$apply=.*?(&|$)/, '').replace(/&$/, '')

  if (!formalQuery.startsWith('?') && formalQuery.length > 0) {
    formalQuery = '?' + formalQuery
  }

  // 2. Parse and Translate via ov4g
  let options: Record<string, any> = { select: 'SELECT *', where: '', orderby: '', limit: '', offset: '' }
  let params: Record<string, any> = {}

  if (formalQuery.length > 1) {
    try {
      const lexer = new Lexer(formalQuery)
      const parser = new Parser(lexer.tokenize())
      const ast = parser.parse()
      const dialect = new BigQueryDialect()
      const translator = new Translator(dialect)
      const result = translator.translate(ast)
      options = result.options
      params = result.params
    } catch (err: any) {
      // Fallback for empty or partially malformed but non-critical queries
      console.warn('ov4g-parser warning:', err.message)
    }
  }

  // 3. Assemble SQL
  let select = options.select
  if (options.compute && options.compute.length > 0) {
    // If select is * but we have computes, we want *, (expr) AS alias
    // If select is Id, we want Id, (expr) AS alias
    select += (select === 'SELECT *' ? '' : ', ') + options.compute.join(', ')
  }

  let where = options.where ? ` ${options.where}` : ''
  if (options.search) {
    where = where ? `${where} AND (${options.search})` : ` WHERE ${options.search}`
  }

  const orderby = options.orderby ? ` ${options.orderby}` : ''
  const limit = options.limit ? ` LIMIT ${options.limit}` : ''
  const offset = options.offset ? ` OFFSET ${options.offset}` : ''

  // Use alias 't' for table if search is used (SEARCH(t, @p) requires it)
  const tableRef = `\`${table}\` t`
  let from = `FROM ${tableRef}`

  // Apply $apply overrides
  if (applyData) {
    const selectParts = [
      ...applyData.groupBy.map(c => `\`${c}\``),
      ...applyData.aggregations
    ]
    select = `SELECT ${selectParts.join(', ')}`
  }

  // Apply $expand (using ov4g structure + relationship metadata)
  if (options.expand && options.expand.length > 0 && tableMetadata) {
    const expandParts = options.expand.map((expandSql: string) => {
      const navPropMatch = expandSql.match(/AS `(.*?)`$/)
      const navProp = navPropMatch ? navPropMatch[1] : ''
      const rel = tableMetadata.relationships.find(r => r.name === navProp)
      
      if (!rel) return expandSql

      // Construct table reference
      let referencedTable = ''
      if (rel.referencedProject && rel.referencedDataset) {
        referencedTable = `\`${rel.referencedProject}.${rel.referencedDataset}.${rel.referencedTable}\``
      } else {
        const tableParts = table.split('.')
        const datasetPrefix = tableParts.length > 1 ? tableParts.slice(0, -1).join('.') : ''
        referencedTable = datasetPrefix 
          ? `\`${datasetPrefix}.${rel.referencedTable}\``
          : `\`${rel.referencedTable}\``
      }

      // Inject Relationship JOIN condition into the subquery
      const joinCondition = `\`${rel.referencedColumn}\` = \`${table}\`.\`${rel.column}\``
      
      // replace the placeholder FROM in expandSql with the real one + JOIN condition
      // ov4g output: ARRAY(SELECT ... FROM `navProp` [WHERE ...]) AS `navProp`
      let processed = expandSql.replace(`FROM \`${navProp}\``, `FROM ${referencedTable}`)
      
      if (processed.includes(' WHERE ')) {
        processed = processed.replace(' WHERE ', ` WHERE (${joinCondition}) AND `)
      } else {
        // Find where to insert WHERE (after FROM)
        processed = processed.replace(referencedTable, `${referencedTable} WHERE ${joinCondition}`)
      }
      
      return processed
    })

    if (expandParts.length > 0) {
      select += (select === 'SELECT *' ? '' : ', ') + expandParts.join(', ')
    }
  }

  // Final validation and JSON casting
  if (tableMetadata) {
    validatePartitionFilter(tableMetadata, query, where)
    select = `SELECT ${applyJsonCasting(tableMetadata, select.substring(7))}`
  }

  const groupBy = applyData && applyData.groupBy.length > 0 
    ? ` GROUP BY ${applyData.groupBy.map(c => `\`${c}\``).join(', ')}`
    : ''

  const sql = `${select} ${from}${where}${groupBy}${orderby}${limit}${offset}`
  
  return { sql, params }
}
