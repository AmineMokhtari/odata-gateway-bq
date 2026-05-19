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
  type: 'TO_ONE' | 'TO_MANY'
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
    SELECT t.table_name, o.option_value as description
    FROM \`${projectId.replace(/`/g, '``')}.${datasetId.replace(/`/g, '``')}.INFORMATION_SCHEMA.TABLES\` t
    LEFT JOIN \`${projectId.replace(/`/g, '``')}.${datasetId.replace(/`/g, '``')}.INFORMATION_SCHEMA.TABLE_OPTIONS\` o
      ON t.table_name = o.table_name AND o.option_name = 'description'
    WHERE t.table_type = 'BASE TABLE' OR t.table_type = 'VIEW'
  `
  const [tableRows] = await bq.query({ query: tablesQuery, location })

  // 3. Query INFORMATION_SCHEMA.COLUMNS for all columns, including partitioning info
  const columnsQuery = `
    SELECT c.table_name, c.column_name, c.data_type, c.is_nullable,
           c.is_partitioning_column, f.description
    FROM \`${projectId.replace(/`/g, '``')}.${datasetId.replace(/`/g, '``')}.INFORMATION_SCHEMA.COLUMNS\` c
    LEFT JOIN \`${projectId.replace(/`/g, '``')}.${datasetId.replace(/`/g, '``')}.INFORMATION_SCHEMA.COLUMN_FIELD_PATHS\` f
      ON c.table_name = f.table_name AND c.column_name = f.column_name AND c.column_name = f.field_path
    ORDER BY c.table_name, c.ordinal_position
  `
  const [columnRows] = await bq.query({ query: columnsQuery, location })

  // 3b. Query INFORMATION_SCHEMA.TABLE_OPTIONS for partition enforcement settings
  const optionsQuery = `
    SELECT table_name, option_name, option_value
    FROM \`${projectId.replace(/`/g, '``')}.${datasetId.replace(/`/g, '``')}.INFORMATION_SCHEMA.TABLE_OPTIONS\`
    WHERE option_name = 'require_partition_filter'
  `
  const [optionRows] = await bq.query({ query: optionsQuery, location })

  // 4. Query INFORMATION_SCHEMA for Foreign Key relationships (Outbound and Inbound)
  // Story 9.1: Identifying 1:N vs N:1 cardinalities
  const relationshipsQuery = `
    -- Outbound Relationships (N:1)
    SELECT
      k.constraint_name as name,
      k.table_name,
      k.column_name,
      c.table_catalog AS referenced_project,
      c.table_schema AS referenced_dataset,
      c.table_name AS referenced_table,
      c.column_name AS referenced_column,
      'TO_ONE' as rel_type
    FROM
      \`${projectId.replace(/`/g, '``')}.${datasetId.replace(/`/g, '``')}.INFORMATION_SCHEMA.KEY_COLUMN_USAGE\` k
    JOIN
      \`${projectId.replace(/`/g, '``')}.${datasetId.replace(/`/g, '``')}.INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE\` c
    ON
      k.constraint_name = c.constraint_name
      AND k.constraint_catalog = c.constraint_catalog
      AND k.constraint_schema = c.constraint_schema
    JOIN
      \`${projectId.replace(/`/g, '``')}.${datasetId.replace(/`/g, '``')}.INFORMATION_SCHEMA.TABLE_CONSTRAINTS\` tc
    ON
      k.constraint_name = tc.constraint_name
      AND k.table_name = tc.table_name
    WHERE
      tc.constraint_type = 'FOREIGN KEY'

    UNION ALL

    -- Inbound Relationships (1:N)
    -- We flip the perspective: tables that point TO us are our 'To-Many' relationships
    SELECT
      CONCAT('FK_IN_', k.table_name, '_', k.column_name) as name,
      c.table_name, -- This is US (referenced table)
      c.column_name, -- This is OUR column (PK/referenced column)
      k.table_catalog AS referenced_project, -- This is THEM (source project)
      k.table_schema AS referenced_dataset, -- This is THEM (source dataset)
      k.table_name AS referenced_table, -- This is THEM (source table)
      k.column_name AS referenced_column, -- This is THEIR column (FK)
      'TO_MANY' as rel_type
    FROM
      \`${projectId.replace(/`/g, '``')}.${datasetId.replace(/`/g, '``')}.INFORMATION_SCHEMA.KEY_COLUMN_USAGE\` k
    JOIN
      \`${projectId.replace(/`/g, '``')}.${datasetId.replace(/`/g, '``')}.INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE\` c
    ON
      k.constraint_name = c.constraint_name
    JOIN
      \`${projectId.replace(/`/g, '``')}.${datasetId.replace(/`/g, '``')}.INFORMATION_SCHEMA.TABLE_CONSTRAINTS\` tc
    ON
      k.constraint_name = tc.constraint_name
      AND k.table_name = tc.table_name
    WHERE
      tc.constraint_type = 'FOREIGN KEY'
      AND c.table_name != k.table_name -- Exclude self-references for simplicity in this pass
  `
  const [relRows] = await bq.query({ query: relationshipsQuery, location })

  // 5. Map results into DatasetMetadata structure
  const tablesMap = new Map<string, TableMetadata>()

  // Initialize tables from TABLE query
  for (const row of tableRows) {
    tablesMap.set(row.table_name, {
      name: row.table_name,
      columns: [],
      relationships: [],
      description: row.description || undefined
    })
  }

  // Populate columns from COLUMNS query
  for (const row of columnRows) {
    const table = tablesMap.get(row.table_name)
    if (table) {
      table.columns.push({
        name: row.column_name,
        type: row.data_type,
        isNullable: row.is_nullable === 'YES',
        description: row.description || undefined
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
        name: row.name,
        column: row.column_name,
        referencedProject: row.referenced_project,
        referencedDataset: row.referenced_dataset,
        referencedTable: row.referenced_table,
        referencedColumn: row.referenced_column,
        type: row.rel_type
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

/**
 * Fetches descriptions for a list of datasets in a project from INFORMATION_SCHEMA.SCHEMATA.
 * Strictly meets the requirement of getting description from Information Schema.
 */
export async function getDatasetsDescriptions(
  bq: BigQuery,
  projectId: string,
  datasetIds: string[]
): Promise<Record<string, string>> {
  if (datasetIds.length === 0) return {}

  // INFORMATION_SCHEMA.SCHEMATA usually has description, but SCHEMA_OPTIONS is more reliable across regions
  const query = `
    SELECT s.schema_name, o.option_value as description
    FROM \`${projectId.replace(/`/g, '``')}.INFORMATION_SCHEMA.SCHEMATA\` s
    LEFT JOIN \`${projectId.replace(/`/g, '``')}.INFORMATION_SCHEMA.SCHEMA_OPTIONS\` o
      ON s.schema_name = o.schema_name AND o.option_name = 'description'
    WHERE s.schema_name IN UNNEST(@datasetIds)
  `

  const [rows] = await bq.query({
    query,
    params: { datasetIds }
  })

  const descriptions: Record<string, string> = {}
  for (const row of rows) {
    if (row.description) {
      descriptions[row.schema_name] = row.description
    }
  }

  return descriptions;
}
