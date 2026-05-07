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

export interface AccessRules {
  emails?: string[]
  groups?: string[]
}

export interface TenantConfig {
  project_id: string
  dataset_id: string
  scan_budget_gb: number
  name?: string
  access_rules?: AccessRules
}

export interface GatewayConfig {
  tenants: TenantConfig[]
}
