import { test, expect, customExpect } from './fixtures.js'

test.describe('Reading Session Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('Start Reading Session', () => {
    test('should start reading session from book details', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/books/${testBook.id}`)

      // Start reading session
      await authenticatedPage.click('[data-testid="start-reading-button"]')

      // Should navigate to reader
      await expect(authenticatedPage).toHaveURL(new RegExp(`/reader/${testBook.id}`))
      await expect(authenticatedPage.locator('[data-testid="book-reader"]')).toBeVisible()

      // Should show reading session UI
      await expect(authenticatedPage.locator('[data-testid="reading-timer"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="session-controls"]')).toBeVisible()
    })

    test('should start reading session from library', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto('/library')

      // Click read button on book card
      await authenticatedPage.click(`[data-testid="read-book-${testBook.id}"]`)

      // Should navigate to reader
      await expect(authenticatedPage).toHaveURL(new RegExp(`/reader/${testBook.id}`))
      await expect(authenticatedPage.locator('[data-testid="book-reader"]')).toBeVisible()
    })

    test('should resume previous reading session', async ({ authenticatedPage, testBook }) => {
      // Start a reading session first
      await authenticatedPage.goto(`/books/${testBook.id}`)
      await authenticatedPage.click('[data-testid="start-reading-button"]')

      // Navigate away without ending session
      await authenticatedPage.goto('/dashboard')

      // Return to book
      await authenticatedPage.goto(`/books/${testBook.id}`)

      // Should offer to resume session
      await expect(authenticatedPage.locator('[data-testid="resume-session-prompt"]')).toBeVisible()
      await authenticatedPage.click('[data-testid="resume-session-button"]')

      // Should return to reader with session active
      await expect(authenticatedPage).toHaveURL(new RegExp(`/reader/${testBook.id}`))
      await expect(authenticatedPage.locator('[data-testid="reading-timer"]')).toBeVisible()
    })
  })

  test.describe('Reading Timer and Progress', () => {
    test('should track reading time accurately', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/reader/${testBook.id}`)

      // Start reading session
      await authenticatedPage.click('[data-testid="start-session-button"]')

      // Wait for timer to start
      await expect(authenticatedPage.locator('[data-testid="session-active"]')).toBeVisible()

      // Check initial timer state
      const initialTime = await authenticatedPage.locator('[data-testid="reading-timer"]').textContent()
      expect(initialTime).toMatch(/00:00:00|0:00/)

      // Wait for some time
      await authenticatedPage.waitForTimeout(3000)

      // Check timer has progressed
      const progressedTime = await authenticatedPage.locator('[data-testid="reading-timer"]').textContent()
      expect(progressedTime).not.toBe(initialTime)
    })

    test('should pause and resume reading timer', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/reader/${testBook.id}`)

      // Start session
      await authenticatedPage.click('[data-testid="start-session-button"]')
      await authenticatedPage.waitForTimeout(2000)

      // Pause session
      await authenticatedPage.click('[data-testid="pause-session-button"]')
      await expect(authenticatedPage.locator('[data-testid="session-paused"]')).toBeVisible()

      const pausedTime = await authenticatedPage.locator('[data-testid="reading-timer"]').textContent()

      // Wait while paused
      await authenticatedPage.waitForTimeout(2000)

      // Time should not have changed while paused
      const timeAfterPause = await authenticatedPage.locator('[data-testid="reading-timer"]').textContent()
      expect(timeAfterPause).toBe(pausedTime)

      // Resume session
      await authenticatedPage.click('[data-testid="resume-session-button"]')
      await expect(authenticatedPage.locator('[data-testid="session-active"]')).toBeVisible()

      // Wait for timer to progress again
      await authenticatedPage.waitForTimeout(2000)
      const resumedTime = await authenticatedPage.locator('[data-testid="reading-timer"]').textContent()
      expect(resumedTime).not.toBe(pausedTime)
    })

    test('should track reading progress through pages', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/reader/${testBook.id}`)

      // Start session
      await authenticatedPage.click('[data-testid="start-session-button"]')

      // Check initial progress
      const initialProgress = await authenticatedPage.locator('[data-testid="reading-progress"]').textContent()

      // Navigate to next page
      await authenticatedPage.click('[data-testid="next-page-button"]')
      await authenticatedPage.waitForTimeout(1000)

      // Progress should update
      const updatedProgress = await authenticatedPage.locator('[data-testid="reading-progress"]').textContent()
      expect(updatedProgress).not.toBe(initialProgress)

      // Progress bar should reflect change
      const progressBar = authenticatedPage.locator('[data-testid="progress-bar"]')
      const progressValue = await progressBar.getAttribute('value')
      expect(parseInt(progressValue)).toBeGreaterThan(0)
    })

    test('should update session statistics in real-time', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/reader/${testBook.id}`)

      // Start session and read for a bit
      await authenticatedPage.click('[data-testid="start-session-button"]')
      await authenticatedPage.waitForTimeout(3000)

      // Navigate through pages
      await authenticatedPage.click('[data-testid="next-page-button"]')
      await authenticatedPage.waitForTimeout(1000)
      await authenticatedPage.click('[data-testid="next-page-button"]')

      // Check session stats
      await expect(authenticatedPage.locator('[data-testid="pages-read"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="reading-speed"]')).toBeVisible()

      const pagesRead = await authenticatedPage.locator('[data-testid="pages-read"]').textContent()
      expect(pagesRead).toMatch(/2|pages/)
    })
  })

  test.describe('Reading Session Controls', () => {
    test('should provide session control buttons', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/reader/${testBook.id}`)

      // Should show session controls
      await expect(authenticatedPage.locator('[data-testid="session-controls"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="start-session-button"]')).toBeVisible()

      // Start session
      await authenticatedPage.click('[data-testid="start-session-button"]')

      // Controls should update for active session
      await expect(authenticatedPage.locator('[data-testid="pause-session-button"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="end-session-button"]')).toBeVisible()
    })

    test('should end reading session and save progress', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/reader/${testBook.id}`)

      // Start and run session
      await authenticatedPage.click('[data-testid="start-session-button"]')
      await authenticatedPage.waitForTimeout(2000)

      // Navigate through some pages
      await authenticatedPage.click('[data-testid="next-page-button"]')
      await authenticatedPage.click('[data-testid="next-page-button"]')

      // End session
      await authenticatedPage.click('[data-testid="end-session-button"]')

      // Should show session summary
      await expect(authenticatedPage.locator('[data-testid="session-summary"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="session-time"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="session-pages"]')).toBeVisible()

      // Save session
      await authenticatedPage.click('[data-testid="save-session-button"]')
      await customExpect.toHaveSuccessMessage(authenticatedPage, 'session saved')
    })

    test('should handle session interruption gracefully', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/reader/${testBook.id}`)

      // Start session
      await authenticatedPage.click('[data-testid="start-session-button"]')
      await authenticatedPage.waitForTimeout(2000)

      // Navigate away from reader
      await authenticatedPage.goto('/dashboard')

      // Should auto-save session
      await expect(authenticatedPage.locator('[data-testid="session-auto-saved"]')).toBeVisible()

      // Return to reader
      await authenticatedPage.goto(`/reader/${testBook.id}`)

      // Should show option to continue session
      await expect(authenticatedPage.locator('[data-testid="continue-session-prompt"]')).toBeVisible()
    })
  })

  test.describe('Reading Goals Integration', () => {
    test('should update daily reading goal progress', async ({ authenticatedPage, testBook }) => {
      // Set a daily reading goal first
      await authenticatedPage.goto('/goals')
      await authenticatedPage.click('[data-testid="set-daily-goal-button"]')
      await authenticatedPage.fill('[data-testid="daily-minutes-input"]', '30')
      await authenticatedPage.click('[data-testid="save-goal-button"]')

      // Start reading session
      await authenticatedPage.goto(`/reader/${testBook.id}`)
      await authenticatedPage.click('[data-testid="start-session-button"]')

      // Read for a bit
      await authenticatedPage.waitForTimeout(3000)

      // End session
      await authenticatedPage.click('[data-testid="end-session-button"]')
      await authenticatedPage.click('[data-testid="save-session-button"]')

      // Check goal progress was updated
      await authenticatedPage.goto('/dashboard')
      await expect(authenticatedPage.locator('[data-testid="daily-goal-progress"]')).toBeVisible()

      const progressText = await authenticatedPage.locator('[data-testid="goal-progress-text"]').textContent()
      expect(progressText).toMatch(/\d+/)
    })

    test('should track weekly reading streaks', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/reader/${testBook.id}`)

      // Complete a reading session
      await authenticatedPage.click('[data-testid="start-session-button"]')
      await authenticatedPage.waitForTimeout(2000)
      await authenticatedPage.click('[data-testid="end-session-button"]')
      await authenticatedPage.click('[data-testid="save-session-button"]')

      // Check streak tracking
      await authenticatedPage.goto('/dashboard')
      await expect(authenticatedPage.locator('[data-testid="reading-streak"]')).toBeVisible()

      const streakText = await authenticatedPage.locator('[data-testid="current-streak"]').textContent()
      expect(streakText).toMatch(/\d+ day/)
    })
  })

  test.describe('Note-Taking During Reading', () => {
    test('should create notes during reading session', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/reader/${testBook.id}`)

      // Start session
      await authenticatedPage.click('[data-testid="start-session-button"]')

      // Open note-taking interface
      await authenticatedPage.click('[data-testid="add-note-button"]')
      await expect(authenticatedPage.locator('[data-testid="note-editor"]')).toBeVisible()

      // Create a note
      await authenticatedPage.fill('[data-testid="note-content"]', 'This is an interesting point about the story.')
      await authenticatedPage.click('[data-testid="save-note-button"]')

      // Note should be saved and visible
      await customExpect.toHaveSuccessMessage(authenticatedPage, 'note saved')
      await expect(authenticatedPage.locator('[data-testid="session-notes"]')).toBeVisible()
    })

    test('should highlight text and create notes', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/reader/${testBook.id}`)

      // Start session
      await authenticatedPage.click('[data-testid="start-session-button"]')

      // Select text to highlight (simulate text selection)
      await authenticatedPage.evaluate(() => {
        const textElement = document.querySelector('[data-testid="book-content"] p')
        if (textElement) {
          const range = document.createRange()
          range.selectNodeContents(textElement)
          const selection = window.getSelection()
          selection.removeAllRanges()
          selection.addRange(range)
        }
      })

      // Click highlight button
      await authenticatedPage.click('[data-testid="highlight-text-button"]')

      // Should show highlight options
      await expect(authenticatedPage.locator('[data-testid="highlight-options"]')).toBeVisible()

      // Add note to highlight
      await authenticatedPage.click('[data-testid="add-highlight-note"]')
      await authenticatedPage.fill('[data-testid="highlight-note-input"]', 'Important quote')
      await authenticatedPage.click('[data-testid="save-highlight-button"]')

      // Highlight should be visible
      await expect(authenticatedPage.locator('[data-testid="text-highlight"]')).toBeVisible()
    })
  })

  test.describe('Session History and Analytics', () => {
    test('should save and display session history', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/reader/${testBook.id}`)

      // Complete a reading session
      await authenticatedPage.click('[data-testid="start-session-button"]')
      await authenticatedPage.waitForTimeout(2000)
      await authenticatedPage.click('[data-testid="end-session-button"]')
      await authenticatedPage.click('[data-testid="save-session-button"]')

      // Go to reading history
      await authenticatedPage.goto('/reading-history')

      // Should show completed session
      await expect(authenticatedPage.locator('[data-testid="session-history"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="recent-session"]')).toBeVisible()

      // Session details should be visible
      await expect(authenticatedPage.locator('[data-testid="session-book-title"]')).toHaveText(testBook.title)
      await expect(authenticatedPage.locator('[data-testid="session-duration"]')).toBeVisible()
    })

    test('should display reading analytics', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/reading-analytics')

      // Should show analytics dashboard
      await expect(authenticatedPage.locator('[data-testid="analytics-dashboard"]')).toBeVisible()

      // Check for key metrics
      await expect(authenticatedPage.locator('[data-testid="total-reading-time"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="books-completed"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="average-session-length"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="reading-chart"]')).toBeVisible()
    })

    test('should filter session history by date range', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/reading-history')

      // Apply date filter
      await authenticatedPage.click('[data-testid="date-filter-button"]')
      await authenticatedPage.selectOption('[data-testid="date-range-select"]', 'last-week')

      // Results should filter
      await expect(authenticatedPage.locator('[data-testid="filtered-sessions"]')).toBeVisible()

      // Change to custom date range
      await authenticatedPage.selectOption('[data-testid="date-range-select"]', 'custom')
      await expect(authenticatedPage.locator('[data-testid="custom-date-inputs"]')).toBeVisible()
    })
  })

  test.describe('Reading Session Performance', () => {
    test('should handle long reading sessions efficiently', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/reader/${testBook.id}`)

      // Start session
      await authenticatedPage.click('[data-testid="start-session-button"]')

      // Simulate extended reading (navigate through multiple pages)
      for (let i = 0; i < 10; i++) {
        await authenticatedPage.click('[data-testid="next-page-button"]')
        await authenticatedPage.waitForTimeout(500)
      }

      // Session should remain responsive
      const timerElement = authenticatedPage.locator('[data-testid="reading-timer"]')
      await expect(timerElement).toBeVisible()

      // End session should work without issues
      await authenticatedPage.click('[data-testid="end-session-button"]')
      await expect(authenticatedPage.locator('[data-testid="session-summary"]')).toBeVisible()
    })

    test('should sync session data reliably', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/reader/${testBook.id}`)

      // Start session
      await authenticatedPage.click('[data-testid="start-session-button"]')
      await authenticatedPage.waitForTimeout(2000)

      // Simulate network interruption by intercepting requests
      await authenticatedPage.route('**/api/reading/**', route => route.abort())

      // Continue reading
      await authenticatedPage.click('[data-testid="next-page-button"]')

      // Should show offline indicator
      await expect(authenticatedPage.locator('[data-testid="offline-indicator"]')).toBeVisible()

      // Re-enable network
      await authenticatedPage.unroute('**/api/reading/**')

      // Should sync when connection restored
      await expect(authenticatedPage.locator('[data-testid="sync-indicator"]')).toBeVisible()
    })
  })

  test.describe('Reading Session Accessibility', () => {
    test('should support keyboard navigation in reader', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/reader/${testBook.id}`)

      // Navigate using keyboard
      await authenticatedPage.keyboard.press('Tab') // Start session button
      await authenticatedPage.keyboard.press('Enter')

      // Should start session
      await expect(authenticatedPage.locator('[data-testid="session-active"]')).toBeVisible()

      // Use arrow keys for page navigation
      await authenticatedPage.keyboard.press('ArrowRight') // Next page
      await authenticatedPage.waitForTimeout(500)

      await authenticatedPage.keyboard.press('ArrowLeft') // Previous page
      await authenticatedPage.waitForTimeout(500)

      // Use space for pause/resume
      await authenticatedPage.keyboard.press('Space')
      await expect(authenticatedPage.locator('[data-testid="session-paused"]')).toBeVisible()
    })

    test('should have proper ARIA labels for session controls', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/reader/${testBook.id}`)

      // Check ARIA attributes on controls
      await expect(authenticatedPage.locator('[data-testid="start-session-button"]')).toHaveAttribute('aria-label')
      await expect(authenticatedPage.locator('[data-testid="reading-timer"]')).toHaveAttribute('aria-live')

      // Start session and check active controls
      await authenticatedPage.click('[data-testid="start-session-button"]')

      await expect(authenticatedPage.locator('[data-testid="pause-session-button"]')).toHaveAttribute('aria-label')
      await expect(authenticatedPage.locator('[data-testid="end-session-button"]')).toHaveAttribute('aria-label')
    })

    test('should announce session state changes', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/reader/${testBook.id}`)

      // Check for screen reader announcements
      await expect(authenticatedPage.locator('[data-testid="session-status"]')).toHaveAttribute('aria-live')

      // Start session
      await authenticatedPage.click('[data-testid="start-session-button"]')

      // Should announce session start
      await expect(authenticatedPage.locator('[data-testid="session-status"]')).toHaveText(/session started|reading session active/i)

      // Pause session
      await authenticatedPage.click('[data-testid="pause-session-button"]')

      // Should announce pause
      await expect(authenticatedPage.locator('[data-testid="session-status"]')).toHaveText(/session paused|reading paused/i)
    })
  })
})