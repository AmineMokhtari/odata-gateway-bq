/*
Copyright 2026 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import { BigQuery } from '@google-cloud/bigquery';

async function test() {
  const bq = new BigQuery(); // Assuming this defaults to dev-env-mokhtari
  const datasetId = 'imdb';
  const projectId = 'bigquery-public-data';

  console.log(`Testing with projectId=${projectId}, datasetId=${datasetId}`);
  try {
    const [metadata] = await bq.dataset(datasetId, { projectId }).getMetadata();
    const location = metadata.location || 'US';
    console.log('Successfully fetched dataset metadata. Location:', location);

    const tablesQuery = `
      SELECT t.table_name, o.option_value as description
      FROM \`${projectId.replace(/`/g, '``')}.${datasetId.replace(/`/g, '``')}.INFORMATION_SCHEMA.TABLES\` t
      LEFT JOIN \`${projectId.replace(/`/g, '``')}.${datasetId.replace(/`/g, '``')}.INFORMATION_SCHEMA.TABLE_OPTIONS\` o
        ON t.table_name = o.table_name AND o.option_name = 'description'
      WHERE t.table_type = 'BASE TABLE' OR t.table_type = 'VIEW'
    `;
    console.log('Running query:', tablesQuery);
    
    const [tableRows] = await bq.query({ query: tablesQuery, location });
    console.log('Successfully fetched table rows:', tableRows.length);
  } catch (err) {
    console.error('Error fetching dataset metadata:', err);
  }
}

test();
