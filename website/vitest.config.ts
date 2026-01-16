import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.docusaurus', 'src/data/artifacts/**'],
    coverage: {
      provider: 'v8',
      include: ['src/dag/**/*.ts'],
      exclude: ['src/dag/**/*.test.ts', 'src/dag/**/index.ts'],
    },
    testTimeout: 30000, // 30 seconds for async tests
  },
  resolve: {
    alias: {
      '@site': path.resolve(__dirname, './'),
    },
  },
});
