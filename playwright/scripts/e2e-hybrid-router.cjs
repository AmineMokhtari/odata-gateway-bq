#!/usr/bin/env node
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

const { spawn } = require('child_process');
const path = require('path');

const isCI = process.env.CI === 'true';
const extraArgs = process.argv.slice(2);

let command = 'node';
let args = [path.resolve(__dirname, 'test-agent-runner.cjs')];

if (isCI) {
  console.log('🌐 CI Environment Detected (process.env.CI === "true")');
  console.log('   Routing execution to standard Playwright regression suite...\n');
  command = 'npx';
  args = ['playwright', 'test'];
} else {
  console.log('💻 Local / Developer Agent Environment Detected');
  console.log('   Routing execution to fast optimized Playwright CLI agent runner...\n');
}

// Forward any command line arguments
args.push(...extraArgs);

console.log(`🚀 Spawning: ${command} ${args.join(' ')}\n`);

const child = spawn(command, args, {
  stdio: 'inherit',
  shell: true,
  cwd: path.resolve(__dirname, '../..')
});

// Forward process signals to child
const handleSignal = (signal) => {
  console.log(`\n📋 Forwarding ${signal} termination to child subprocess...`);
  child.kill(signal);
};

process.on('SIGINT', () => handleSignal('SIGINT'));
process.on('SIGTERM', () => handleSignal('SIGTERM'));

child.on('close', (code) => {
  console.log(`\n🏁 Subprocess router exit code: ${code}`);
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error('🚨 Failed to execute subprocess:', err.message);
  process.exit(1);
});
