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

/**
 * Simple fetch wrapper with per-attempt timeout and retries for robust
 * server-to-server communication. Composes with any caller-provided signal
 * (e.g. Next.js render lifecycle) so cancellation is always respected.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = process.env.NODE_ENV === 'development' ? 30 : 3,
  delay = 500,
  timeoutMs = 10_000,
): Promise<Response> {
  let lastError: any;

  for (let i = 0; i < retries; i++) {
    const timeoutController = new AbortController();
    const timer = setTimeout(() => timeoutController.abort(), timeoutMs);

    // Compose our timeout signal with any incoming signal (e.g. Next.js render abort)
    // AbortSignal.any() aborts when the first of the signals fires.
    const callerSignal = options.signal as AbortSignal | undefined;
    const signal = callerSignal
      ? AbortSignal.any([timeoutController.signal, callerSignal])
      : timeoutController.signal;

    // If the caller's signal is already aborted before we even try, bail immediately
    if (callerSignal?.aborted) {
      clearTimeout(timer);
      throw callerSignal.reason ?? new DOMException('The operation was aborted.', 'AbortError');
    }

    try {
      const response = await fetch(url, { ...options, signal });
      clearTimeout(timer);
      return response;
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;

      const isOurTimeout = timeoutController.signal.aborted && !callerSignal?.aborted;
      const isParentAbort = callerSignal?.aborted;
      // Unwrap the real cause (e.g. ECONNREFUSED hidden inside "fetch failed")
      const reason = err.cause?.message ?? err.message;
      const attempt = i + 1;

      // If the parent (Next.js) cancelled the render, don't waste retries
      if (isParentAbort) {
        console.warn(`[fetch-retry] Render aborted by Next.js for ${url} — not retrying.`);
        throw err;
      }

      if (i < retries - 1) {
        const backoff = delay * attempt;
        console.warn(
          `[fetch-retry] Attempt ${attempt}/${retries} failed for ${url} (${isOurTimeout ? `timeout after ${timeoutMs}ms` : reason}). Retrying in ${backoff}ms…`
        );
        await new Promise(resolve => setTimeout(resolve, backoff));
      } else {
        console.error(
          `[fetch-retry] All ${retries} attempts failed for ${url}: ${isOurTimeout ? `timeout after ${timeoutMs}ms` : reason}`
        );
      }
    }
  }

  throw lastError;
}

