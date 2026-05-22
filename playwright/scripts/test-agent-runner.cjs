#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load configuration
const configPath = path.resolve(__dirname, '../../.playwright/cli.config.json');
let config = {};
try {
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (err) {
  console.warn('⚠️ Warning: Failed to parse .playwright/cli.config.json:', err.message);
}

// Build arguments array
const args = ['playwright', 'test'];

// Map config parameters to Playwright CLI flags
if (config.headless === true) {
  // Playwright is headless by default, but we can configure it specifically or pass --headed if false
} else if (config.headless === false) {
  args.push('--headed');
}

if (config.timeout) {
  args.push(`--timeout=${config.timeout}`);
}

if (config.outputDir) {
  // Resolve output directory relative to the config file or root
  const resolvedOutputDir = path.resolve(path.dirname(configPath), config.outputDir);
  args.push(`--output=${resolvedOutputDir}`);
}

// Append any additional arguments passed to the script
const extraArgs = process.argv.slice(2);
args.push(...extraArgs);

console.log('🤖 Spawning Playwright CLI Subprocess:');
console.log(`   npx ${args.join(' ')}\n`);

// Spawn stateless child subprocess
const child = spawn('npx', args, {
  stdio: 'inherit',
  shell: true,
  cwd: path.resolve(__dirname, '../..')
});

// Forward OS signals to child process
const handleSignal = (signal) => {
  console.log(`\n📋 Forwarding ${signal} termination to Playwright subprocess...`);
  child.kill(signal);
};

process.on('SIGINT', () => handleSignal('SIGINT'));
process.on('SIGTERM', () => handleSignal('SIGTERM'));

// Parse and map exit code
child.on('close', (code) => {
  console.log(`\n🏁 Playwright subprocess closed with exit code ${code}`);
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error('🚨 Failed to start Playwright subprocess:', err.message);
  process.exit(1);
});
