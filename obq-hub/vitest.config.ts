import path from 'path'

export default {
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/telemetry-beacon.test.ts', 'tests/unit/pii-scrubber.test.ts'],
    exclude: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}
