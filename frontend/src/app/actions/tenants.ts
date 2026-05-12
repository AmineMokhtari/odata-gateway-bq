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

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import yaml from 'js-yaml'
import { type GatewayConfig, type TenantConfig } from '@common/src/types/tenant'
import { fetchWithRetry } from '@/lib/fetch-retry';

export async function getTenants(): Promise<TenantConfig[]> {
  try {
    const baseUrl = process.env.GATEWAY_URL || process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:3002';
    const response = await fetchWithRetry(`${baseUrl}/v1/catalog`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
      signal: undefined,
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return data.value || [];
  } catch (err: any) {
    console.warn('Failed to fetch tenants from backend, falling back to local config:', err.message);
    
    // Fallback to local file reading if backend is unavailable
    try {
      const envPath = process.env.TENANTS_CONFIG_PATH || 'backend/config/tenants.yaml';
      const pathsToTry = [
        join(process.cwd(), envPath),
        join(process.cwd(), '..', envPath),
        join(process.cwd(), '..', '..', envPath)
      ];

      let fileContents = '';
      let success = false;

      for (const p of pathsToTry) {
        try {
          fileContents = readFileSync(p, 'utf8');
          success = true;
          break;
        } catch (e) {
          continue;
        }
      }

      if (!success) return [];

      const config = yaml.load(fileContents) as GatewayConfig;
      return config?.tenants || [];
    } catch (fallbackErr) {
      console.error('Fallback tenant loading failed:', fallbackErr);
      return [];
    }
  }
}
