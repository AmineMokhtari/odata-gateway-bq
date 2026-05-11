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

import { config as loadEnv } from 'dotenv'

// Load environment variables from .env file (Story 8.5)
loadEnv()

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
  port: parseInt(process.env.PORT || '3002', 10),
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
