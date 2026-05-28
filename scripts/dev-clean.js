import { execSync, spawn } from 'child_process';
import { config } from 'dotenv';
import path from 'path';

// Load .env
config();

const port = process.env.PORT || '80';
console.log(`[dev-clean] Killing processes on ports ${port}, 3002, 3000...`);

try {
  // Run kill-port using npx
  execSync(`npx kill-port ${port} 3002 3000`, { stdio: 'inherit' });
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
