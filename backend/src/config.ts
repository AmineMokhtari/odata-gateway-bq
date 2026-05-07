/**
 * Centralized Configuration for OData BigQuery Server.
 * [Source: Story 8.5 Tech Debt CFG]
 */

export const config = {
  // GCP / BigQuery Core
  billingProjectId: process.env.BQ_BILLING_PROJECT_ID || '',
  defaultLocation: process.env.BQ_DEFAULT_LOCATION || 'US',
  
  // Audit Logs (Story 8.5)
  auditDataset: process.env.BQ_AUDIT_DATASET || 'audit_logs',
  auditTable: process.env.BQ_AUDIT_TABLE || 'api_audit',

  // Identity & Access (Epic 1)
  oidcIssuer: process.env.OIDC_ISSUER || '',
  oidcAudience: process.env.OIDC_AUDIENCE || '',

  // Governance
  defaultScanBudgetGb: parseInt(process.env.DEFAULT_SCAN_BUDGET_GB || '1', 10),
  
  // App
  port: parseInt(process.env.PORT || '3001', 10),
  isDev: process.env.NODE_ENV !== 'production'
}

/**
 * Validates that all required environment variables are present.
 * Fails fast during server startup.
 */
export function validateConfig() {
  const missing = []
  
  if (!config.billingProjectId) missing.push('BQ_BILLING_PROJECT_ID')
  if (!config.oidcIssuer) missing.push('OIDC_ISSUER')
  if (!config.oidcAudience) missing.push('OIDC_AUDIENCE')

  if (missing.length > 0) {
    throw new Error(`Critical Configuration Missing: The following environment variables must be set: ${missing.join(', ')}`)
  }

  console.log('[Config] Configuration validated successfully.')
}
