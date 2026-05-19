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
import fastifyCookie from '@fastify/cookie'
import fastifySecureSession from '@fastify/secure-session'
import fastifyOauth2 from '@fastify/oauth2'
import { fetchWithRetry } from '../../../common/src/utils/fetch-retry.js'
import { config } from '../config.js'

export interface UserIdentity {
  email?: string
  groups: string[]
  sub: string
  rawPayload?: JWTPayload
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
  sessionSecret?: string
}

export default fp<AuthPluginOptions>(async (fastify, opts) => {
  const anonymousMode = opts.anonymousMode !== undefined ? opts.anonymousMode : config.anonymousMode
  let issuer = opts.issuer !== undefined ? opts.issuer : process.env.OIDC_ISSUER
  const audience = opts.audience !== undefined ? opts.audience : process.env.OIDC_AUDIENCE
  const sessionSecret = process.env.SESSION_SECRET || 'a-very-long-secret-that-is-at-least-32-chars'
  const fetchImpl = opts.fetch || globalThis.fetch
  if (sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long')
  }

  if (!anonymousMode && (!issuer || !audience)) {
    throw new Error('OIDC_ISSUER and OIDC_AUDIENCE are mandatory for authentication. Security initialization failed.')
  }

  // Register cookie and session plugins
  await fastify.register(fastifyCookie)
  await fastify.register(fastifySecureSession, {
    secret: sessionSecret,
    salt: process.env.SESSION_SALT || 'mq9M97066986Csa7', // Must be 16 chars
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 3600 // 1 hour (in seconds for secure-session)
    }
  })

  // Register OAuth2/OIDC plugin
  if (!anonymousMode) {
    await fastify.register(fastifyOauth2, {
      name: 'oidc',
      scope: ['openid', 'profile', 'email', 'offline_access'], // offline_access for refresh token
      credentials: {
        client: {
          id: process.env.OIDC_CLIENT_ID || '',
          secret: process.env.OIDC_CLIENT_SECRET || ''
        }
      },
      startRedirectPath: '/auth/login',
      callbackUri: (req) => {
        const host = req.headers['x-forwarded-host'] || req.headers.host
        const protocol = req.headers['x-forwarded-proto'] || 'http'
        return `${protocol}://${host}/auth/callback`
      },
      discovery: {
        issuer: issuer!
      }
    })
  }

  fastify.decorate('isAnonymousMode', anonymousMode)

  if (anonymousMode) {
    fastify.log.warn('Authentication is running in ANONYMOUS_MODE. This is intended for development or offloaded authentication scenarios only.')
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

  const verifyToken = async (token: string): Promise<UserIdentity> => {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
      audience,
      clockTolerance: opts.clockTolerance || '30s',
      algorithms: opts.algorithms || ['RS256']
    })

    if (!payload.sub) {
      throw new Error('Mandatory "sub" claim missing from JWT payload')
    }

    const email = (payload.email || payload.upn || payload.preferred_username) as string | undefined
    const groups = (payload.groups || payload.roles || []) as string[]
    const sub = payload.sub as string

    return {
      email,
      groups: Array.isArray(groups) ? groups : [groups],
      sub,
      rawPayload: payload
    }
  }

  fastify.decorate('verifyToken', verifyToken)

  fastify.addHook('onRequest', async (request, reply) => {
    const routePattern = request.routeOptions.url
    if (routePattern === '/health' || routePattern?.startsWith('/health/') || routePattern?.startsWith('/auth/')) {
      return
    }

    if (anonymousMode) {
      // ... same as before
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
      return
    }

    // 1. Check Session
    if (request.session.get('user')) {
      const user = request.session.get('user')
      
      // Story 1.1 Patch: Silent Refresh Logic
      // If token is close to expiry (e.g., < 5 mins), try refreshing
      // For now, we just restore the identity. Full refresh exchange would happen here if we stored the refresh_token.
      
      request.user = user || null
      return
    }

    // 2. Fallback to Authorization Header (for legacy/direct API calls)
    const authHeader = request.headers.authorization
    if (authHeader && /^Bearer /i.test(authHeader)) {
      const token = authHeader.substring(7).trim()
      try {
        request.user = await verifyToken(token)
        return
      } catch (err: any) {
        fastify.log.error({ err: err.message }, 'JWT verification failed')
      }
    }

    return reply.code(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    })
  })
}, {
  name: 'auth'
})

import { Session } from '@fastify/secure-session'

declare module 'fastify' {
  interface FastifyInstance {
    isAnonymousMode: boolean
    verifyToken: (token: string) => Promise<UserIdentity>
  }
  interface FastifyRequest {
    user: UserIdentity | null
    session: Session
  }
}

export interface SessionUser {
  sub: string
  email?: string
  groups: string[]
}

declare module '@fastify/secure-session' {
  interface SessionData {
    user: SessionUser
    tokens?: any
  }
}
