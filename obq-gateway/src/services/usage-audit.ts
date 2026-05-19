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

import { BigQuery } from '@google-cloud/bigquery';
import { sanitizeLabelValue } from './bq-executor.js';
import { config } from '../config.js';
import { bigQueryValueReplacer } from '../lib/transformers/json-caster.js';

export interface UserUsage {
  totalBytesBilled: number;
  lastJobs: Array<{
    id: string;
    creationTime: string;
    bytes: number;
    status: 'DONE' | 'FAILURE' | 'PENDING';
  }>;
}

/**
 * Service to track BigQuery usage per user via labels.
 * [Source: _bmad-output/planning-artifacts/epics.md#Story 6.4]
 */
export async function getUserUsage(
  bq: BigQuery,
  email: string,
  location: string = config.defaultLocation
): Promise<UserUsage> {
  const sanitizedEmail = sanitizeLabelValue(email);
  const projectId = bq.projectId;

  const billingProjectId = config.billingProjectId || projectId;
  const auditTable = `\`${billingProjectId}.${config.auditDataset}.${config.auditTable}\``;

  // 1. Query for total monthly usage (Combined from INFORMATION_SCHEMA and custom logs)
  const usageQuery = `
    SELECT
      IFNULL(SUM(total_bytes_billed), 0) as total_bytes_billed
    FROM
      \`${projectId}.region-${location.toLowerCase()}.INFORMATION_SCHEMA.JOBS_BY_PROJECT\`,
      UNNEST(labels) as label
    WHERE
      label.key = 'user_identity'
      AND label.value = @email
      AND creation_time >= TIMESTAMP_TRUNC(CURRENT_TIMESTAMP(), MONTH)
      AND job_type = 'QUERY'
  `;

  // 2. Query for last 10 activities from our persistent audit log (Story 8.5)
  const activitiesQuery = `
    SELECT
      correlationId as id,
      timestamp as creation_time,
      bytesProcessed as bytes,
      action,
      status
    FROM
      ${auditTable}
    WHERE
      userEmail = @email
      AND timestamp >= TIMESTAMP_TRUNC(CURRENT_TIMESTAMP(), MONTH)
    ORDER BY timestamp DESC
    LIMIT 10
  `;

  const [usageRows] = await bq.query({
    query: usageQuery,
    params: { email: sanitizedEmail },
    location
  });

  const [activityRows] = await bq.query({
    query: activitiesQuery,
    params: { email: email }, // Use raw email for custom log query
    location
  }).catch(() => [[]]); // Fallback if table doesn't exist yet

  return {
    totalBytesBilled: usageRows[0]?.total_bytes_billed || 0,
    lastJobs: activityRows.map((row: any) => ({
      id: row.id,
      creationTime: bigQueryValueReplacer('', row.creation_time),
      bytes: row.bytes,
      status: row.status === 'SUCCESS' ? 'DONE' : 'FAILURE'
    }))
  };
}

/**
 * Service to track global BigQuery usage across all projects for a user.
 */
export async function getGlobalUserUsage(
  bq: BigQuery,
  email: string
): Promise<UserUsage> {
  const auditTable = `\`${config.billingProjectId}.${config.auditDataset}.${config.auditTable}\``;

  // 1. Query for total monthly usage across all projects
  const usageQuery = `
    SELECT
      IFNULL(SUM(bytesProcessed), 0) as total_bytes
    FROM
      ${auditTable}
    WHERE
      userEmail = @email
      AND timestamp >= TIMESTAMP_TRUNC(CURRENT_TIMESTAMP(), MONTH)
  `;

  // 2. Query for last 50 activities (Story 8.5)
  const activitiesQuery = `
    SELECT
      correlationId as id,
      timestamp,
      bytesProcessed as bytes,
      action,
      status,
      projectId,
      datasetId
    FROM
      ${auditTable}
    WHERE
      userEmail = @email
      AND action = 'QUERY'
    ORDER BY timestamp DESC
    LIMIT 50
  `;

  const [usageRows] = await bq.query({
    query: usageQuery,
    params: { email: email }
  }).catch(() => [[{ total_bytes: 0 }]]);

  const [activityRows] = await bq.query({
    query: activitiesQuery,
    params: { email: email }
  }).catch(() => [[]]);

  return {
    totalBytesBilled: usageRows[0]?.total_bytes || 0,
    lastJobs: activityRows.map((row: any) => ({
      id: row.id,
      creationTime: bigQueryValueReplacer('', row.timestamp),
      bytes: row.bytes,
      status: row.status === 'SUCCESS' ? 'DONE' : 'FAILURE'
    }))
  };
}
