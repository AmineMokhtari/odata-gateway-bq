import fp from 'fastify-plugin'
import cors, { FastifyCorsOptions } from '@fastify/cors'

/**
 * This plugin enables the use of CORS in the application.
 *
 * @see https://github.com/fastify/fastify-cors
 */
export default fp<FastifyCorsOptions>(async (fastify) => {
  fastify.register(cors, {
    origin: true, // Allow all origins for development (Story 8.5 Tech Debt SEC)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-forwarded-email'],
    credentials: true
  })
})
