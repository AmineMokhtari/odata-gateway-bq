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
