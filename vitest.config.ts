import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '__tests__/',
        'dist/',
        'styles/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
      ],
      // Coverage thresholds: Target 90%+ for React component library
      lines: 85,
      functions: 85,
      branches: 80,
      statements: 85,
      thresholdAutoUpdate: false,
    },
    include: [
      '__tests__/unit/**/*.test.ts',
      '__tests__/unit/**/*.test.tsx',
      '__tests__/integration/**/*.test.ts',
      '__tests__/integration/**/*.test.tsx',
      '__tests__/security/**/*.test.ts',
      '__tests__/security/**/*.test.tsx',
      '__tests__/performance/**/*.test.ts',
      '__tests__/performance/**/*.test.tsx',
      '__tests__/accessibility/**/*.test.ts',
      '__tests__/accessibility/**/*.test.tsx',
      '__tests__/e2e/**/*.test.ts',
      '__tests__/e2e/**/*.test.tsx',
      '__tests__/api/**/*.test.ts',
      '__tests__/api/**/*.test.tsx',
    ],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
