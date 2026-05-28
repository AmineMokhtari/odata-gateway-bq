import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/api',
  use: {
    baseURL: process.env.GATEWAY_URL || 'http://127.0.0.1:80',
  },
  reporter: 'list',
});
