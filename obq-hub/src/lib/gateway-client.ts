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
    
    // 1. Get cookies from Next.js server context (or mock)
    let cookieHeader = ''
    try {
      const cookieStore = await this.cookiesFn()
      cookieHeader = cookieStore.toString()
    } catch (e) {
      console.warn('[GatewayClient] Failed to read cookies. Ensure this is called from a Server Component or Action.')
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
    if (cookieHeader) {
      mergedHeaders.set('Cookie', cookieHeader)
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
      const errorData = await response.json().catch(() => ({}))
      console.error(`[GatewayClient] Request failed: ${response.status} ${response.statusText}`, errorData)
      throw new ResponseError(
        errorData?.error?.message || response.statusText,
        response.status,
        errorData
      )
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
