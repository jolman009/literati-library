import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for staging environment testing
 * Runs integration tests against the staging deployment
 */
export default defineConfig({
  testDir: './tests/integration',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/staging-results.json' }],
    ['junit', { outputFile: 'test-results/staging-junit.xml' }]
  ],

  /* Shared settings for all the projects below. */
  use: {
    /* Base URL for staging environment */
    baseURL: process.env.STAGING_URL || 'https://staging.shelfquest.pro',

    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* API URL for API testing */
    extraHTTPHeaders: {
      'Accept': 'application/json',
    }
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/global-setup.js'),
  globalTeardown: require.resolve('./tests/global-teardown.js'),

  /* Test timeout */
  timeout: 30000,
  expect: {
    timeout: 10000
  },

  /* Output directory */
  outputDir: 'test-results/staging/',
});