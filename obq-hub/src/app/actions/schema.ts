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

import { gatewayClient } from '@/lib/gateway-client';

export async function getDatasetSchema(projectId: string, datasetId: string) {
  try {
    const response = await gatewayClient.get(`/v1/${projectId}/${datasetId}/schema`, {
      cache: 'no-store',
    });

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

export async function fetchNeighborhoodAction(projectId: string, datasetId: string, table: string) {
  try {
    const response = await gatewayClient.get(`/v1/${projectId}/${datasetId}/neighborhood?table=${encodeURIComponent(table)}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const message = body?.error?.message || body?.message || `Backend returned ${response.status}`;
      console.error(`[schema] Failed to fetch neighborhood for ${projectId}/${datasetId}/${table}: ${message}`);
      return null;
    }

    return await response.json();
  } catch (err: any) {
    console.error(`[schema] Failed to fetch neighborhood for ${projectId}/${datasetId}/${table}:`, err.message);
    return null;
  }
}

export async function getDatasetMetricsAction(projectId: string, datasetId: string) {
  try {
    const schema = await getDatasetSchema(projectId, datasetId);
    if (!schema || !schema.tables) {
      return null;
    }

    const tableCount = schema.tables.length;
    let relationshipCount = 0;
    schema.tables.forEach((t: any) => {
      relationshipCount += t.relationships?.length || 0;
    });

    return { tableCount, relationshipCount, schemaVersion: schema.schemaVersion || '' };
  } catch (err: any) {
    console.error(`[schema] Failed to fetch metrics for ${projectId}/${datasetId}:`, err.message);
    return null;
  }
}


