import fp from 'fastify-plugin'
import { BigQuery } from '@google-cloud/bigquery'
import { config } from '../config.js'

export interface BQClientPluginOptions {
  getBQClient?: (projectId: string, location?: string) => BigQuery
}

export default fp<BQClientPluginOptions>(async (fastify, opts) => {
  const clientCache = new Map<string, BigQuery>()

  const billingProjectId = config.billingProjectId
  
  if (!billingProjectId) {
    throw new Error('BQ_BILLING_PROJECT_ID environment variable is mandatory for BigQuery execution.')
  }
  
  /**
   * Factory function to get a BigQuery client.
   * All clients will use BQ_BILLING_PROJECT_ID for job submission (billing).
   */
  const getClient = opts.getBQClient || ((_projectId: string, location?: string) => {
    const cacheKey = `${billingProjectId}:${location || 'default'}`
    
    let client = clientCache.get(cacheKey)
    if (!client) {
      client = new BigQuery({
        projectId: billingProjectId,
        location
      })
      clientCache.set(cacheKey, client)
      fastify.log.info({ billingProjectId, location }, 'Instantiated new BigQuery client for billing project')
    }

    return client
  })

  fastify.decorate('getBQClient', getClient)
}, {
  name: 'bq-client'
})

declare module 'fastify' {
  interface FastifyInstance {
    getBQClient: (projectId: string, location?: string) => BigQuery
  }
}
