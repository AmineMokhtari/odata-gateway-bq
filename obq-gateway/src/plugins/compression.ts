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
}, {
  name: 'compression'
})
