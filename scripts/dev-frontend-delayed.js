import { execSync, spawn } from 'child_process';
import { config } from 'dotenv';
import path from 'path';

// Load .env
config();

const port = process.env.PORT || '80';
const healthUrl = `http://127.0.0.1:${port}/health`;

console.log(`[dev-frontend-delayed] Waiting for backend at ${healthUrl}...`);

try {
  execSync(`npx wait-on ${healthUrl} -t 120000 --interval 2000`, { stdio: 'inherit' });
  console.log('[dev-frontend-delayed] Backend is healthy! Starting Next.js frontend...');
} catch (e) {
  console.error('[dev-frontend-delayed] Error: Backend did not become healthy in time.');
  process.exit(1);
}

// Spawn Next.js dev server with the correct GATEWAY_URL in env
const nextProcess = spawn(
  'npm',
  ['run', 'dev'],
  {
    cwd: path.resolve('obq-hub'),
    env: {
      ...process.env,
      NEXT_PUBLIC_GATEWAY_URL: `http://127.0.0.1:${port}`,
      GATEWAY_URL: `http://127.0.0.1:${port}`
    },
    stdio: 'inherit',
    shell: true
  }
);

nextProcess.on('exit', (code) => {
  process.exit(code || 0);
});
