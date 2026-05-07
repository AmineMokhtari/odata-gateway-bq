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
