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

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Proxy handler to manage Correlation ID tracing.
 * Ensures every request has an x-correlation-id.
 */
import { auth } from '@/auth'

export const proxy = auth((request) => {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()

  // 1. Inject into request headers so Server Components can read it
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-correlation-id', correlationId)

  // 2. Auth logic
  if (process.env.ANONYMOUS_MODE !== 'true') {
    const isLoggedIn = !!request.auth;
    const isAuthPage = request.nextUrl.pathname.startsWith('/login');

    if (!isLoggedIn && !isAuthPage) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('callbackUrl', request.nextUrl.href);
      return Response.redirect(redirectUrl);
    }

    if (isLoggedIn && isAuthPage) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      redirectUrl.searchParams.delete('callbackUrl');
      return Response.redirect(redirectUrl);
    }
  }

  // 3. Proceed with the request
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // 4. Inject into response headers so the browser/client can see it
  response.headers.set('x-correlation-id', correlationId)

  return response
})

/**
 * Configure which paths should trigger the proxy handler.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - mockServiceWorker.js (MSW file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|mockServiceWorker.js).*)',
  ],
}
