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

import { cookies } from 'next/headers';
import { fetchWithRetry } from '@/lib/fetch-retry';

export async function getDatasetSchema(projectId: string, datasetId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3002';
    const response = await fetchWithRetry(`${baseUrl}/v1/${projectId}/${datasetId}/schema`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch dataset schema');
    }

    return await response.json();
  } catch (err: any) {
    console.error('Failed to fetch dataset schema:', err.message);
    throw err;
  }
}
