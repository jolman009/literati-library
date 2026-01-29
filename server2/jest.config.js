export default {
  testEnvironment: 'node',
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 10000,
  verbose: true,
  setupFiles: ['<rootDir>/jest.setup.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/setupTests.js',
    '!**/node_modules/**',
    '!**/*.test.js'
  ],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/src/**/*.test.js',
    '**/__tests__/**/*.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js']
}
