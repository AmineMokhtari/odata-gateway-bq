import fp from 'fastify-plugin'
import compress, { FastifyCompressOptions } from '@fastify/compress'

/**
 * This plugin adds compression support to your Fastify application.
 * It is configurable via the ENABLE_COMPRESSION environment variable.
 *
 * @see https://github.com/fastify/fastify-compress
 */
export default fp<FastifyCompressOptions>(async (fastify) => {
  const enableCompression = process.env.ENABLE_COMPRESSION === 'true'

  if (enableCompression) {
    fastify.log.info('Response compression is ENABLED')
    await fastify.register(compress, {
      global: true,
      // Default to threshold of 1024 bytes
      threshold: 1024
    })
  } else {
    fastify.log.info('Response compression is DISABLED (ENABLE_COMPRESSION is not true)')
  }
})
