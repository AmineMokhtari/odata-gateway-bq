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
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose'
import { fetchWithRetry } from '../../../common/src/utils/fetch-retry.js'
import { config } from '../config.js'

export interface UserIdentity {
  email?: string
  groups: string[]
  sub: string
  rawPayload: JWTPayload
  isAnonymous?: boolean
}

export interface AuthPluginOptions {
  issuer?: string
  audience?: string
  clockTolerance?: number | string
  algorithms?: string[]
  fetch?: typeof fetch
  jwks?: ReturnType<typeof createRemoteJWKSet>
  anonymousMode?: boolean
}

export default fp<AuthPluginOptions>(async (fastify, opts) => {
  const anonymousMode = opts.anonymousMode !== undefined ? opts.anonymousMode : config.anonymousMode
  let issuer = opts.issuer !== undefined ? opts.issuer : process.env.OIDC_ISSUER
  const audience = opts.audience !== undefined ? opts.audience : process.env.OIDC_AUDIENCE
  const fetchImpl = opts.fetch || globalThis.fetch

  fastify.decorate('isAnonymousMode', anonymousMode)

  if (anonymousMode) {
    fastify.log.warn('Authentication is running in ANONYMOUS_MODE. This is intended for development or offloaded authentication scenarios only.')
  } else if (!issuer || !audience) {
    throw new Error('OIDC_ISSUER and OIDC_AUDIENCE are mandatory for authentication. Security initialization failed.')
  }

  // Normalize issuer to have trailing slash for consistency
  if (issuer && !issuer.endsWith('/')) {
    issuer = `${issuer}/`
  }

  let jwksUri: string | null = null
  let JWKS: any = null

  if (!anonymousMode) {
    if (!opts.jwks) {
      fastify.log.debug('Starting OIDC discovery')
      try {
        // [Patch 8] Robust URL construction
        const configUrl = new URL('.well-known/openid-configuration', issuer!)
        
        // [Patch 4] Retry logic for discovery
        const response = await fetchWithRetry(fetchImpl, configUrl.toString())
        
        if (!response.ok) {
          throw new Error(`Failed to fetch OIDC config: ${response.statusText}`)
        }
        
        const config = (await response.json()) as { jwks_uri: string }
        jwksUri = config.jwks_uri
        
        if (!jwksUri) {
          throw new Error('jwks_uri not found in OIDC configuration')
        }
        fastify.log.info({ jwksUri }, 'Discovered JWKS URI')
      } catch (err: any) {
        // [Patch 1 & 9] Fail closed on discovery failure
        fastify.log.error({ err: err.message }, 'Failed to initialize OIDC discovery')
        throw err 
      }
    } else {
      fastify.log.debug('Skipping OIDC discovery (JWKS provided)')
      jwksUri = 'internal://mock'
    }

    JWKS = opts.jwks || createRemoteJWKSet(new URL(jwksUri!))
  }

  fastify.decorateRequest('user', null)

  fastify.addHook('onRequest', async (request, reply) => {
    // [Patch 2] Use route pattern matching for skip logic to ignore query params
    const routePattern = request.routeOptions.url
    if (routePattern === '/health' || routePattern?.startsWith('/health/')) {
      return
    }

    if (anonymousMode) {
      // Offloaded authentication or Dev mode: Extract from headers or default to anonymous
      const email = (request.headers['x-forwarded-email'] || request.headers['x-forwarded-user'] || request.headers['x-appengine-user-email']) as string | undefined
      const groupsHeader = request.headers['x-forwarded-groups'] as string | undefined
      const groups = groupsHeader ? groupsHeader.split(',').map(g => g.trim()) : []
      const sub = (request.headers['x-forwarded-sub'] || email || 'anonymous') as string

      request.user = {
        email,
        groups,
        sub,
        rawPayload: {},
        isAnonymous: true
      }
      
      fastify.log.debug({ user: request.user }, 'Anonymous/Offloaded identity assigned')
      return
    }

    const authHeader = request.headers.authorization

    // [Patch 6] Case-insensitive "Bearer" check
    if (!authHeader || !/^Bearer /i.test(authHeader)) {
      return reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid Authorization header'
        }
      })
    }

    const token = authHeader.substring(7).trim()
    if (!token) {
      return reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Empty Bearer token'
        }
      })
    }

    try {
      fastify.log.debug({ token: token.substring(0, 10) + '...' }, 'Verifying token')
      const { payload } = await jwtVerify(token, JWKS, {
        issuer,
        audience,
        // [Patch 5] Added clock tolerance
        clockTolerance: opts.clockTolerance || '30s',
        // [Patch 7] Restricted algorithms
        algorithms: opts.algorithms || ['RS256']
      })
      
      // [Patch 6] Basic presence validation for mandatory sub claim
      if (!payload.sub) {
        throw new Error('Mandatory "sub" claim missing from JWT payload')
      }

      // Story 5.1: Trusted Subsystem Identity Verification
      // [Patch 3] Strict Identity Mapping: No fallback of email to sub.
      const email = (payload.email || payload.upn || payload.preferred_username) as string | undefined
      const groups = (payload.groups || payload.roles || []) as string[]
      const sub = payload.sub as string

      request.user = {
        email,
        groups: Array.isArray(groups) ? groups : [groups],
        sub,
        rawPayload: payload
      }

      fastify.log.debug({ sub: payload.sub, email, groups: request.user.groups.length }, 'Token verified and identity extracted')
    } catch (err: any) {
      // [Patch 1] Fix: Mask token in logs
      const maskedToken = token.length > 20 ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}` : '***'
      fastify.log.error({ err: err.message, token: maskedToken }, 'JWT verification failed')
      
      return reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token'
        }
      })
    }
  })
}, {
  name: 'auth'
})

declare module 'fastify' {
  interface FastifyInstance {
    isAnonymousMode: boolean
  }
  interface FastifyRequest {
    user: UserIdentity | null
  }
}
