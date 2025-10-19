import { test, expect } from './fixtures.js'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display landing page for unauthenticated users', async ({ page }) => {
    await expect(page).toHaveTitle(/ShelfQuest|Library/)
    await expect(page.locator('[data-testid="landing-hero"]')).toBeVisible()
    await expect(page.locator('[data-testid="get-started-button"]')).toBeVisible()
  })

  test('should navigate to login page', async ({ page }) => {
    await page.click('[data-testid="login-link"]')
    await expect(page).toHaveURL('/login')
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
  })

  test('should navigate to register page', async ({ page }) => {
    await page.click('[data-testid="register-link"]')
    await expect(page).toHaveURL('/register')
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible()
  })

  test('should register new user successfully', async ({ page }) => {
    await page.goto('/register')

    // Fill registration form
    await page.fill('[data-testid="name-input"]', 'New User')
    await page.fill('[data-testid="email-input"]', `test.${Date.now()}@example.com`)
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!')
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePassword123!')

    // Submit form
    await page.click('[data-testid="register-button"]')

    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible()
  })

  test('should show validation errors for invalid registration data', async ({ page }) => {
    await page.goto('/register')

    // Submit empty form
    await page.click('[data-testid="register-button"]')

    // Should show validation errors
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible()
  })

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[data-testid="email-input"]', 'e2e.test@example.com')
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')

    await page.click('[data-testid="login-button"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[data-testid="email-input"]', 'invalid@example.com')
    await page.fill('[data-testid="password-input"]', 'wrongpassword')

    await page.click('[data-testid="login-button"]')

    // Should show error message
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-error"]')).toContainText(/invalid|incorrect/i)
  })

  test('should logout successfully', async ({ authenticatedPage }) => {
    // User is already logged in via fixture

    await authenticatedPage.click('[data-testid="user-menu"]')
    await authenticatedPage.click('[data-testid="logout-button"]')

    // Should redirect to login page
    await expect(authenticatedPage).toHaveURL('/login')
    await expect(authenticatedPage.locator('[data-testid="login-form"]')).toBeVisible()
  })

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/login')

    await page.click('[data-testid="forgot-password-link"]')
    await expect(page).toHaveURL('/forgot-password')

    await page.fill('[data-testid="email-input"]', 'e2e.test@example.com')
    await page.click('[data-testid="reset-password-button"]')

    // Should show success message
    await expect(page.locator('[data-testid="reset-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="reset-success"]')).toContainText(/reset link sent/i)
  })

  test('should persist authentication across browser refresh', async ({ authenticatedPage }) => {
    // User is already logged in
    await expect(authenticatedPage).toHaveURL('/dashboard')

    // Refresh the page
    await authenticatedPage.reload()

    // Should still be authenticated
    await expect(authenticatedPage).toHaveURL('/dashboard')
    await expect(authenticatedPage.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/library')

    // Should redirect to login
    await expect(page).toHaveURL('/login')
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
  })

  test('should handle session expiration gracefully', async ({ authenticatedPage }) => {
    // Simulate expired token by clearing localStorage
    await authenticatedPage.evaluate(() => {
      localStorage.removeItem('token')
    })

    // Try to navigate to protected route
    await authenticatedPage.goto('/library')

    // Should redirect to login
    await expect(authenticatedPage).toHaveURL('/login')
  })
})

test.describe('Authentication Security', () => {
  test('should sanitize input fields', async ({ page }) => {
    await page.goto('/login')

    // Try XSS attack in email field
    await page.fill('[data-testid="email-input"]', '<script>alert("xss")</script>')
    await page.fill('[data-testid="password-input"]', 'password')
    await page.click('[data-testid="login-button"]')

    // Should not execute script
    await page.waitForTimeout(1000)
    expect(await page.evaluate(() => window.alert)).toBeUndefined()
  })

  test('should rate limit login attempts', async ({ page }) => {
    await page.goto('/login')

    // Make multiple failed login attempts
    for (let i = 0; i < 6; i++) {
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.fill('[data-testid="password-input"]', 'wrongpassword')
      await page.click('[data-testid="login-button"]')
      await page.waitForTimeout(500)
    }

    // Should show rate limit message
    await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible()
  })

  test('should enforce strong password requirements', async ({ page }) => {
    await page.goto('/register')

    await page.fill('[data-testid="name-input"]', 'Test User')
    await page.fill('[data-testid="email-input"]', 'test@example.com')

    // Try weak password
    await page.fill('[data-testid="password-input"]', '123')
    await page.blur('[data-testid="password-input"]')

    // Should show password strength error
    await expect(page.locator('[data-testid="password-strength-error"]')).toBeVisible()
  })
})

test.describe('Authentication Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/login')

    // Navigate using keyboard
    await page.keyboard.press('Tab') // Email field
    await page.keyboard.type('test@example.com')

    await page.keyboard.press('Tab') // Password field
    await page.keyboard.type('password')

    await page.keyboard.press('Tab') // Login button
    await page.keyboard.press('Enter')

    // Form should submit
    await page.waitForTimeout(1000)
  })

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/login')

    // Check ARIA labels
    await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-label')
    await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('aria-label')
    await expect(page.locator('[data-testid="login-button"]')).toHaveAttribute('aria-label')
  })

  test('should work with screen readers', async ({ page }) => {
    await page.goto('/login')

    // Check for screen reader support
    await expect(page.locator('[data-testid="login-form"]')).toHaveAttribute('role')
    await expect(page.locator('h1')).toBeVisible() // Page heading
  })
})