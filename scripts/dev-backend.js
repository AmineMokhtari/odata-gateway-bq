import { execSync, spawn } from 'child_process';
import { config } from 'dotenv';

// Load .env
config();

const port = process.env.GATEWAY_PORT || process.env.PORT || '80';

console.log('[dev-backend] Building backend TypeScript...');
try {
  execSync('npm run build:backend', { stdio: 'inherit' });
} catch (e) {
  console.error('[dev-backend] Error: TypeScript build failed.');
  process.exit(1);
}

console.log(`[dev-backend] Starting Fastify backend on port ${port}...`);

const fastifyProcess = spawn(
  `npx fastify start --options -a 127.0.0.1 -l info -T 30000 obq-gateway/dist/obq-gateway/src/app.js --port ${port} | npx pino-pretty`,
  {
    stdio: 'inherit',
    shell: true
  }
);

fastifyProcess.on('exit', (code) => {
  process.exit(code || 0);
});
