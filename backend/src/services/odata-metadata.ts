import { DatasetMetadata, TableMetadata } from './bq-introspection.js'

/**
 * Maps BigQuery standard types to EDM types.
 * Meets Story 2.4 requirements.
 */
function mapBqToEdmType(bqType: string): string {
  const type = bqType.toUpperCase()
  if (type === 'STRING') return 'Edm.String'
  if (type === 'INT64') return 'Edm.Int64'
  if (type === 'FLOAT64') return 'Edm.Double'
  if (type === 'BOOL') return 'Edm.Boolean'
  if (type === 'TIMESTAMP') return 'Edm.DateTimeOffset'
  if (type === 'DATE') return 'Edm.Date'
  if (type === 'DATETIME') return 'Edm.DateTimeOffset'
  if (type === 'NUMERIC' || type === 'BIGNUMERIC') return 'Edm.Decimal'
  
  // Default for unknown types (e.g. RECORD which we cast to JSON string later)
  return 'Edm.String'
}

/**
 * Escapes special characters for XML content.
 */
function escapeXml(unsafe?: string): string {
  if (unsafe === undefined || unsafe === null) return ''
  return unsafe.toString().replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '"': return '&quot;'
      case "'": return '&apos;'
      default: return c
    }
  })
}

/**
 * Generates an OData V4 CSDL metadata document.
 * [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4]
 */
export function generateEdm(metadata: DatasetMetadata): string {
  const { projectId, datasetId, tables = [] } = metadata
  const namespace = `GCP.${projectId.replace(/-/g, '_')}.${datasetId}`
  
  let entityTypes = ''
  let entitySets = ''

  for (const table of tables) {
    const entityName = escapeXml(table.name || 'Unknown')
    let properties = ''
    let navigationProperties = ''
    
    for (const column of (table.columns || [])) {
      const edmType = mapBqToEdmType(column.type)
      const nullable = column.isNullable ? '' : ' Nullable="false"'
      const description = column.description ? `\n          <Annotation Term="Org.OData.Core.V1.Description" String="${escapeXml(column.description)}" />` : ''
      properties += `        <Property Name="${escapeXml(column.name)}" Type="${edmType}"${nullable}>${description}\n        </Property>\n`
    }

    for (const rel of (table.relationships || [])) {
      // Use Relationship Name for NavigationProperty to avoid collisions
      // if multiple FKs point to the same table.
      const navPropName = escapeXml(rel.name)
      navigationProperties += `        <NavigationProperty Name="${navPropName}" Type="${namespace}.${escapeXml(rel.referencedTable)}">
          <ReferentialConstraint Property="${escapeXml(rel.column)}" ReferencedProperty="${escapeXml(rel.referencedColumn)}" />
        </NavigationProperty>\n`
    }

    // Heuristic: Prefer columns named 'id' or ending in '_id' as keys
    const keyColumn = (table.columns || []).find(c => 
      c.name.toLowerCase() === 'id' || 
      c.name.toLowerCase().endsWith('_id') || 
      c.name.toLowerCase().endsWith('id')
    ) || (table.columns && table.columns[0])

      const tableDescription = table.description ? `\n        <Annotation Term="Org.OData.Core.V1.Description" String="${escapeXml(table.description)}" />` : ''
      entityTypes += `
      <EntityType Name="${entityName}">
        <Key>
          <PropertyRef Name="${escapeXml(keyColumn?.name || 'id')}" />
        </Key>${tableDescription}
${properties}${navigationProperties}      </EntityType>`

    entitySets += `        <EntitySet Name="${entityName}" EntityType="${namespace}.${entityName}" />\n`
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">
  <edmx:DataServices>
    <Schema Namespace="${namespace}" xmlns="http://docs.oasis-open.org/odata/ns/edm">
${entityTypes}
      <EntityContainer Name="BigQueryContext">
${entitySets}      </EntityContainer>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>`.trim()
}
