import { TableMetadata } from '../../services/bq-introspection.js'

/**
 * Applies BigQuery's TO_JSON_STRING() to RECORD/REPEATED types.
 * Meets Story 3.3 requirements.
 * [Source: _bmad-output/planning-artifacts/prd.md#MVP - Minimum Viable Product (Phase 1)]
 */
export function applyJsonCasting(tableMetadata: TableMetadata, selectClause: string): string {
  // If select is '*', we need to explicitly list columns to apply TO_JSON_STRING
  const isSelectAll = selectClause.trim() === '*'
  
  const castedColumns = tableMetadata.columns.map(col => {
    const isRecord = col.type.toUpperCase() === 'RECORD'
    const colName = `\`${col.name}\``
    
    // Check if this column is explicitly selected or if all columns are selected
    const isExplicitlySelected = !isSelectAll && selectClause.includes(colName)
    
    if (isRecord && (isSelectAll || isExplicitlySelected)) {
      return `TO_JSON_STRING(${colName}) AS \`${col.name}\``
    }
    
    // If select all, we return the column name. 
    // If explicitly selected, we already have it in the original clause, 
    // but this utility is designed to rebuild or modify the SELECT list.
    return colName
  })

  // If the select clause was not '*', we should only return the columns that were originally there
  // but with casting applied where needed.
  if (!isSelectAll) {
    // Basic approach: split by comma, trim backticks, find metadata, apply casting
    return selectClause.split(',').map(part => {
      const trimmedPart = part.trim().replace(/`/g, '')
      const col = tableMetadata.columns.find(c => c.name === trimmedPart)
      if (col && col.type.toUpperCase() === 'RECORD') {
        return `TO_JSON_STRING(\`${col.name}\`) AS \`${col.name}\``
      }
      return part.trim()
    }).join(', ')
  }

  return castedColumns.join(', ')
}
