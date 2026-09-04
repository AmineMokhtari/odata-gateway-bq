/*
Copyright 2026 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import { handlers } from "@/auth"
import { NextRequest } from "next/server"

function rewriteRequest(req: NextRequest) {
  const url = req.nextUrl.clone()
  if (!url.pathname.startsWith('/web')) {
    url.pathname = `/web${url.pathname}`
    const init: RequestInit = {
      headers: req.headers,
      method: req.method,
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = req.body as any
      // Node 18+ fetch requires duplex for streaming bodies
      ;(init as any).duplex = 'half'
    }
    return new NextRequest(url, init as any)
  }
  return req
}

export const GET = (req: NextRequest) => handlers.GET(rewriteRequest(req))
export const POST = (req: NextRequest) => handlers.POST(rewriteRequest(req))
export const dynamic = 'force-dynamic'
