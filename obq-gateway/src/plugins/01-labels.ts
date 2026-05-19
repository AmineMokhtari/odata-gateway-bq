import fp from 'fastify-plugin'
import { randomUUID } from 'node:crypto'

export default fp(async (fastify) => {
  fastify.addHook('onRequest', async (request) => {
    // correlation_id is mandatory for BigQuery labeling
    request.correlationId = (request.headers['x-correlation-id'] as string) || randomUUID()
  })

  fastify.addHook('preHandler', async (request) => {
    // Extract user email for labeling (Story 1.1 Patch: sanitize for BQ labels)
    // BQ labels must be lowercase, alphanumeric or underscore, max 63 chars.
    let email = 'unauthenticated'
    if (request.user) {
      email = request.user.email || 'anonymous'
    }
    
    request.user_email = email.toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .substring(0, 63)
  })
}, {
  name: 'labels',
  dependencies: ['auth']
})

declare module 'fastify' {
  interface FastifyRequest {
    correlationId: string
    user_email: string
  }
}
