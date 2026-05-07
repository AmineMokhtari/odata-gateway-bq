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

import { BigQuery } from '@google-cloud/bigquery'
import { performDryRun } from '../../services/bq-executor.js'

export interface DryRunGateOptions {
  bq: BigQuery
  sql: string
  params?: Record<string, any>
  location?: string
  budgetBytes: number
  userEmail: string
  correlationId: string
}

/**
 * Validates a query estimate against a scan budget via Dry Run.
 * [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1]
 */
export async function validateScanBudget(options: DryRunGateOptions): Promise<number> {
  const { bq, sql, params, location, budgetBytes, userEmail, correlationId } = options

  const estimatedBytes = await performDryRun(bq, sql, userEmail, correlationId, params, location)

  if (estimatedBytes > budgetBytes) {
    const error = new Error(`Query estimate (${estimatedBytes} bytes) exceeds budget (${budgetBytes} bytes)`)
    // @ts-ignore - Adding custom code for OData error mapping
    error.code = 'BudgetExceeded'
    // @ts-ignore
    error.estimatedBytes = estimatedBytes
    // @ts-ignore
    error.budgetBytes = budgetBytes
    throw error
  }

  return estimatedBytes
}
