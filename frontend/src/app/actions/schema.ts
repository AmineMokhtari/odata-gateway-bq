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

'use server'

import { fetchWithRetry } from '@/lib/fetch-retry';

export async function getDatasetSchema(projectId: string, datasetId: string) {
  try {
    const baseUrl = process.env.GATEWAY_URL || process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:3002';
    // BigQuery introspection can be slow on cold start — allow 30s before retrying.
    // signal: undefined opts out of Next.js's injected AbortSignal for this server-to-server call.
    const response = await fetchWithRetry(`${baseUrl}/v1/${projectId}/${datasetId}/schema`, {
      cache: 'no-store',
      signal: undefined,
    }, 3, 1000, 30_000);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const message = body?.error?.message || body?.message || `Backend returned ${response.status}`;
      console.error(`[schema] Failed to fetch schema for ${projectId}/${datasetId}: ${message}`);
      return null;
    }

    return await response.json();
  } catch (err: any) {
    console.error(`[schema] Failed to fetch schema for ${projectId}/${datasetId}:`, err.message);
    return null;
  }
}
