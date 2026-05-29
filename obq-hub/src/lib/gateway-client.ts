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

import { cookies as nextCookies, headers as nextHeaders } from 'next/headers'

export class ResponseError extends Error {
  public status: number
  public data: any

  constructor(message: string, status: number, data?: any) {
    super(message)
    this.name = 'ResponseError'
    this.status = status
    this.data = data
  }
}

/**
 * Unified Gateway Client for Next.js Server Components and Actions.
 * Handles automatic cookie propagation and correlation ID injection.
 */
export class GatewayClient {
  private baseUrl: string
  private cookiesFn: typeof nextCookies
  private headersFn: typeof nextHeaders

  constructor(deps?: { cookies?: typeof nextCookies; headers?: typeof nextHeaders }) {
    this.baseUrl = process.env.GATEWAY_URL || 'http://localhost:3005'
    this.cookiesFn = deps?.cookies || nextCookies
    this.headersFn = deps?.headers || nextHeaders
  }

  /**
   * Performs an authenticated fetch to the Fastify backend.
   * Automatically forwards session cookies from the current request.
   */
  async fetch(path: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
    
    // 1. Get access token from NextAuth session
    let bearerToken = ''
    try {
      const { auth } = await import('@/auth')
      const session = await auth()
      if (session && (session as any).idToken) {
        // Fallback to idToken if accessToken is not valid for the gateway, but typically idToken or accessToken is used.
        // We will use idToken because Azure AD v2 gateway validates the ID token.
        bearerToken = (session as any).idToken
      }
    } catch (e) {
      console.warn('[GatewayClient] Failed to read session. Ensure this is called from a Server Component or Action.')
    }

    // 2. Get headers from Next.js server context (for correlation-id passthrough)
    let correlationId = crypto.randomUUID()
    try {
      const currentHeaders = await this.headersFn()
      correlationId = currentHeaders.get('x-correlation-id') || correlationId
    } catch (e) {
      // Fallback to random UUID if headers are not available
    }

    // 3. Merge headers
    const mergedHeaders = new Headers(options.headers)
    if (bearerToken) {
      mergedHeaders.set('Authorization', `Bearer ${bearerToken}`)
    }
    mergedHeaders.set('x-correlation-id', correlationId)
    
    // Ensure we don't accidentally override content-type if already set
    if (!mergedHeaders.has('Content-Type') && !(options.body instanceof FormData)) {
      mergedHeaders.set('Content-Type', 'application/json')
    }

    const response = await fetch(url, {
      ...options,
      headers: mergedHeaders,
      next: { 
        revalidate: 0,
        ...(options as any).next
      }
    })

    if (!response.ok) {
      let errorData: any;
      let rawText: string | undefined;
      try {
        rawText = await response.text();
        errorData = rawText ? JSON.parse(rawText) : {};
      } catch (e) {
        errorData = { raw: rawText };
      }
      
      const errorMessage = errorData?.error?.message || errorData?.message || response.statusText;

      // Do not suppress 401s as just warnings; log them as errors to expose auth failures
      console.error(`[GatewayClient] Request failed: ${response.status} ${response.statusText}`, {
        message: errorMessage,
        data: errorData
      });

      throw new ResponseError(
        errorMessage,
        response.status,
        errorData
      );
    }

    return response
  }

  /**
   * Helper for GET requests
   */
  async get(path: string, options: RequestInit = {}) {
    return this.fetch(path, { ...options, method: 'GET' })
  }

  /**
   * Helper for POST requests
   */
  async post(path: string, body: any, options: RequestInit = {}) {
    return this.fetch(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body)
    })
  }
}

// Export a singleton instance
export const gatewayClient = new GatewayClient()
