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
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/setupTests.js',
        '**/*.config.js',
        'dist/',
        'coverage/',
        'public/',
        'src/main.jsx'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        },
        // Component-specific thresholds (ported from workspace)
        'src/components/Material3/': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        'src/contexts/': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
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
