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

import { type FastifyPluginAsync } from 'fastify'
import { Readable } from 'node:stream'
import { getDatasetMetadata, getTableMetadata, getDatasetsDescriptions } from '../../services/bq-introspection.js'
import { getUserUsage, getGlobalUserUsage } from '../../services/usage-audit.js'
import { generateEdm } from '../../services/odata-metadata.js'
import { translateODataToSql, PartitionFilterRequiredError } from '../../lib/sql-generator.js'
import { createBigQueryStream, getJob, getJobResultStream, sanitizeLabelValue } from '../../services/bq-executor.js'
import { ODataEnvelopeTransformer } from '../../lib/transformers/odata-envelope.js'
import { pipeline } from 'node:stream/promises'
import { validateScanBudget } from '../../middleware/audit/dry-run-gate.js'
import { checkTenantAccess } from '../../middleware/auth/access-control.js'
import { config } from '../../config.js'

const v1: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  
  // Data Catalog (Story: Visual Data catalog)
  fastify.get('/catalog', async function (request, reply) {
    const tenants = fastify.tenantsConfig.all()
    
    // Group tenants by project to minimize BigQuery queries
    const projectMap = new Map<string, string[]>()
    for (const t of tenants) {
      if (!projectMap.has(t.project_id)) {
        projectMap.set(t.project_id, [])
      }
      projectMap.get(t.project_id)!.push(t.dataset_id)
    }

    const enrichedTenants = [...tenants]
    
    // Fetch descriptions for each project's datasets
    for (const [projectId, datasetIds] of projectMap.entries()) {
      try {
        const bq = fastify.getBQClient(projectId)
        const descriptions = await getDatasetsDescriptions(bq, projectId, datasetIds)
        
        // Map descriptions back to enrichedTenants
        for (const t of enrichedTenants) {
          if (t.project_id === projectId && descriptions[t.dataset_id]) {
            t.description = descriptions[t.dataset_id]
          }
        }
      } catch (err: any) {
        request.log.error({ err: err.message, projectId }, 'Failed to fetch dataset descriptions for catalog')
      }
    }

    return { value: enrichedTenants }
  })

  // OData Service Root
  fastify.get('/:projectId/:datasetId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          projectId: { type: 'string', pattern: '^[a-z][a-z0-9-]{5,29}$' },
          datasetId: { type: 'string', pattern: '^[a-zA-Z0-9_]+$' }
        },
        required: ['projectId', 'datasetId']
      }
    }
  }, async function (request, reply) {
    const { projectId, datasetId } = request.params as { projectId: string, datasetId: string }
    const cacheKey = `${projectId}:${datasetId}`
    
    // 1. Authenticate & Authorize (Story 5.2)
    const tenantConfig = fastify.tenantsConfig.get(projectId, datasetId)
    if (request.user && tenantConfig) {
      const isAuthorized = checkTenantAccess(request.user, tenantConfig, fastify.isAnonymousMode)
      if (!isAuthorized) {
        return reply.code(403).send({
          error: { code: 'Unauthorized', message: 'Access denied to this catalog' }
        })
      }
    }

    let metadata = fastify.metadataCache.get(cacheKey)
    if (!metadata) {
      const bq = fastify.getBQClient(projectId)
      metadata = await getDatasetMetadata(bq, datasetId)
      fastify.metadataCache.set(cacheKey, metadata)
    }

    // Record Pulse (Story 4.3 & 8.5)
    if (request.user) {
      fastify.usageTracker.recordPulse(projectId, datasetId, request.user.email || request.user.sub, request.id as string)
    }

    return {
      '@odata.context': `${request.protocol}://${request.hostname}/v1/${projectId}/${datasetId}/$metadata`,
      value: metadata.tables.map(t => ({
        name: t.name,
        kind: 'EntitySet',
        url: t.name
      }))
    }
  })

  // Dataset Schema (Full Metadata)
  fastify.get('/:projectId/:datasetId/schema', {
    schema: {
      params: {
        type: 'object',
        properties: {
          projectId: { type: 'string', pattern: '^[a-z][a-z0-9-]{5,29}$' },
          datasetId: { type: 'string', pattern: '^[a-zA-Z0-9_]+$' }
        },
        required: ['projectId', 'datasetId']
      }
    }
  }, async function (request, reply) {
    const { projectId, datasetId } = request.params as { projectId: string, datasetId: string }
    const cacheKey = `${projectId}:${datasetId}`
    
    // 1. Authenticate & Authorize
    const tenantConfig = fastify.tenantsConfig.get(projectId, datasetId)
    if (request.user && tenantConfig) {
      const isAuthorized = checkTenantAccess(request.user, tenantConfig, fastify.isAnonymousMode)
      if (!isAuthorized) {
        return reply.code(403).send({
          error: { code: 'Unauthorized', message: 'Access denied to this catalog' }
        })
      }
    }

    let metadata = fastify.metadataCache.get(cacheKey)
    if (!metadata) {
      const bq = fastify.getBQClient(projectId)
      console.log(`[DEBUG] Fetching metadata for ${projectId}:${datasetId}...`)
      try {
        metadata = await getDatasetMetadata(bq, datasetId)
        console.log(`[DEBUG] Successfully fetched metadata for ${projectId}:${datasetId}`)
        fastify.metadataCache.set(cacheKey, metadata)
      } catch (err: any) {
        console.error(`[ERROR] Failed to fetch metadata for ${projectId}:${datasetId}:`, err.message)
        throw err
      }
    }

    return metadata
  })

  // OData $metadata
  fastify.get('/:projectId/:datasetId/$metadata', {
    schema: {
      params: {
        type: 'object',
        properties: {
          projectId: { type: 'string', pattern: '^[a-z][a-z0-9-]{5,29}$' },
          datasetId: { type: 'string', pattern: '^[a-zA-Z0-9_]+$' }
        },
        required: ['projectId', 'datasetId']
      }
    }
  }, async function (request, reply) {
    const { projectId, datasetId } = request.params as { projectId: string, datasetId: string }
    const cacheKey = `${projectId}:${datasetId}:xml`
    
    // 1. Authenticate & Authorize (Story 5.2)
    const tenantConfig = fastify.tenantsConfig.get(projectId, datasetId)
    if (request.user && tenantConfig) {
      const isAuthorized = checkTenantAccess(request.user, tenantConfig, fastify.isAnonymousMode)
      if (!isAuthorized) {
        return reply.code(403).send({
          error: { code: 'Unauthorized', message: 'Access denied to this catalog' }
        })
      }
    }

    let edm = fastify.metadataCache.get(cacheKey) as unknown as string
    if (!edm) {
      const bq = fastify.getBQClient(projectId)
      const metadata = await getDatasetMetadata(bq, datasetId)
      edm = generateEdm(metadata)
      fastify.metadataCache.set(cacheKey, edm as any)
    }

    // Record Pulse (Story 4.3 & 8.5)
    if (request.user) {
      fastify.usageTracker.recordPulse(projectId, datasetId, request.user.email || request.user.sub, request.id as string)
    }

    return reply.type('application/xml').send(edm)
  })

  // OData EntitySet (Data Fetch)
  fastify.get('/:projectId/:datasetId/:entitySet', {
    schema: {
      params: {
        type: 'object',
        properties: {
          projectId: { type: 'string', pattern: '^[a-z][a-z0-9-]{5,29}$' },
          datasetId: { type: 'string', pattern: '^[a-zA-Z0-9_]+$' },
          entitySet: { type: 'string' }
        },
        required: ['projectId', 'datasetId', 'entitySet']
      }
    }
  }, async function (request, reply) {
    const { projectId, datasetId, entitySet } = request.params as { projectId: string, datasetId: string, entitySet: string }
    const cacheKey = `${projectId}:${datasetId}`
    
    // 1. Authenticate & Authorize (Story 5.2)
    const tenantConfig = fastify.tenantsConfig.get(projectId, datasetId)
    
    // If we're in Trusted Subsystem mode, check internal rules
    if (request.user && tenantConfig) {
      const isAuthorized = checkTenantAccess(request.user, tenantConfig, fastify.isAnonymousMode)
      if (!isAuthorized) {
        // [Patch 5] Log masked PII on authorization failure
        const userIdentifier = request.user.email || request.user.sub
        const maskedUser = userIdentifier.includes('@') 
          ? `${userIdentifier.substring(0, 3)}...${userIdentifier.substring(userIdentifier.indexOf('@'))}`
          : `sub:${request.user.sub.substring(0, 5)}...`
          
        request.log.warn({ user: maskedUser, projectId, datasetId }, 'User not authorized by internal access rules')
        
        return reply.code(403).send({
          error: {
            code: 'Unauthorized',
            message: 'You do not have permission to access this data catalog'
          }
        })
      }
    }

    // 2. Get Metadata
    let metadata = fastify.metadataCache.get(cacheKey)
    if (!metadata) {
      const bq = fastify.getBQClient(projectId)
      metadata = await getDatasetMetadata(bq, datasetId, projectId)
      fastify.metadataCache.set(cacheKey, metadata)
    }

    let tableMetadata = metadata.tables.find(t => t.name === entitySet)
    if (!tableMetadata) {
      // Check INFORMATION_SCHEMA before returning 404 (Story: Live discovery fallback)
      const bq = fastify.getBQClient(projectId, metadata.location)
      const freshTableMeta = await getTableMetadata(bq, datasetId, entitySet, metadata.location, projectId)
      
      if (freshTableMeta) {
        request.log.info({ entitySet, projectId, datasetId }, 'Table found in INFORMATION_SCHEMA (was missing from cache). Updating cache.')
        metadata.tables.push(freshTableMeta)
        fastify.metadataCache.set(cacheKey, metadata)
        // Invalidate XML cache so $metadata reflects the new table
        fastify.metadataCache.delete(`${cacheKey}:xml`)
        tableMetadata = freshTableMeta
      } else {
        return reply.notFound(`EntitySet '${entitySet}' not found`)
      }
    }

    // 3. Translate OData Query to SQL
    const url = new URL(request.url, `${request.protocol}://${request.hostname}`)
    
    // Filter out custom parameters (like explain) to avoid breaking odata-v4-parser
    const odataSearchParams = new URLSearchParams()
    for (const [key, value] of url.searchParams) {
      if (key.startsWith('$')) {
        odataSearchParams.append(key, value)
      }
    }
    const odataQuery = decodeURIComponent(odataSearchParams.toString().replace(/\+/g, '%20'))

    request.log.debug({ url: url.toString(), odataQuery }, 'Translating OData to SQL')
    let translation: { sql: string, params: Record<string, any> }
    try {
      translation = translateODataToSql(`${projectId}.${datasetId}.${entitySet}`, odataQuery, tableMetadata)
    } catch (err: any) {
      if (err instanceof PartitionFilterRequiredError) {
        return reply.status(400).send({
          error: {
            code: 'PARTITION_FILTER_REQUIRED',
            message: err.message,
            target: err.columnName,
            details: [
              {
                code: 'ELENA_TIP',
                message: `Elena Tip: The table '${err.tableName}' is partitioned. To keep costs low and performance high, BigQuery requires a filter on '${err.columnName}'. Try adding '$filter=${err.columnName} ge ...' to your URL.`
              }
            ]
          }
        })
      }
      throw err
    }

    // 4. Handle Stateful Paging (Story 8.1)
    const skiptoken = url.searchParams.get('$skiptoken')
    const pageSize = parseInt(url.searchParams.get('$top') || '50', 10)
    let currentOffset = 0
    
    let bqStream: Readable
    let job: any
    let estimatedBytes = 0

    const bq = fastify.getBQClient(projectId, metadata.location)
    const userEmail = request.user?.email || request.user?.sub || 'anonymous'
    const correlationId = request.id as string

    if (skiptoken) {
      // Resume from existing Job ID
      // Fixed: Use lastIndexOf(':') to safely parse offset if Job ID contains colons or underscores
      const lastColonIndex = skiptoken.lastIndexOf(':')
      if (lastColonIndex === -1) {
        return reply.code(400).send({ error: { code: 'InvalidSkipToken', message: 'Malformed $skiptoken' } })
      }
      
      const jobId = skiptoken.substring(0, lastColonIndex)
      const offsetStr = skiptoken.substring(lastColonIndex + 1)
      currentOffset = parseInt(offsetStr, 10) || 0
      
      request.log.info({ jobId, currentOffset, pageSize }, 'Resuming query from skiptoken (Smart Paging)')
      
      try {
        job = await getJob(bq, jobId, metadata.location)
        
        // [Security] User Isolation for Job IDs (Story 8.1)
        const jobLabels = job.metadata.configuration?.labels || job.metadata.labels || {}
        const expectedUserIdentity = sanitizeLabelValue(userEmail)
        if (jobLabels.user_identity !== expectedUserIdentity) {
          request.log.error({ jobId, expected: expectedUserIdentity, actual: jobLabels.user_identity }, 'Job isolation breach attempt: user identity mismatch')
          return reply.code(403).send({
            error: {
              code: 'AccessDenied',
              message: 'You are not authorized to access this query session'
            }
          })
        }

        // Record Pulse for cached hit (Story 8.1 Transparency)
        if (request.user) {
          fastify.usageTracker.recordPulse(projectId, datasetId, userEmail, correlationId)
          fastify.usageTracker.recordUsage(projectId, datasetId, 0, userEmail, correlationId) // 0-byte usage for cached hit
        }
        bqStream = getJobResultStream(job, { startIndex: currentOffset, maxResults: pageSize })
        estimatedBytes = 0 
      } catch (err: any) {
        request.log.error({ err: err.message, jobId }, 'Failed to retrieve BigQuery job for skiptoken')
        return reply.code(410).send({ 
          error: { 
            code: 'SessionExpired', 
            message: 'Your query session has expired or the job ID is invalid. Please restart your query.' 
          } 
        })
      }
    } else {
      // New Query Execution
      const isExplain = url.searchParams.get('explain') === 'true'

      // Record Pulse (Story 4.3)
      if (request.user) {
        fastify.usageTracker.recordPulse(projectId, datasetId, userEmail, correlationId)
      }

      const budgetGb = tenantConfig ? tenantConfig.scan_budget_gb : 1 
      const budgetBytes = budgetGb * 1024 * 1024 * 1024
      
      try {
        estimatedBytes = await validateScanBudget({
          bq,
          sql: translation.sql,
          params: translation.params,
          location: metadata.location,
          budgetBytes,
          userEmail,
          correlationId,
          dataProjectId: projectId,
          datasetId
        })
      } catch (err: any) {
        if (err.code === 'BudgetExceeded') {
          const portalUrl = process.env.PORTAL_URL || `${request.protocol}://${request.hostname}/web`
          const explainUrl = `${portalUrl}/catalog/${projectId}/${datasetId}/${entitySet}/explain?${odataSearchParams.toString()}`

          return reply.code(400).send({
            error: {
              code: 'BudgetExceeded',
              message: `${err.message}. [Visual Explanation: ${explainUrl}]`,
              details: [
                {
                  code: 'ELENA_TIP',
                  message: `Elena Tip: This query is too large for your current budget of ${budgetGb}GB. Try selecting fewer columns or adding a $filter to reduce the scan size.`
                }
              ]
            }
          })
        }
        throw err
      }

      // Handle Explain response
      if (isExplain) {
        return {
          sql: translation.sql,
          params: translation.params,
          estimatedBytes,
          budgetBytes,
          location: metadata.location
        }
      }

      // Execute BigQuery Job
      const result = await createBigQueryStream(
        bq,
        translation.sql,
        userEmail,
        correlationId,
        projectId,
        datasetId,
        translation.params,
        metadata.location
      )
      bqStream = result.stream
      job = result.job
    }

    let isStreamFinished = false
    const disconnectListener = () => {
      if (!isStreamFinished) {
        request.log.warn({ jobId: job.id, correlationId }, 'Client disconnected, canceling BigQuery job')
        job.cancel().catch((err: any) => {
          request.log.error({ err: err.message, jobId: job.id }, 'Failed to cancel BigQuery job')
        })
      }
    }
    request.raw.on('close', disconnectListener)

    // Record usage
    if (estimatedBytes > 0) {
      fastify.usageTracker.recordUsage(projectId, datasetId, estimatedBytes, userEmail, correlationId)
    }

    // 5. Calculate Next Link (Story 8.1)
    let nextLink: string | undefined
    
    // Fixed: Wait for job metadata if it's not yet available (race condition fix)
    if (!job.metadata.statistics?.query?.totalRows) {
      const [metadata] = await job.getMetadata()
      job.metadata = metadata
    }

    const totalRows = parseInt(job.metadata.statistics?.query?.totalRows || '0', 10)
    const nextOffset = currentOffset + pageSize
    
    if (nextOffset < totalRows) {
      const nextUrl = new URL(url.toString())
      nextUrl.searchParams.set('$skiptoken', `${job.id}:${nextOffset}`)
      nextLink = nextUrl.toString()
    }

    // 6. Stream Results with OData Envelope
    const contextUrl = `${request.protocol}://${request.hostname}/v1/${projectId}/${datasetId}/$metadata#${entitySet}`
    const isCountRequested = url.searchParams.get('$count') === 'true'
    const transformer = new ODataEnvelopeTransformer({ 
      contextUrl, 
      nextLink,
      count: isCountRequested ? totalRows : undefined
    })

    reply.type('application/json')
    
    try {
      await pipeline(bqStream, transformer, reply.raw)
      isStreamFinished = true
    } catch (err: any) {
      if (err.code === 'ERR_STREAM_PREMATURE_CLOSE') {
        request.log.info({ jobId: job.id, correlationId }, 'Stream closed prematurely by client (expected during large data refreshes)')
      } else {
        request.log.error({ err: err.message, jobId: job.id, correlationId }, 'Streaming pipeline failed')
        throw err
      }
    } finally {
      request.raw.removeListener('close', disconnectListener)
    }
  })

  // Admin Routes
  fastify.post('/admin/refresh/:projectId/:datasetId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          projectId: { type: 'string', pattern: '^[a-z][a-z0-9-]{5,29}$' },
          datasetId: { type: 'string', pattern: '^[a-zA-Z0-9_]+$' }
        },
        required: ['projectId', 'datasetId']
      }
    }
  }, async function (request, reply) {
    const { projectId, datasetId } = request.params as { projectId: string, datasetId: string }
    const cacheKeyBase = `${projectId}:${datasetId}`
    const deletedMeta = fastify.metadataCache.delete(cacheKeyBase)
    const deletedXml = fastify.metadataCache.delete(`${cacheKeyBase}:xml`)

    return { projectId, datasetId, refreshed: deletedMeta || deletedXml }
  })

  fastify.get('/admin/usage/:projectId/:datasetId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          projectId: { type: 'string', pattern: '^[a-z][a-z0-9-]{5,29}$' },
          datasetId: { type: 'string', pattern: '^[a-zA-Z0-9_]+$' }
        },
        required: ['projectId', 'datasetId']
      }
    }
  }, async function (request, reply) {
    const { projectId, datasetId } = request.params as { projectId: string, datasetId: string }
    return {
      projectId,
      datasetId,
      usage: fastify.usageTracker.getUsage(projectId, datasetId)
    }
  })

  fastify.post('/admin/config/reload', async function (request, reply) {
    const success = fastify.tenantsConfig.reload()
    if (success) {
      return { status: 'success', message: 'Tenant configuration reloaded', tenantCount: fastify.tenantsConfig.all().length }
    } else {
      return reply.code(500).send({ error: { code: 'ReloadFailed', message: 'Failed to reload configuration file' } })
    }
  })

  fastify.get('/:projectId/:datasetId/usage', {
    schema: {
      params: {
        type: 'object',
        properties: {
          projectId: { type: 'string', pattern: '^[a-z][a-z0-9-]{5,29}$' },
          datasetId: { type: 'string', pattern: '^[a-zA-Z0-9_]+$' }
        },
        required: ['projectId', 'datasetId']
      }
    }
  }, async function (request, reply) {
    const { projectId, datasetId } = request.params as { projectId: string, datasetId: string }
    const user = request.user
    if (!user) {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'User identity required for usage tracking' } })
    }

    const bq = fastify.getBQClient(projectId)
    const cacheKey = `${projectId}:${datasetId}`
    const metadata = fastify.metadataCache.get(cacheKey)

    const usage = await getUserUsage(bq, user.email || user.sub, metadata?.location)
    
    return {
      ...usage,
      userEmail: user.email || user.sub,
      budgetBytes: config.defaultScanBudgetGb * 1024 * 1024 * 1024
    }
  })

  fastify.post('/admin/refresh-all', async function (request, reply) {
    fastify.metadataCache.clear()
    fastify.usageTracker.clear()
    return { status: 'success' }
  })

  // Connection Status (Story 4.3 Success Pulse)
  fastify.get('/connection-status/:projectId/:datasetId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          projectId: { type: 'string', pattern: '^[a-z][a-z0-9-]{5,29}$' },
          datasetId: { type: 'string', pattern: '^[a-zA-Z0-9_]+$' }
        },
        required: ['projectId', 'datasetId']
      }
    }
  }, async function (request, reply) {
    const { projectId, datasetId } = request.params as { projectId: string, datasetId: string }
    const user = request.user
    
    if (!user) {
      return { status: 'anonymous', lastActive: null }
    }

    const userId = user.email || user.sub
    const pulse = fastify.usageTracker.getPulse(projectId, datasetId, userId)

    return {
      projectId,
      datasetId,
      userId: user.email ? 'hidden' : user.sub, // Don't leak email in JSON if possible
      status: pulse ? 'connected' : 'listening',
      lastActive: pulse ? pulse.lastActive : null,
      serverTime: Date.now()
    }
  })

}

export default v1
