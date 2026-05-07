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

import { BigQuery, Query, Job } from '@google-cloud/bigquery'
import { Readable } from 'node:stream'

/**
 * Sanitizes a string for use as a BigQuery label.
 * Rules: lowercase, alphanumeric, underscores, hyphens, 63 chars max, starts with letter.
 */
export function sanitizeLabelValue(value: string): string {
  let sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_') // Replace invalid chars with underscore
    .substring(0, 63)

  // Ensure it starts with a letter
  if (!/^[a-z]/.test(sanitized)) {
    sanitized = 'v_' + sanitized.substring(0, 61)
  }

  return sanitized
}

/**
 * Common helper to generate audit labels.
 */
function getAuditLabels(userEmail: string, correlationId: string) {
  return {
    user_identity: sanitizeLabelValue(userEmail),
    correlation_id: sanitizeLabelValue(correlationId)
  }
}

export interface BQStreamResponse {
  stream: Readable
  job: Job
}

/**
 * Executes a BigQuery query and returns a readable stream of rows and the Job instance.
 * Meets Story 3.2 and 4.5 requirements.
 */
export async function createBigQueryStream(
  bq: BigQuery,
  sql: string,
  userEmail: string,
  correlationId: string,
  params?: Record<string, any>,
  location?: string
): Promise<BQStreamResponse> {
  const queryOptions: Query = {
    query: sql,
    params,
    location,
    labels: getAuditLabels(userEmail, correlationId)
  }

  const [job] = await bq.createQueryJob(queryOptions)
  const stream = job.getQueryResultsStream()

  return { stream, job }
}

/**
 * Retrieves an existing BigQuery Job by its ID.
 */
export async function getJob(bq: BigQuery, jobId: string, location?: string): Promise<Job> {
  const [job] = await bq.job(jobId, { location }).get()
  return job
}

/**
 * Fetches a stream of results from a completed BigQuery Job using a start index and limit.
 * This utilizes the temporary results table (cached results).
 */
export function getJobResultStream(
  job: Job,
  options: { startIndex: number; maxResults: number }
): Readable {
  return job.getQueryResultsStream({
    startIndex: options.startIndex.toString(),
    maxResults: options.maxResults
  })
}

/**
 * Performs a BigQuery dry run to estimate costs without execution.
 * Meets Story 4.4 requirements for audit labeling in dry runs.
 */
export async function performDryRun(
  bq: BigQuery,
  sql: string,
  userEmail: string,
  correlationId: string,
  params?: Record<string, any>,
  location?: string
): Promise<number> {
  const [job] = await bq.createQueryJob({
    query: sql,
    params,
    location,
    dryRun: true,
    labels: getAuditLabels(userEmail, correlationId)
  })

  const totalBytesProcessed = parseInt(job.metadata.statistics.totalBytesProcessed, 10)
  return isNaN(totalBytesProcessed) ? 0 : totalBytesProcessed
}
