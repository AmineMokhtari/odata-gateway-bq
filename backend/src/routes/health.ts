import { FastifyPluginAsync } from 'fastify'

const health: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get('/health', async function (request, reply) {
    return { status: 'ok', version: process.env.npm_package_version || '1.0.0' }
  })
}

export default health
