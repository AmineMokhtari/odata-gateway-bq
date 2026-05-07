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
