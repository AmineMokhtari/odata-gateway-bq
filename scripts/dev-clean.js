import { execSync, spawn } from 'child_process';
import { config } from 'dotenv';
import path from 'path';

// Load .env
config();

const gatewayPort = process.env.GATEWAY_PORT || process.env.PORT || '80';
const hubPort = process.env.HUB_PORT || '3000';
console.log(`[dev-clean] Killing processes on ports ${gatewayPort}, ${hubPort}, 3002...`);

try {
  // Run kill-port using npx
  execSync(`npx kill-port ${gatewayPort} ${hubPort} 3002`, { stdio: 'inherit' });
} catch (e) {
  console.warn('[dev-clean] Warning: Some ports could not be killed (they might already be free).');
}

console.log('[dev-clean] Starting dev server...');
const devProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

devProcess.on('exit', (code) => {
  process.exit(code || 0);
});
