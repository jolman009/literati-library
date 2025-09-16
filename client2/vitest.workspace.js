import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  // Unit tests configuration
  {
    test: {
      name: 'unit',
      include: ['src/**/*.{test,spec}.{js,jsx}'],
      exclude: [
        'src/**/*.e2e.{test,spec}.{js,jsx}',
        'tests/e2e/**/*',
        'node_modules/**/*'
      ],
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.js'],
      globals: true,
      coverage: {
        reporter: ['text', 'json', 'html', 'lcov'],
        include: ['src/**/*'],
        exclude: [
          'node_modules/',
          'src/setupTests.js',
          'src/**/*.test.{js,jsx}',
          'src/**/*.spec.{js,jsx}',
          'src/test-utils.jsx',
          '**/*.d.ts',
          '**/*.config.js'
        ],
        thresholds: {
          global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
          },
          // Component-specific thresholds
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
      }
    }
  },

  // Integration tests configuration
  {
    test: {
      name: 'integration',
      include: ['src/**/*.integration.{test,spec}.{js,jsx}'],
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.js'],
      globals: true,
      testTimeout: 10000, // Longer timeout for integration tests
      coverage: {
        enabled: false // Don't generate coverage for integration tests
      }
    }
  }
])