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

export async function getTenants(): Promise<TenantConfig[]> {
  try {
    const envPath = process.env.TENANTS_CONFIG_PATH || 'backend/config/tenants.yaml';
    
    // Attempt multiple resolution strategies for local dev
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

    if (!success) {
      console.warn('Could not find tenants.yaml at any expected path');
      return [];
    }

    const config = yaml.load(fileContents) as GatewayConfig;
    return config?.tenants || [];
  } catch (err: any) {
    console.error('Failed to load tenants in Server Action:', err.message);
    return [];
  }
}
