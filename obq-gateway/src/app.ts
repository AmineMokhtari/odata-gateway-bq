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

import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload'
import { FastifyPluginAsync, FastifyServerOptions } from 'fastify'

import { validateConfig, config } from './config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export interface AppOptions extends FastifyServerOptions, Partial<AutoloadPluginOptions> {

}
// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {
  pluginTimeout: 30000,
  requestIdHeader: 'x-correlation-id',
  requestIdLogLabel: 'correlation_id',
  logger: true
}

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  // Fail fast if configuration is missing (Story 8.5 Tech Debt CFG)
  validateConfig()

  fastify.decorateRequest('getBaseUrl', function (this: any) {
    const rawForwardedHost = this.headers['x-forwarded-host']
    let host = (Array.isArray(rawForwardedHost) ? rawForwardedHost[0] : rawForwardedHost) || this.host || 'localhost'
    
    // Explicitly include port to ensure generated links are correct
    if (!host.includes(':')) {
      host = `${host}:${config.port}`
    }

    const rawForwardedProto = this.headers['x-forwarded-proto']
    const protocol = (Array.isArray(rawForwardedProto) ? rawForwardedProto[0] : rawForwardedProto) || this.protocol || 'http'
    
    return `${protocol}://${host}`
  })

  // Story 1.4: Echo x-correlation-id in every response for end-to-end tracing
  // OData 4.0 compliance: include protocol version in every response
  // Intercept all 3xx redirects to ensure they preserve the configured port and log traces
  fastify.addHook('onSend', async (request, reply, payload) => {
    reply.header('x-correlation-id', request.id)
    reply.header('OData-Version', '4.0')
    reply.header('X-Forwarded-Port', String(config.port))

    const statusCode = reply.statusCode
    if (statusCode >= 300 && statusCode < 400) {
      const location = reply.getHeader('location')
      if (typeof location === 'string') {
        const originalLocation = location
        const baseUrl = request.getBaseUrl()
        const parsedBaseUrl = new URL(baseUrl)

        let newLocation = location
        if (location.startsWith('/') && !location.startsWith('//')) {
          // Convert relative redirect to absolute including the correct host and port
          newLocation = `${baseUrl}${location}`
        } else {
          try {
            const parsedUrl = new URL(location)
            const requestHostName = parsedBaseUrl.hostname
            if (
              parsedUrl.hostname === 'localhost' ||
              parsedUrl.hostname === '127.0.0.1' ||
              parsedUrl.hostname === requestHostName
            ) {
              // Ensure local redirects use the incoming request's host/port
              parsedUrl.protocol = parsedBaseUrl.protocol
              parsedUrl.host = parsedBaseUrl.host
              newLocation = parsedUrl.toString()
            }
          } catch (e) {
            // Leave unchanged if not a valid URL
          }
        }

        if (newLocation !== originalLocation) {
          reply.header('location', newLocation)
          request.log.info({
            originalLocation,
            newLocation,
            statusCode,
            correlationId: request.id
          }, `HTTP redirect intercepted and updated to preserve port: ${originalLocation} -> ${newLocation}`)
        } else {
          request.log.info({
            location,
            statusCode,
            correlationId: request.id
          }, `HTTP redirect issued: ${location}`)
        }
      }
    }

    return payload
  })

  // Place here your custom code!

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  // eslint-disable-next-line no-void
  await fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: { ...opts }
  })

  // This loads all plugins defined in routes
  // define your routes in one of these
  // eslint-disable-next-line no-void
  await fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: { ...opts }
  })
}

declare module 'fastify' {
  interface FastifyRequest {
    getBaseUrl(): string
  }
}

export default app
export { app, options }
