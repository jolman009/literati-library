import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Base defaults applied to all projects
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      exclude: [
        'node_modules/',
        'src/setupTests.js',
        'src/setupTests.integration.js',
        '**/*.config.js',
        '**/*.test.{js,jsx}',
        'dist/',
        'coverage/',
        'public/',
        'src/main.jsx'
      ],
      // Coverage thresholds - set to warn mode for CI flexibility
      // These are targets, not hard requirements
      thresholds: {
        global: {
          branches: 30,
          functions: 30,
          lines: 30,
          statements: 30
        }
      }
    },
    // Migrate from vitest.workspace.js → test.projects
    projects: [
      {
        test: {
          name: 'unit',
          include: ['src/**/*.{test,spec}.{js,jsx}'],
          exclude: [
            'src/**/*.e2e.{test,spec}.{js,jsx}',
            'tests/e2e/**/*',
            'node_modules/**/*'
          ],
          globals: true,
          environment: 'jsdom',
          setupFiles: ['./src/setupTests.js']
        }
      },
      {
        test: {
          name: 'integration',
          include: ['src/**/*.integration.{test,spec}.{js,jsx}'],
          globals: true,
          environment: 'jsdom',
          // Use integration setup to avoid mocking contexts
          setupFiles: ['./src/setupTests.integration.js'],
          testTimeout: 10000,
          coverage: { enabled: false }
        }
      }
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
