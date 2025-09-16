import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for production environment testing
 * Runs smoke tests and critical path validation against production
 */
export default defineConfig({
  testDir: './tests/production',

  /* Run tests in files in parallel but limit concurrency for production */
  fullyParallel: false,
  workers: 2,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry failed tests in production */
  retries: 3,

  /* Reporter to use for production testing */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/production-results.json' }],
    ['junit', { outputFile: 'test-results/production-junit.xml' }]
  ],

  /* Shared settings for production testing */
  use: {
    /* Base URL for production environment */
    baseURL: process.env.PRODUCTION_URL || 'https://literati.pro',

    /* Always collect trace for production failures */
    trace: 'retain-on-failure',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Production-specific headers */
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'User-Agent': 'Literati-Production-Monitor/1.0'
    },

    /* Be gentle on production */
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  /* Configure minimal browser coverage for production */
  projects: [
    {
      name: 'production-chrome',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/*.production.spec.js']
    },

    {
      name: 'production-mobile',
      use: { ...devices['iPhone 12'] },
      testMatch: ['**/critical.mobile.spec.js']
    },
  ],

  /* Global setup for production monitoring */
  globalSetup: require.resolve('./tests/production-setup.js'),

  /* Conservative timeouts for production */
  timeout: 60000,
  expect: {
    timeout: 15000
  },

  /* Output directory */
  outputDir: 'test-results/production/',

  /* Limit test execution time */
  globalTimeout: 300000, // 5 minutes max
});