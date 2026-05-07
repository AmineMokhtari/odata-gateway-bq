/**
 * Converts bytes into human readable gigabytes (GB) or terabytes (TB).
 * Targeted for BigQuery scan results.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  // For BigQuery, we usually want at least 2 decimal places when dealing with GB
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(2)} ${sizes[i]}`;
}

export function bytesToGb(bytes: number): number {
  return bytes / (1024 * 1024 * 1024);
}
