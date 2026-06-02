import { execSync, spawn } from 'child_process';
import { config } from 'dotenv';
import path from 'path';

// Load .env
config();

const gatewayPort = process.env.GATEWAY_URL ? (new URL(process.env.GATEWAY_URL).port || '80') : '80';
const hubPort = process.env.HUB_PORT || '3000';
const healthUrl = `http://127.0.0.1:${gatewayPort}/health`;

console.log(`[dev-frontend-delayed] Waiting for backend at ${healthUrl}...`);

try {
  execSync(`npx wait-on ${healthUrl} -t 120000 --interval 2000`, { stdio: 'inherit' });
  console.log(`[dev-frontend-delayed] Backend is healthy! Starting Next.js frontend on port ${hubPort}...`);
} catch (e) {
  console.error('[dev-frontend-delayed] Error: Backend did not become healthy in time.');
  process.exit(1);
}

// Spawn Next.js dev server on the configured HUB_PORT
const nextProcess = spawn(
  'npm',
  ['run', 'dev'],
  {
    cwd: path.resolve('obq-hub'),
    env: {
      ...process.env,
      PORT: hubPort,
      NEXT_PUBLIC_GATEWAY_URL: `http://127.0.0.1:${gatewayPort}`,
      GATEWAY_URL: `http://127.0.0.1:${gatewayPort}`
    },
    stdio: 'inherit',
    shell: true
  }
);

nextProcess.on('exit', (code) => {
  process.exit(code || 0);
});
