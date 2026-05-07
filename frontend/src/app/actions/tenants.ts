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
    // Path relative to the root of the project when running in dev or production
    const configPath = join(process.cwd(), '..', 'backend', 'config', 'tenants.yaml')
    const fileContents = readFileSync(configPath, 'utf8')
    const config = yaml.load(fileContents) as GatewayConfig
    
    return config?.tenants || []
  } catch (err: any) {
    console.error('Failed to load tenants in Server Action:', err.message)
    return []
  }
}
