import { test, expect, customExpect } from './fixtures.js'

test.describe('Library Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('Book Upload Flow', () => {
    test('should upload a new book successfully', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/upload')

      // Wait for upload form to load
      await expect(authenticatedPage.locator('[data-testid="upload-form"]')).toBeVisible()

      // Create a test PDF file
      const testFile = Buffer.from('Test PDF content for E2E testing')
      await authenticatedPage.setInputFiles('[data-testid="file-input"]', {
        name: 'test-book.pdf',
        mimeType: 'application/pdf',
        buffer: testFile
      })

      // Fill book metadata
      await authenticatedPage.fill('[data-testid="book-title"]', 'E2E Test Book')
      await authenticatedPage.fill('[data-testid="book-author"]', 'Test Author')
      await authenticatedPage.fill('[data-testid="book-description"]', 'This is a test book for E2E testing')
      await authenticatedPage.selectOption('[data-testid="book-genre"]', 'Fiction')

      // Upload the book
      await authenticatedPage.click('[data-testid="upload-button"]')

      // Wait for successful upload
      await expect(authenticatedPage.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 })
      await customExpect.toHaveSuccessMessage(authenticatedPage, 'uploaded successfully')

      // Should redirect to library or book details
      await expect(authenticatedPage).toHaveURL(/\/library|\/books\//)
    })

    test('should validate file type restrictions', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/upload')

      // Try to upload invalid file type
      const testFile = Buffer.from('Invalid file content')
      await authenticatedPage.setInputFiles('[data-testid="file-input"]', {
        name: 'test-file.txt',
        mimeType: 'text/plain',
        buffer: testFile
      })

      await authenticatedPage.click('[data-testid="upload-button"]')

      // Should show file type error
      await expect(authenticatedPage.locator('[data-testid="file-type-error"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="file-type-error"]')).toContainText(/invalid file type|unsupported format/i)
    })

    test('should validate file size limits', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/upload')

      // Create a large file (simulate by setting large size in metadata)
      const largeFile = Buffer.alloc(50 * 1024 * 1024) // 50MB
      await authenticatedPage.setInputFiles('[data-testid="file-input"]', {
        name: 'large-book.pdf',
        mimeType: 'application/pdf',
        buffer: largeFile
      })

      await authenticatedPage.click('[data-testid="upload-button"]')

      // Should show file size error
      await expect(authenticatedPage.locator('[data-testid="file-size-error"]')).toBeVisible()
    })

    test('should validate required metadata fields', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/upload')

      // Try to upload without required fields
      await authenticatedPage.click('[data-testid="upload-button"]')

      // Should show validation errors
      await expect(authenticatedPage.locator('[data-testid="title-error"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="author-error"]')).toBeVisible()
    })
  })

  test.describe('Library Browse and Search', () => {
    test('should display user library with books', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto('/library')

      // Should show library page
      await expect(authenticatedPage.locator('[data-testid="library-page"]')).toBeVisible()

      // Should show the test book
      await expect(authenticatedPage.locator(`[data-testid="book-${testBook.id}"]`)).toBeVisible()
      await expect(authenticatedPage.locator(`[data-testid="book-title-${testBook.id}"]`)).toHaveText(testBook.title)
      await expect(authenticatedPage.locator(`[data-testid="book-author-${testBook.id}"]`)).toHaveText(testBook.author)
    })

    test('should search books by title', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto('/library')

      // Search for the test book
      await authenticatedPage.fill('[data-testid="search-input"]', testBook.title.substring(0, 5))
      await authenticatedPage.click('[data-testid="search-button"]')

      // Should show filtered results
      await expect(authenticatedPage.locator(`[data-testid="book-${testBook.id}"]`)).toBeVisible()

      // Search for non-existent book
      await authenticatedPage.fill('[data-testid="search-input"]', 'NonexistentBook')
      await authenticatedPage.click('[data-testid="search-button"]')

      // Should show no results
      await expect(authenticatedPage.locator('[data-testid="no-results"]')).toBeVisible()
    })

    test('should filter books by genre', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto('/library')

      // Apply genre filter
      await authenticatedPage.selectOption('[data-testid="genre-filter"]', 'Fiction')

      // Should show filtered books
      await expect(authenticatedPage.locator('[data-testid="filtered-books"]')).toBeVisible()

      // Clear filter
      await authenticatedPage.selectOption('[data-testid="genre-filter"]', 'All')
      await expect(authenticatedPage.locator(`[data-testid="book-${testBook.id}"]`)).toBeVisible()
    })

    test('should sort books by different criteria', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/library')

      // Sort by title
      await authenticatedPage.selectOption('[data-testid="sort-select"]', 'title')

      // Wait for re-render
      await authenticatedPage.waitForTimeout(500)

      // Sort by date added
      await authenticatedPage.selectOption('[data-testid="sort-select"]', 'dateAdded')
      await authenticatedPage.waitForTimeout(500)

      // Sort by author
      await authenticatedPage.selectOption('[data-testid="sort-select"]', 'author')
      await authenticatedPage.waitForTimeout(500)
    })

    test('should handle pagination for large libraries', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/library')

      // Check if pagination exists (might not if few books)
      const pagination = authenticatedPage.locator('[data-testid="pagination"]')
      const isVisible = await pagination.isVisible()

      if (isVisible) {
        // Test pagination navigation
        await authenticatedPage.click('[data-testid="next-page"]')
        await authenticatedPage.waitForLoadState('networkidle')

        await authenticatedPage.click('[data-testid="prev-page"]')
        await authenticatedPage.waitForLoadState('networkidle')
      }
    })
  })

  test.describe('Book Management Actions', () => {
    test('should view book details', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto('/library')

      // Click on book to view details
      await authenticatedPage.click(`[data-testid="book-${testBook.id}"]`)

      // Should navigate to book details page
      await expect(authenticatedPage).toHaveURL(new RegExp(`/books/${testBook.id}`))
      await expect(authenticatedPage.locator('[data-testid="book-details"]')).toBeVisible()

      // Should show book information
      await expect(authenticatedPage.locator('[data-testid="book-title"]')).toHaveText(testBook.title)
      await expect(authenticatedPage.locator('[data-testid="book-author"]')).toHaveText(testBook.author)
      await expect(authenticatedPage.locator('[data-testid="book-description"]')).toHaveText(testBook.description)
    })

    test('should edit book metadata', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/books/${testBook.id}`)

      // Click edit button
      await authenticatedPage.click('[data-testid="edit-book-button"]')

      // Should show edit form
      await expect(authenticatedPage.locator('[data-testid="edit-book-form"]')).toBeVisible()

      // Update book details
      const updatedTitle = 'Updated E2E Test Book'
      await authenticatedPage.fill('[data-testid="edit-title-input"]', updatedTitle)

      // Save changes
      await authenticatedPage.click('[data-testid="save-book-button"]')

      // Should show success message and updated title
      await customExpect.toHaveSuccessMessage(authenticatedPage, 'updated successfully')
      await expect(authenticatedPage.locator('[data-testid="book-title"]')).toHaveText(updatedTitle)
    })

    test('should delete book with confirmation', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto('/library')

      // Click delete button
      await authenticatedPage.click(`[data-testid="delete-book-${testBook.id}"]`)

      // Should show confirmation dialog
      await expect(authenticatedPage.locator('[data-testid="delete-confirmation"]')).toBeVisible()

      // Cancel deletion
      await authenticatedPage.click('[data-testid="cancel-delete"]')
      await expect(authenticatedPage.locator(`[data-testid="book-${testBook.id}"]`)).toBeVisible()

      // Try delete again and confirm
      await authenticatedPage.click(`[data-testid="delete-book-${testBook.id}"]`)
      await authenticatedPage.click('[data-testid="confirm-delete"]')

      // Should show success message and book should be removed
      await customExpect.toHaveSuccessMessage(authenticatedPage, 'deleted successfully')
      await expect(authenticatedPage.locator(`[data-testid="book-${testBook.id}"]`)).not.toBeVisible()
    })

    test('should start reading session from book details', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/books/${testBook.id}`)

      // Click read button
      await authenticatedPage.click('[data-testid="read-book-button"]')

      // Should navigate to reader
      await expect(authenticatedPage).toHaveURL(new RegExp(`/reader/${testBook.id}`))
      await expect(authenticatedPage.locator('[data-testid="book-reader"]')).toBeVisible()
    })
  })

  test.describe('Book Collections', () => {
    test('should create a new collection', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/collections')

      // Click create collection button
      await authenticatedPage.click('[data-testid="create-collection-button"]')

      // Fill collection details
      await authenticatedPage.fill('[data-testid="collection-name"]', 'E2E Test Collection')
      await authenticatedPage.fill('[data-testid="collection-description"]', 'Collection for E2E testing')

      // Create collection
      await authenticatedPage.click('[data-testid="save-collection-button"]')

      // Should show success and new collection
      await customExpect.toHaveSuccessMessage(authenticatedPage, 'collection created')
      await expect(authenticatedPage.locator('[data-testid="collection-E2E Test Collection"]')).toBeVisible()
    })

    test('should add books to collection', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto('/collections')

      // Open collection management
      await authenticatedPage.click('[data-testid="manage-collections-button"]')

      // Add book to collection
      await authenticatedPage.check(`[data-testid="add-book-${testBook.id}-to-collection"]`)

      // Save changes
      await authenticatedPage.click('[data-testid="save-collection-changes"]')

      await customExpect.toHaveSuccessMessage(authenticatedPage, 'collection updated')
    })
  })

  test.describe('Library Performance', () => {
    test('should load library page within performance budget', async ({ authenticatedPage, performanceMonitor }) => {
      await performanceMonitor.startMonitoring()

      await authenticatedPage.goto('/library')
      await authenticatedPage.waitForLoadState('networkidle')

      const metrics = await performanceMonitor.getMetrics()

      // Performance assertions
      expect(metrics.domContentLoaded).toBeLessThan(3000) // 3 seconds
      expect(metrics.loadComplete).toBeLessThan(5000) // 5 seconds
      expect(metrics.firstContentfulPaint).toBeLessThan(2000) // 2 seconds
    })

    test('should handle large book list efficiently', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/library')

      // Measure scroll performance
      const startTime = Date.now()

      // Scroll to bottom
      await authenticatedPage.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight)
      })

      await authenticatedPage.waitForTimeout(1000)

      const scrollTime = Date.now() - startTime
      expect(scrollTime).toBeLessThan(2000) // Should scroll smoothly
    })
  })

  test.describe('Library Accessibility', () => {
    test('should be keyboard navigable', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/library')

      // Navigate using keyboard
      await authenticatedPage.keyboard.press('Tab') // Search input
      await authenticatedPage.keyboard.type('Test')

      await authenticatedPage.keyboard.press('Tab') // Search button
      await authenticatedPage.keyboard.press('Enter')

      await authenticatedPage.waitForTimeout(1000)
    })

    test('should have proper ARIA labels and roles', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/library')

      // Check ARIA attributes
      await expect(authenticatedPage.locator('[data-testid="search-input"]')).toHaveAttribute('aria-label')
      await expect(authenticatedPage.locator('[data-testid="book-grid"]')).toHaveAttribute('role')
      await expect(authenticatedPage.locator('[data-testid="sort-select"]')).toHaveAttribute('aria-label')
    })

    test('should work with screen readers', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/library')

      // Check for proper heading structure
      await expect(authenticatedPage.locator('h1')).toBeVisible()

      // Check for descriptive labels
      const buttons = authenticatedPage.locator('button')
      const buttonCount = await buttons.count()

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i)
        const hasLabel = await button.evaluate(el =>
          el.hasAttribute('aria-label') ||
          el.hasAttribute('aria-labelledby') ||
          el.textContent.trim().length > 0
        )
        expect(hasLabel).toBe(true)
      }
    })
  })

  test.describe('Mobile Library Experience', () => {
    test('should work on mobile devices', async ({ mobileContext }) => {
      const page = await mobileContext.newPage()

      // Login on mobile
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', 'e2e.test@example.com')
      await page.fill('[data-testid="password-input"]', 'TestPassword123!')
      await page.click('[data-testid="login-button"]')

      await page.waitForURL('/dashboard')

      // Navigate to library
      await page.goto('/library')

      // Should show mobile-optimized layout
      await expect(page.locator('[data-testid="mobile-library-grid"]')).toBeVisible()

      // Test mobile search
      await page.click('[data-testid="mobile-search-toggle"]')
      await expect(page.locator('[data-testid="mobile-search-overlay"]')).toBeVisible()

      await page.close()
    })

    test('should support touch gestures on mobile', async ({ mobileContext }) => {
      const page = await mobileContext.newPage()

      // Login and navigate to library
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', 'e2e.test@example.com')
      await page.fill('[data-testid="password-input"]', 'TestPassword123!')
      await page.click('[data-testid="login-button"]')

      await page.waitForURL('/dashboard')
      await page.goto('/library')

      // Test swipe gestures for navigation (if implemented)
      const startX = 100
      const endX = 300
      const y = 200

      await page.touchscreen.tap(startX, y)
      await page.touchscreen.tap(endX, y)

      await page.close()
    })
  })
})