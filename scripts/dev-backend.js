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
import { execSync, spawn } from 'child_process';
import { config } from 'dotenv';

// Load .env
config();

const port = process.env.GATEWAY_URL ? (new URL(process.env.GATEWAY_URL).port || '80') : '80';

console.log('[dev-backend] Building backend TypeScript...');
try {
  execSync('npm run build:backend', { stdio: 'inherit' });
} catch (e) {
  console.error('[dev-backend] Error: TypeScript build failed.');
  process.exit(1);
}

console.log(`[dev-backend] Starting Fastify backend on port ${port}...`);

const fastifyProcess = spawn(
  `npx fastify start --options -a 127.0.0.1 -l info -T 30000 obq-gateway/dist/obq-gateway/src/app.js --port ${port}`,
  {
    stdio: 'inherit',
    shell: true
  }
);

fastifyProcess.on('exit', (code) => {
  process.exit(code || 0);
});
