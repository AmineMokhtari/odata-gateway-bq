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

import fp from 'fastify-plugin'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

import { type TenantConfig, type GatewayConfig } from '../../../common/src/types/tenant.js'

export default fp(async (fastify, opts) => {
  const configPath = process.env.TENANTS_CONFIG_PATH || 
    (existsSync(join(__dirname, '..', '..', 'config', 'tenants.yaml')) 
      ? join(__dirname, '..', '..', 'config', 'tenants.yaml')
      : join(process.cwd(), 'backend', 'config', 'tenants.yaml'))
  const configMap = new Map<string, TenantConfig>()

  const loadConfig = () => {
    try {
      console.log(`[ConfigLoader] Resolved path: ${configPath}`)
      fastify.log.info({ configPath }, 'Loading tenant configuration')
      const fileContents = readFileSync(configPath, 'utf8')
      const config = yaml.load(fileContents) as GatewayConfig
      
      configMap.clear()
      if (config && config.tenants) {
        for (const tenant of config.tenants) {
          const key = `${tenant.project_id}:${tenant.dataset_id}`
          configMap.set(key, tenant)
        }
      }
      fastify.log.info({ tenantCount: configMap.size }, 'Tenant configuration loaded successfully')
      return true
    } catch (err: any) {
      fastify.log.error({ err: err.message, configPath }, 'Failed to load tenant configuration')
      return false
    }
  }

  // Initial load
  loadConfig()

  fastify.decorate('tenantsConfig', {
    get: (projectId: string, datasetId: string) => configMap.get(`${projectId}:${datasetId}`),
    all: () => Array.from(configMap.values()),
    reload: () => loadConfig()
  })
}, {
  name: 'config-loader'
})

declare module 'fastify' {
  interface FastifyInstance {
    tenantsConfig: {
      get: (projectId: string, datasetId: string) => TenantConfig | undefined
      all: () => TenantConfig[]
      reload: () => boolean
    }
  }
}
