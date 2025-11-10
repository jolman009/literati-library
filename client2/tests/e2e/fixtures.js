import { test as base } from '@playwright/test'

// Test user credentials
export const TEST_USER = {
  email: 'e2e.test@example.com',
  password: 'TestPassword123!',
  name: 'E2E Test User'
}

/**
 * Helper function to handle page overlays that block interactions
 * Dismisses cookie consent and waits for loading screen to disappear
 */
export async function handleOverlays(page) {
  try {
    // Check if loading screen exists and wait for it to be hidden
    const loadingElement = page.locator('#app-loading')
    const loadingExists = await loadingElement.count().then(count => count > 0)

    if (loadingExists) {
      await loadingElement.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
        // Continue if already hidden or timeout
      })
    }

    // Give the page a moment to fully render after loading screen disappears
    await page.waitForTimeout(500)

    // Dismiss cookie consent if present
    const cookieConsent = page.locator('[data-testid="cookie-consent-accept"]')
    const isVisible = await cookieConsent.isVisible({ timeout: 3000 }).catch(() => false)

    if (isVisible) {
      await cookieConsent.click({ timeout: 2000 })
      // Brief wait for consent animation to complete
      await page.waitForTimeout(500)
    }
  } catch (error) {
    // Log error but don't fail the test - overlays might not be present
    console.debug('Overlay handling:', error.message)
  }
}

// Extend base test with custom fixtures
export const test = base.extend({
  // Authenticated page fixture
  authenticatedPage: async ({ page }, use) => {
    // Login before each test that uses this fixture
    await page.goto('/login')

    await page.fill('[data-testid="email-input"]', TEST_USER.email)
    await page.fill('[data-testid="password-input"]', TEST_USER.password)
    await page.click('[data-testid="login-button"]')

    // Wait for successful login
    await page.waitForURL('/dashboard', { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    await use(page)

    // Logout after test
    try {
      await page.click('[data-testid="user-menu"]')
      await page.click('[data-testid="logout-button"]')
      await page.waitForURL('/login')
    } catch (error) {
      console.warn('Could not logout after test:', error.message)
    }
  },

  // Clean database state
  cleanDatabase: async ({ page }, use) => {
    // Clean up before test
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    await use(page)

    // Clean up after test
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  },

  // Test book fixture
  testBook: async ({ authenticatedPage }, use) => {
    // Create a test book
    await authenticatedPage.goto('/upload')

    // Create a test PDF file
    const testFile = {
      name: 'test-book.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Test PDF content')
    }

    await authenticatedPage.setInputFiles('[data-testid="file-input"]', {
      name: testFile.name,
      mimeType: testFile.mimeType,
      buffer: testFile.buffer
    })

    await authenticatedPage.fill('[data-testid="book-title"]', 'Test Book Title')
    await authenticatedPage.fill('[data-testid="book-author"]', 'Test Author')
    await authenticatedPage.fill('[data-testid="book-description"]', 'Test book description')

    await authenticatedPage.click('[data-testid="upload-button"]')

    // Wait for upload to complete
    await authenticatedPage.waitForSelector('[data-testid="upload-success"]', { timeout: 30000 })

    // Get the book ID from the success message or URL
    const bookId = await authenticatedPage.evaluate(() => {
      const successElement = document.querySelector('[data-testid="upload-success"]')
      return successElement?.getAttribute('data-book-id') || '1'
    })

    const testBook = {
      id: bookId,
      title: 'Test Book Title',
      author: 'Test Author',
      description: 'Test book description'
    }

    await use(testBook)

    // Clean up - delete the test book
    try {
      await authenticatedPage.goto('/library')
      await authenticatedPage.click(`[data-testid="delete-book-${bookId}"]`)
      await authenticatedPage.click('[data-testid="confirm-delete"]')
      await authenticatedPage.waitForSelector(`[data-testid="book-${bookId}"]`, { state: 'detached' })
    } catch (error) {
      console.warn('Could not delete test book:', error.message)
    }
  },

  // Mobile device fixture
  mobileContext: async ({ browser }, use) => {
    const { devices } = await import('@playwright/test')
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    })
    await use(context)
    await context.close()
  },

  // Performance monitoring fixture
  performanceMonitor: async ({ page }, use) => {
    const performanceMetrics = {
      navigationStart: 0,
      loadComplete: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0
    }

    // Start performance monitoring
    await page.addInitScript(() => {
      window.performanceMetrics = {}
    })

    await use({
      startMonitoring: async () => {
        performanceMetrics.navigationStart = Date.now()
      },
      getMetrics: async () => {
        const metrics = await page.evaluate(() => {
          const perf = performance.getEntriesByType('navigation')[0]
          return {
            domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
            loadComplete: perf.loadEventEnd - perf.loadEventStart,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
          }
        })
        return { ...performanceMetrics, ...metrics }
      }
    })
  },

  // API client fixture
  apiClient: async ({ request }, use) => {
    const apiClient = {
      baseURL: 'http://localhost:5000',

      async login(email = TEST_USER.email, password = TEST_USER.password) {
        const response = await request.post(`${this.baseURL}/auth/login`, {
          data: { email, password }
        })
        const { token, user } = await response.json()
        return { token, user }
      },

      async createBook(token, bookData) {
        const response = await request.post(`${this.baseURL}/books`, {
          headers: { 'Authorization': `Bearer ${token}` },
          data: bookData
        })
        return response.json()
      },

      async deleteBook(token, bookId) {
        return request.delete(`${this.baseURL}/books/${bookId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      },

      async createNote(token, noteData) {
        const response = await request.post(`${this.baseURL}/notes`, {
          headers: { 'Authorization': `Bearer ${token}` },
          data: noteData
        })
        return response.json()
      }
    }

    await use(apiClient)
  }
})

export { expect } from '@playwright/test'

// Custom assertions
export const customExpect = {
  async toBeVisible(locator, timeout = 5000) {
    await expect(locator).toBeVisible({ timeout })
  },

  async toHaveText(locator, text, timeout = 5000) {
    await expect(locator).toHaveText(text, { timeout })
  },

  async toBeAuthenticated(page) {
    // Check for authenticated state indicators
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    await expect(page).toHaveURL(/\/dashboard|\/library/)
  },

  async toBeUnauthenticated(page) {
    // Check for unauthenticated state
    await expect(page).toHaveURL(/\/login|\/register|\//)
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
  },

  async toHaveSuccessMessage(page, message) {
    const successElement = page.locator('[data-testid="success-message"], .success, .alert-success')
    await expect(successElement).toBeVisible()
    if (message) {
      await expect(successElement).toContainText(message)
    }
  },

  async toHaveErrorMessage(page, message) {
    const errorElement = page.locator('[data-testid="error-message"], .error, .alert-error')
    await expect(errorElement).toBeVisible()
    if (message) {
      await expect(errorElement).toContainText(message)
    }
  }
}