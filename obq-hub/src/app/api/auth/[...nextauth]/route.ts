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
    return new NextRequest(url, init)
  }
  return req
}

export const GET = (req: NextRequest) => handlers.GET(rewriteRequest(req))
export const POST = (req: NextRequest) => handlers.POST(rewriteRequest(req))
export const dynamic = 'force-dynamic'
