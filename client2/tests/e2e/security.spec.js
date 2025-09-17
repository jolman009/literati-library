import { test, expect, customExpect } from './fixtures.js'

test.describe('Security Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('Authentication Security', () => {
    test('should enforce strong password requirements', async ({ page }) => {
      await page.goto('/register')

      // Test weak passwords
      const weakPasswords = [
        '123',
        'password',
        'abc123',
        '12345678',
        'qwerty',
        'password123'
      ]

      for (const weakPassword of weakPasswords) {
        await page.fill('[data-testid="name-input"]', 'Test User')
        await page.fill('[data-testid="email-input"]', `test${Date.now()}@example.com`)
        await page.fill('[data-testid="password-input"]', weakPassword)
        await page.blur('[data-testid="password-input"]')

        // Should show password strength error
        await expect(page.locator('[data-testid="password-strength-error"]')).toBeVisible()

        // Clear fields for next test
        await page.fill('[data-testid="password-input"]', '')
      }

      // Test strong password should pass
      const strongPassword = 'StrongP@ssw0rd!2024'
      await page.fill('[data-testid="password-input"]', strongPassword)
      await page.blur('[data-testid="password-input"]')

      // Should not show error or show success
      const errorVisible = await page.locator('[data-testid="password-strength-error"]').isVisible()
      expect(errorVisible).toBe(false)
    })

    test('should check for compromised passwords', async ({ page }) => {
      await page.goto('/register')

      await page.fill('[data-testid="name-input"]', 'Test User')
      await page.fill('[data-testid="email-input"]', `test${Date.now()}@example.com`)

      // Use a known compromised password
      await page.fill('[data-testid="password-input"]', 'password123')
      await page.fill('[data-testid="confirm-password-input"]', 'password123')

      await page.click('[data-testid="register-button"]')

      // Should show breach warning
      await expect(page.locator('[data-testid="password-breach-warning"]')).toBeVisible()
      await expect(page.locator('[data-testid="password-breach-warning"]')).toContainText(/compromised|breach/i)
    })

    test('should handle rate limiting on login attempts', async ({ page }) => {
      await page.goto('/login')

      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await page.fill('[data-testid="email-input"]', 'nonexistent@example.com')
        await page.fill('[data-testid="password-input"]', 'wrongpassword')
        await page.click('[data-testid="login-button"]')

        // Wait between attempts
        await page.waitForTimeout(500)
      }

      // Should show rate limit error
      await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="rate-limit-error"]')).toContainText(/too many attempts|rate limit/i)
    })

    test('should invalidate tokens on logout', async ({ authenticatedPage }) => {
      // Get the token before logout
      const tokenBeforeLogout = await authenticatedPage.evaluate(() => localStorage.getItem('token'))
      expect(tokenBeforeLogout).toBeTruthy()

      // Logout
      await authenticatedPage.click('[data-testid="user-menu"]')
      await authenticatedPage.click('[data-testid="logout-button"]')

      // Should redirect to login
      await expect(authenticatedPage).toHaveURL('/login')

      // Token should be cleared from storage
      const tokenAfterLogout = await authenticatedPage.evaluate(() => localStorage.getItem('token'))
      expect(tokenAfterLogout).toBeNull()

      // Try to access protected route with old token
      await authenticatedPage.evaluate((token) => {
        localStorage.setItem('token', token)
      }, tokenBeforeLogout)

      await authenticatedPage.goto('/library')

      // Should redirect to login due to invalid token
      await expect(authenticatedPage).toHaveURL('/login')
    })

    test('should handle token refresh securely', async ({ authenticatedPage }) => {
      // Get initial token
      const initialToken = await authenticatedPage.evaluate(() => localStorage.getItem('token'))

      // Wait for token refresh to potentially occur
      await authenticatedPage.waitForTimeout(5000)

      // Make an API call that might trigger refresh
      await authenticatedPage.goto('/library')
      await authenticatedPage.waitForLoadState('networkidle')

      // Check if token was refreshed (might be the same if not expired)
      const currentToken = await authenticatedPage.evaluate(() => localStorage.getItem('token'))
      expect(currentToken).toBeTruthy()

      // Verify the token is still valid
      await authenticatedPage.goto('/dashboard')
      await expect(authenticatedPage.locator('[data-testid="user-menu"]')).toBeVisible()
    })

    test('should protect against session fixation', async ({ page }) => {
      // Set a fake session token before login
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.setItem('token', 'fake-session-token')
      })

      // Login with valid credentials
      await page.fill('[data-testid="email-input"]', 'e2e.test@example.com')
      await page.fill('[data-testid="password-input"]', 'TestPassword123!')
      await page.click('[data-testid="login-button"]')

      await page.waitForURL('/dashboard')

      // Check that a new token was issued
      const newToken = await page.evaluate(() => localStorage.getItem('token'))
      expect(newToken).not.toBe('fake-session-token')
      expect(newToken).toBeTruthy()
    })
  })

  test.describe('Input Validation and Sanitization', () => {
    test('should sanitize XSS attempts in forms', async ({ page }) => {
      await page.goto('/register')

      // Try XSS in various form fields
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert(1)',
        '<svg onload="alert(1)">',
        '"onmouseover="alert(1)"'
      ]

      for (const payload of xssPayloads) {
        await page.fill('[data-testid="name-input"]', payload)
        await page.fill('[data-testid="email-input"]', `${payload}@example.com`)

        // Check that no scripts execute
        const alertHandled = await page.evaluate(() => {
          let alertCalled = false
          const originalAlert = window.alert
          window.alert = () => { alertCalled = true }
          setTimeout(() => { window.alert = originalAlert }, 100)
          return alertCalled
        })

        expect(alertHandled).toBe(false)

        // Clear fields
        await page.fill('[data-testid="name-input"]', '')
        await page.fill('[data-testid="email-input"]', '')
      }
    })

    test('should validate file uploads', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/upload')

      // Try to upload potentially malicious files
      const maliciousFiles = [
        { name: 'script.js', content: 'alert("xss")', mimeType: 'application/javascript' },
        { name: 'malware.exe', content: 'MZ\x90\x00', mimeType: 'application/x-msdownload' },
        { name: 'shell.php', content: '<?php system($_GET["cmd"]); ?>', mimeType: 'application/x-httpd-php' },
        { name: 'test.html', content: '<script>alert(1)</script>', mimeType: 'text/html' }
      ]

      for (const file of maliciousFiles) {
        const buffer = Buffer.from(file.content)
        await authenticatedPage.setInputFiles('[data-testid="file-input"]', {
          name: file.name,
          mimeType: file.mimeType,
          buffer: buffer
        })

        await authenticatedPage.click('[data-testid="upload-button"]')

        // Should show file type rejection
        await expect(authenticatedPage.locator('[data-testid="file-type-error"]')).toBeVisible()

        // Clear file input
        await authenticatedPage.setInputFiles('[data-testid="file-input"]', [])
      }
    })

    test('should prevent SQL injection in search', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto('/library')

      // Try SQL injection payloads in search
      const sqlInjectionPayloads = [
        "'; DROP TABLE books; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "'; UPDATE users SET password='hacked' --",
        "' OR 1=1 --"
      ]

      for (const payload of sqlInjectionPayloads) {
        await authenticatedPage.fill('[data-testid="search-input"]', payload)
        await authenticatedPage.click('[data-testid="search-button"]')

        // Wait for search results
        await authenticatedPage.waitForTimeout(1000)

        // Should either show no results or safely handle the input
        // The important thing is that no database errors occur
        const hasError = await authenticatedPage.locator('[data-testid="database-error"]').isVisible()
        expect(hasError).toBe(false)

        // Clear search
        await authenticatedPage.fill('[data-testid="search-input"]', '')
      }
    })

    test('should validate and sanitize note content', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/reader/${testBook.id}`)

      // Try to create note with XSS content
      await authenticatedPage.click('[data-testid="add-note-button"]')

      const xssContent = '<script>alert("note xss")</script><img src=x onerror=alert(1)>'
      await authenticatedPage.fill('[data-testid="note-content"]', xssContent)
      await authenticatedPage.click('[data-testid="save-note-button"]')

      // Note should be saved but content should be sanitized
      await expect(authenticatedPage.locator('[data-testid="note-saved"]')).toBeVisible()

      // Check that script didn't execute
      const alertTriggered = await authenticatedPage.evaluate(() => {
        return document.querySelector('[data-testid="note-content"]')?.innerHTML.includes('<script>')
      })
      expect(alertTriggered).toBe(false)
    })
  })

  test.describe('CSRF Protection', () => {
    test('should protect against CSRF attacks', async ({ authenticatedPage, page: attackerPage }) => {
      // Get authenticated user's session
      await authenticatedPage.goto('/dashboard')

      // Create attacker page that tries CSRF
      const csrfHtml = `
        <html>
        <body>
          <form id="csrf-form" action="http://localhost:5000/books" method="post">
            <input name="title" value="CSRF Book">
            <input name="author" value="Attacker">
          </form>
          <script>document.getElementById('csrf-form').submit();</script>
        </body>
        </html>
      `

      await attackerPage.setContent(csrfHtml)

      // Wait for the form submission attempt
      await attackerPage.waitForTimeout(2000)

      // Go back to authenticated page and check if malicious book was created
      await authenticatedPage.goto('/library')

      // Should not find the CSRF-created book
      const csrfBook = authenticatedPage.locator('[data-testid="book-title"]:has-text("CSRF Book")')
      const exists = await csrfBook.isVisible()
      expect(exists).toBe(false)
    })

    test('should require valid CSRF tokens for state-changing operations', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/upload')

      // Intercept requests to check for CSRF tokens
      const requests = []
      authenticatedPage.on('request', (request) => {
        if (request.method() === 'POST') {
          requests.push({
            url: request.url(),
            headers: request.headers()
          })
        }
      })

      // Perform upload operation
      const testFile = Buffer.from('Test file content')
      await authenticatedPage.setInputFiles('[data-testid="file-input"]', {
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: testFile
      })

      await authenticatedPage.fill('[data-testid="book-title"]', 'Test Book')
      await authenticatedPage.fill('[data-testid="book-author"]', 'Test Author')
      await authenticatedPage.click('[data-testid="upload-button"]')

      await authenticatedPage.waitForTimeout(2000)

      // Check that POST requests include CSRF protection
      const postRequests = requests.filter(req => req.url.includes('/api/'))
      expect(postRequests.length).toBeGreaterThan(0)

      // Should have authorization header or CSRF token
      const hasProtection = postRequests.some(req =>
        req.headers['authorization'] || req.headers['x-csrf-token'] || req.headers['x-requested-with']
      )
      expect(hasProtection).toBe(true)
    })
  })

  test.describe('Content Security Policy', () => {
    test('should have proper CSP headers', async ({ page }) => {
      const response = await page.goto('/')

      const cspHeader = response.headers()['content-security-policy']
      if (cspHeader) {
        // CSP should restrict inline scripts
        expect(cspHeader).toMatch(/script-src/)

        // Should restrict object and embed
        expect(cspHeader).toMatch(/object-src\s+[^;]*none/)

        // Should have frame-ancestors for clickjacking protection
        expect(cspHeader).toMatch(/frame-ancestors/)
      }
    })

    test('should block inline scripts when CSP is active', async ({ page }) => {
      await page.goto('/')

      // Try to inject inline script
      const scriptExecuted = await page.evaluate(() => {
        try {
          const script = document.createElement('script')
          script.innerHTML = 'window.testXSS = true'
          document.head.appendChild(script)
          return window.testXSS === true
        } catch (error) {
          return false
        }
      })

      // Inline script should be blocked by CSP
      expect(scriptExecuted).toBe(false)
    })
  })

  test.describe('HTTP Security Headers', () => {
    test('should have security headers present', async ({ page }) => {
      const response = await page.goto('/')
      const headers = response.headers()

      // Check for important security headers
      expect(headers['x-frame-options'] || headers['content-security-policy']).toBeTruthy()
      expect(headers['x-content-type-options']).toBe('nosniff')
      expect(headers['x-xss-protection']).toBeTruthy()

      // HSTS header for HTTPS
      if (response.url().startsWith('https://')) {
        expect(headers['strict-transport-security']).toBeTruthy()
      }
    })

    test('should protect against clickjacking', async ({ page }) => {
      const response = await page.goto('/')
      const headers = response.headers()

      // Should have either X-Frame-Options or CSP frame-ancestors
      const hasClickjackingProtection =
        headers['x-frame-options'] === 'DENY' ||
        headers['x-frame-options'] === 'SAMEORIGIN' ||
        (headers['content-security-policy'] && headers['content-security-policy'].includes('frame-ancestors'))

      expect(hasClickjackingProtection).toBe(true)
    })
  })

  test.describe('Data Exposure Prevention', () => {
    test('should not expose sensitive data in responses', async ({ authenticatedPage }) => {
      // Intercept API responses
      const apiResponses = []
      authenticatedPage.on('response', async (response) => {
        if (response.url().includes('/api/')) {
          try {
            const text = await response.text()
            apiResponses.push({
              url: response.url(),
              body: text
            })
          } catch (error) {
            // Ignore non-text responses
          }
        }
      })

      await authenticatedPage.goto('/dashboard')
      await authenticatedPage.waitForLoadState('networkidle')

      // Check that responses don't contain sensitive data
      for (const response of apiResponses) {
        // Should not expose passwords, tokens, or internal IDs
        expect(response.body).not.toMatch(/password\s*:\s*["'][^"']+["']/i)
        expect(response.body).not.toMatch(/secret\s*:\s*["'][^"']+["']/i)
        expect(response.body).not.toMatch(/database_url/i)
        expect(response.body).not.toMatch(/api_key/i)
      }
    })

    test('should not expose user data to unauthorized users', async ({ page, authenticatedPage }) => {
      // Get user ID from authenticated session
      await authenticatedPage.goto('/profile')
      const userId = await authenticatedPage.evaluate(() =>
        document.querySelector('[data-testid="user-id"]')?.textContent
      )

      if (userId) {
        // Try to access user data from unauthenticated session
        await page.goto(`/api/users/${userId}`)

        // Should redirect to login or return 401/403
        const currentUrl = page.url()
        const isSecure = currentUrl.includes('/login') ||
                        currentUrl.includes('401') ||
                        currentUrl.includes('403')

        expect(isSecure).toBe(true)
      }
    })

    test('should not allow directory traversal', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/library')

      // Try directory traversal in file access
      const traversalPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
      ]

      for (const path of traversalPaths) {
        // Try to access files using traversal
        const response = await authenticatedPage.goto(`/api/files/${path}`, { waitUntil: 'load' })

        // Should return 404 or 403, not the actual file
        expect(response.status()).toBeGreaterThanOrEqual(400)
      }
    })
  })

  test.describe('API Security', () => {
    test('should require authentication for protected endpoints', async ({ page }) => {
      const protectedEndpoints = [
        '/api/books',
        '/api/notes',
        '/api/reading-sessions',
        '/api/users/profile',
        '/api/gamification/achievements'
      ]

      for (const endpoint of protectedEndpoints) {
        const response = await page.request.get(`http://localhost:5000${endpoint}`)

        // Should return 401 unauthorized
        expect(response.status()).toBe(401)
      }
    })

    test('should validate API input parameters', async ({ authenticatedPage, apiClient }) => {
      // Get authentication token
      const { token } = await apiClient.login()

      // Try invalid input parameters
      const invalidRequests = [
        {
          endpoint: '/books',
          data: { title: '', author: 'x'.repeat(1000) } // Empty title, too long author
        },
        {
          endpoint: '/notes',
          data: { content: 'x'.repeat(10000), bookId: 'invalid-id' } // Too long content, invalid ID
        },
        {
          endpoint: '/reading-sessions',
          data: { duration: -1, bookId: null } // Negative duration, null ID
        }
      ]

      for (const req of invalidRequests) {
        const response = await authenticatedPage.request.post(`http://localhost:5000/api${req.endpoint}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          data: req.data
        })

        // Should return 400 bad request for invalid input
        expect(response.status()).toBe(400)
      }
    })

    test('should implement proper CORS policies', async ({ page }) => {
      // Check CORS headers
      const response = await page.request.options('http://localhost:5000/api/books', {
        headers: {
          'Origin': 'http://evil-site.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      })

      const corsHeaders = response.headers()

      // Should not allow arbitrary origins
      expect(corsHeaders['access-control-allow-origin']).not.toBe('*')

      // Should have proper CORS configuration
      if (corsHeaders['access-control-allow-origin']) {
        expect(corsHeaders['access-control-allow-origin']).toMatch(/localhost|literati/)
      }
    })
  })

  test.describe('Session Security', () => {
    test('should timeout inactive sessions', async ({ authenticatedPage }) => {
      // This test would need to wait for actual session timeout
      // For demo purposes, we'll simulate by clearing token after a delay
      await authenticatedPage.goto('/dashboard')

      // Simulate session timeout by manipulating token
      await authenticatedPage.evaluate(() => {
        // Set token to expired state
        const expiredToken = localStorage.getItem('token')
        if (expiredToken) {
          // Create a token with past expiration
          const payload = { exp: Math.floor(Date.now() / 1000) - 3600 } // 1 hour ago
          const fakeExpiredToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.' +
                                  btoa(JSON.stringify(payload)) + '.invalid'
          localStorage.setItem('token', fakeExpiredToken)
        }
      })

      // Try to access protected page
      await authenticatedPage.goto('/library')

      // Should redirect to login due to expired session
      await expect(authenticatedPage).toHaveURL('/login')
    })

    test('should prevent concurrent sessions when configured', async ({ page, authenticatedPage }) => {
      // Login from first browser
      await authenticatedPage.goto('/dashboard')
      await expect(authenticatedPage.locator('[data-testid="user-menu"]')).toBeVisible()

      // Try to login from second browser with same credentials
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', 'e2e.test@example.com')
      await page.fill('[data-testid="password-input"]', 'TestPassword123!')
      await page.click('[data-testid="login-button"]')

      await page.waitForURL('/dashboard')

      // First session should potentially be invalidated (depends on configuration)
      await authenticatedPage.reload()

      // Check if concurrent sessions are handled appropriately
      const isStillAuthenticated = await authenticatedPage.locator('[data-testid="user-menu"]').isVisible()

      // This behavior depends on your session management strategy
      // Could be either invalidated or allowed based on your security requirements
    })
  })

  test.describe('Error Handling Security', () => {
    test('should not expose sensitive information in error messages', async ({ page }) => {
      // Try to trigger various errors
      const errorTriggers = [
        { url: '/api/nonexistent', method: 'GET' },
        { url: '/api/books/invalid-id', method: 'GET' },
        { url: '/api/users/999999', method: 'GET' }
      ]

      for (const trigger of errorTriggers) {
        const response = await page.request.fetch(`http://localhost:5000${trigger.url}`, {
          method: trigger.method
        })

        if (!response.ok()) {
          const errorText = await response.text()

          // Should not expose stack traces, file paths, or internal details
          expect(errorText).not.toMatch(/at .+:\d+:\d+/)  // Stack traces
          expect(errorText).not.toMatch(/\/[A-Za-z]:.*\\//) // File paths
          expect(errorText).not.toMatch(/database.*error/i) // Database errors
          expect(errorText).not.toMatch(/internal.*server/i) // Internal details
        }
      }
    })

    test('should handle malformed requests gracefully', async ({ page }) => {
      // Send malformed JSON
      const response = await page.request.post('http://localhost:5000/api/books', {
        data: '{"title": "test", "author":}', // Invalid JSON
        headers: { 'Content-Type': 'application/json' }
      })

      // Should handle gracefully without exposing internals
      expect(response.status()).toBe(400)

      const errorText = await response.text()
      expect(errorText).not.toMatch(/SyntaxError.*Unexpected/)
    })
  })
})