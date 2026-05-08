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

import { BigQuery } from '@google-cloud/bigquery'

export interface ColumnMetadata {
  name: string
  type: string
  isNullable: boolean
  description?: string
}

export interface RelationshipMetadata {
  name: string
  column: string
  referencedProject?: string
  referencedDataset?: string
  referencedTable: string
  referencedColumn: string
}

export interface TableMetadata {
  name: string
  columns: ColumnMetadata[]
  relationships: RelationshipMetadata[]
  description?: string
  requiresPartitionFilter?: boolean
  partitionColumn?: string | null
}

export interface DatasetMetadata {
  projectId: string
  datasetId: string
  location: string
  tables: TableMetadata[]
}

/**
 * Service to crawl BigQuery INFORMATION_SCHEMA for metadata.
 * Meets Story 2.2 requirements.
 */
export async function getDatasetMetadata(
  bq: BigQuery,
  datasetId: string,
  dataProjectId?: string // Explicit data project ID (Story 7.1)
): Promise<DatasetMetadata> {
  const projectId = dataProjectId || bq.projectId

  // 1. Fetch dataset metadata to get the location
  // We explicitly target the data project if provided
  const [metadata] = await bq.dataset(datasetId, { projectId }).getMetadata()
  const location = metadata.location || 'US'

  // 2. Query INFORMATION_SCHEMA.TABLES for all tables
  // We use backtick escaping for identifiers to prevent SQL injection
  const tablesQuery = `
    SELECT table_name
    FROM \`${projectId.replace(/`/g, '``')}.${datasetId.replace(/`/g, '``')}.INFORMATION_SCHEMA.TABLES\`
    WHERE table_type = 'BASE TABLE' OR table_type = 'VIEW'
  `
  const [tableRows] = await bq.query({ query: tablesQuery, location })

  // 3. Query INFORMATION_SCHEMA.COLUMNS for all columns, including partitioning info
  const columnsQuery = `
    SELECT table_name, column_name, data_type, is_nullable,
           is_partitioning_column
    FROM \`${projectId.replace(/`/g, '``')}.${datasetId.replace(/`/g, '``')}.INFORMATION_SCHEMA.COLUMNS\`
    ORDER BY table_name, ordinal_position
  `
  const [columnRows] = await bq.query({ query: columnsQuery, location })

  // 3b. Query INFORMATION_SCHEMA.TABLE_OPTIONS for partition enforcement settings
  const optionsQuery = `
    SELECT table_name, option_name, option_value
    FROM \`${projectId.replace(/`/g, '``')}.${datasetId.replace(/`/g, '``')}.INFORMATION_SCHEMA.TABLE_OPTIONS\`
    WHERE option_name = 'require_partition_filter'
  `
  const [optionRows] = await bq.query({ query: optionsQuery, location })

  // 4. Query INFORMATION_SCHEMA for Foreign Key relationships
  // Fixed: Join on ordinal_position to correctly handle composite keys
  const relationshipsQuery = `
    SELECT
      k.constraint_name,
      k.table_name,
      k.column_name,
      c.table_catalog AS referenced_project_id,
      c.table_schema AS referenced_dataset_id,
      c.table_name AS referenced_table_name,
      c.column_name AS referenced_column_name
    FROM
      \`${projectId.replace(/`/g, '``')}.${datasetId.replace(/`/g, '``')}.INFORMATION_SCHEMA.KEY_COLUMN_USAGE\` k
    JOIN
      \`${projectId.replace(/`/g, '``')}.${datasetId.replace(/`/g, '``')}.INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE\` c
    ON
      k.constraint_name = c.constraint_name
      AND k.table_catalog = c.table_catalog
      AND k.table_schema = c.table_schema
    JOIN
      \`${projectId.replace(/`/g, '``')}.${datasetId.replace(/`/g, '``')}.INFORMATION_SCHEMA.TABLE_CONSTRAINTS\` tc
    ON
      k.constraint_name = tc.constraint_name
      AND k.table_name = tc.table_name
    WHERE
      tc.constraint_type = 'FOREIGN KEY'
  `
  const [relRows] = await bq.query({ query: relationshipsQuery, location })

  // 5. Map results into DatasetMetadata structure
  const tablesMap = new Map<string, TableMetadata>()

  // Initialize tables from TABLE query
  for (const row of tableRows) {
    tablesMap.set(row.table_name, {
      name: row.table_name,
      columns: [],
      relationships: []
    })
  }

  // Populate columns from COLUMNS query
  for (const row of columnRows) {
    const table = tablesMap.get(row.table_name)
    if (table) {
      table.columns.push({
        name: row.column_name,
        type: row.data_type,
        isNullable: row.is_nullable === 'YES'
      })
      if (row.is_partitioning_column === 'YES') {
        table.partitionColumn = row.column_name
      }
    }
  }

  // Populate table options (Story 8.5 Tech Debt PAR)
  for (const row of optionRows) {
    const table = tablesMap.get(row.table_name)
    if (table) {
      if (row.option_name === 'require_partition_filter') {
        table.requiresPartitionFilter = row.option_value === 'true'
      }
    }
  }

  // Populate relationships
  for (const row of relRows) {
    const table = tablesMap.get(row.table_name)
    if (table) {
      table.relationships.push({
        name: row.constraint_name,
        column: row.column_name,
        referencedProject: row.referenced_project_id,
        referencedDataset: row.referenced_dataset_id,
        referencedTable: row.referenced_table_name,
        referencedColumn: row.referenced_column_name
      })
    }
  }

  return {
    projectId,
    datasetId,
    location,
    tables: Array.from(tablesMap.values())
  }
}

/**
 * Fetches metadata for a specific table from INFORMATION_SCHEMA.
 * Useful for checking existence of tables not yet in the global cache.
 */
export async function getTableMetadata(
  bq: BigQuery,
  datasetId: string,
  tableName: string,
  location?: string,
  dataProjectId?: string // Explicit data project ID (Story 7.1)
): Promise<TableMetadata | null> {
  const projectId = dataProjectId || bq.projectId

  // 1. Fetch location if not provided
  let effectiveLocation = location
  if (!effectiveLocation) {
    const [metadata] = await bq.dataset(datasetId, { projectId }).getMetadata()
    effectiveLocation = metadata.location || 'US'
  }

  // 2. Query INFORMATION_SCHEMA for the specific table and its columns
  const query = `
    SELECT column_name, data_type, is_nullable
    FROM \`${projectId.replace(/`/g, '``')}.${datasetId.replace(/`/g, '``')}.INFORMATION_SCHEMA.COLUMNS\`
    WHERE table_name = @tableName
    ORDER BY ordinal_position
  `
  
  const [columnRows] = await bq.query({ 
    query, 
    location: effectiveLocation,
    params: { tableName }
  })

  if (columnRows.length === 0) {
    return null
  }

  return {
    name: tableName,
    columns: columnRows.map((row: any) => ({
      name: row.column_name,
      type: row.data_type,
      isNullable: row.is_nullable === 'YES'
    })),
    relationships: [] // Relationships usually fetched at dataset level for performance
  }
}
