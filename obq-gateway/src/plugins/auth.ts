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
import { createRemoteJWKSet, jwtVerify, decodeJwt, JWTPayload } from 'jose'
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
  authorizationEndpoint?: string
}

function getFallbackAuthorizationUri(issuer: string): string {
  if (issuer.includes('login.microsoftonline.com')) {
    // Check if it's a v2.0 issuer URL
    if (issuer.endsWith('/v2.0') || issuer.endsWith('/v2.0/')) {
      const tenant = issuer.replace('https://login.microsoftonline.com/', '').replace('/v2.0', '').replace('/', '')
      return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`
    } else {
      const tenant = issuer.replace('https://login.microsoftonline.com/', '').replace('/', '')
      return `https://login.microsoftonline.com/${tenant}/oauth2/authorize`
    }
  }
  return `${issuer.replace(/\/$/, '')}/oauth2/authorize`
}

export default fp<AuthPluginOptions>(async (fastify, opts) => {
  const anonymousMode = opts.anonymousMode !== undefined ? opts.anonymousMode : config.anonymousMode
  let issuer = opts.issuer !== undefined ? opts.issuer : process.env.OIDC_ISSUER
  const audience = opts.audience !== undefined ? opts.audience : process.env.OIDC_AUDIENCE
  const fetchImpl = opts.fetch || globalThis.fetch
  if (!anonymousMode && (!issuer || !audience)) {
    throw new Error('OIDC_ISSUER and OIDC_AUDIENCE are mandatory for authentication. Security initialization failed.')
  }

  fastify.decorate('isAnonymousMode', anonymousMode)

  if (anonymousMode) {
    fastify.log.warn('Authentication is running in ANONYMOUS_MODE. This is intended for development or offloaded authentication scenarios only.')
  }

  // Do NOT mutate `issuer` here by appending a trailing slash,
  // as Azure AD requires the strict `iss` claim to NOT have a trailing slash during jwtVerify!

  let jwksUri: string | null = null
  let JWKS: any = null
  let authorizationEndpoint = opts.authorizationEndpoint || null

  if (!anonymousMode) {
    if (!opts.jwks) {
      fastify.log.debug('Starting OIDC discovery')
      try {
        // [Patch 8] Robust URL construction (ensure we don't truncate the issuer path)
        const discoveryBase = issuer!.endsWith('/') ? issuer! : `${issuer!}/`
        const configUrl = new URL('.well-known/openid-configuration', discoveryBase)
        
        // [Patch 4] Retry logic for discovery (with fast-fail to prevent Fastify plugin exec timeout)
        const response = await fetchWithRetry(fetchImpl, configUrl.toString(), { timeout: 4000 }, 2, 1000)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch OIDC config: ${response.statusText}`)
        }
        
        const oidcConfig = (await response.json()) as { jwks_uri: string; authorization_endpoint?: string }
        jwksUri = oidcConfig.jwks_uri
        
        if (oidcConfig.authorization_endpoint) {
          authorizationEndpoint = oidcConfig.authorization_endpoint
        }
        
        if (!jwksUri) {
          throw new Error('jwks_uri not found in OIDC configuration')
        }
        fastify.log.info({ jwksUri, authorizationEndpoint }, 'Discovered JWKS URI and Authorization Endpoint')
      } catch (err: any) {
        // [Patch 1 & 9] Fail closed on discovery failure
        fastify.log.error({ err: err.message }, 'Failed to initialize OIDC discovery')
        throw err 
      }
    } else {
      fastify.log.debug('Skipping OIDC discovery (JWKS provided)')
      jwksUri = 'internal://mock'
    }

    if (!authorizationEndpoint && issuer) {
      authorizationEndpoint = getFallbackAuthorizationUri(issuer)
    }

    JWKS = opts.jwks || createRemoteJWKSet(new URL(jwksUri!))
  }

  fastify.decorateRequest('user', null)

  const verifyToken = async (token: string): Promise<UserIdentity> => {
    // TEMPORARY: Decode without verify to see what the actual iss and aud claims are
    let tokenIss: string | undefined
    try {
      const decoded = decodeJwt(token)
      tokenIss = decoded.iss
      fastify.log.info({ tokenIss, configuredIss: issuer, tokenAud: decoded.aud }, 'JWT Issuer and Audience Check')
    } catch (e) {}

    // Support both Entra ID v1.0 (sts.windows.net) and v2.0 (login.microsoftonline.com) issuers dynamically for the configured tenant
    let verificationIssuer = issuer
    if (tokenIss && tokenIss.includes('sts.windows.net') && issuer) {
      const tenantMatch = issuer.match(/(?:login\.)?microsoftonline\.com\/([a-fA-F0-9-]+)/)
      if (tenantMatch) {
        const tenantId = tenantMatch[1]
        const v1Issuer = `https://sts.windows.net/${tenantId}/`
        const v1IssuerNoSlash = `https://sts.windows.net/${tenantId}`
        if (tokenIss === v1Issuer || tokenIss === v1IssuerNoSlash) {
          verificationIssuer = tokenIss
        }
      }
    }

    const allowedAudiences = [
      audience,
      audience ? `api://${audience}` : null,
      'http://local.odatabq.com:3005',
      'http://127.0.0.1:3005',
      'http://localhost:3005'
    ].filter(Boolean) as string[]

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: verificationIssuer,
      audience: allowedAudiences,
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
    if (
      routePattern === '/health' || 
      routePattern?.startsWith('/health/') || 
      routePattern?.startsWith('/auth/') ||
      routePattern === '/v1/telemetry' ||
      routePattern?.startsWith('/v1/telemetry')
    ) {
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

    // Only Bearer token is supported
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

    if (authorizationEndpoint) {
      const resourceUri = audience ? `api://${audience}` : ''
      reply.header('WWW-Authenticate', `Bearer authorization_uri="${authorizationEndpoint}", resource="${resourceUri}"`)
    } else {
      reply.header('WWW-Authenticate', 'Bearer')
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

declare module 'fastify' {
  interface FastifyInstance {
    isAnonymousMode: boolean
    verifyToken: (token: string) => Promise<UserIdentity>
  }
  interface FastifyRequest {
    user: UserIdentity | null
  }
}
