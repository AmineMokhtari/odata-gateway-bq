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
