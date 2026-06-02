import { execSync, spawn } from 'child_process';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env
config();

const gatewayPort = process.env.GATEWAY_URL ? (new URL(process.env.GATEWAY_URL).port || '80') : '80';
const hubPort = process.env.HUB_PORT || '3000';
console.log(`[dev-clean] Killing processes on ports ${gatewayPort}, ${hubPort}, 3002...`);

try {
  // Run kill-port using npx
  execSync(`npx kill-port ${gatewayPort} ${hubPort} 3002`, { stdio: 'inherit' });
} catch (e) {
  console.warn('[dev-clean] Warning: Some ports could not be killed (they might already be free).');
}

console.log('[dev-clean] Cleaning Next.js compilation cache (.next) in obq-hub...');
try {
  const nextDir = path.resolve('obq-hub', '.next');
  if (fs.existsSync(nextDir)) {
    try {
      fs.rmSync(nextDir, { recursive: true, force: true });
      console.log('[dev-clean] .next cache folder deleted successfully.');
    } catch (rmError) {
      // If deletion fails, fall back to renaming (extremely reliable on Windows)
      const fallbackDir = path.resolve('obq-hub', `.next-old-${Date.now()}`);
      fs.renameSync(nextDir, fallbackDir);
      console.log(`[dev-clean] .next folder was locked. Successfully isolated/renamed to: ${path.basename(fallbackDir)}`);
    }
  } else {
    console.log('[dev-clean] No existing .next folder found. Skipping clean.');
  }
} catch (e) {
  console.warn('[dev-clean] Warning: Could not clean or rename .next cache folder:', e.message);
}

console.log('[dev-clean] Starting dev server...');
const devProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

devProcess.on('exit', (code) => {
  process.exit(code || 0);
});
