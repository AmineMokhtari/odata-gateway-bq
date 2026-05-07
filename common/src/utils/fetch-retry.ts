/**
 * Simple fetch wrapper with exponential backoff retries for transient errors.
 * Meets NFR for 3 retries with exponential backoff.
 */
export async function fetchWithRetry(
  fetchImpl: typeof fetch,
  url: string,
  options: RequestInit & { timeout?: number } = {},
  retries = 3,
  backoff = 1000
): Promise<Response> {
  let lastError: any
  const { timeout = 10000, ...fetchOptions } = options

  for (let i = 0; i < retries; i++) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetchImpl(url, {
        ...fetchOptions,
        signal: controller.signal
      })
      clearTimeout(id)

      // Retry on 5xx or 429
      if (response.ok) return response
      if (response.status < 500 && response.status !== 429) return response
      
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`)
    } catch (err: any) {
      clearTimeout(id)
      if (err.name === 'AbortError') {
        lastError = new Error('HandshakeTimeout: request timed out')
        // Don't retry on timeout? Actually, NFR might want retries. 
        // Let's retry on timeout too as it's a transient failure.
      } else {
        lastError = err
      }
    }
    
    if (i < retries - 1) {
      const delay = backoff * Math.pow(2, i)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw lastError || new Error(`Failed to fetch ${url} after ${retries} attempts`)
}
