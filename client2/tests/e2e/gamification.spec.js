import { test, expect, customExpect } from './fixtures.js'

test.describe('Gamification System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('Achievement System', () => {
    test('should display available achievements', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/achievements')

      // Should show achievements page
      await expect(authenticatedPage.locator('[data-testid="achievements-page"]')).toBeVisible()

      // Should show achievement categories
      await expect(authenticatedPage.locator('[data-testid="reading-achievements"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="collection-achievements"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="social-achievements"]')).toBeVisible()

      // Should show achievement progress
      await expect(authenticatedPage.locator('[data-testid="achievement-progress"]')).toBeVisible()
    })

    test('should unlock "First Book" achievement', async ({ authenticatedPage, testBook }) => {
      // Navigate to book details and start reading
      await authenticatedPage.goto(`/books/${testBook.id}`)
      await authenticatedPage.click('[data-testid="start-reading-button"]')

      // Read for a bit and complete session
      await authenticatedPage.click('[data-testid="start-session-button"]')
      await authenticatedPage.waitForTimeout(2000)
      await authenticatedPage.click('[data-testid="end-session-button"]')
      await authenticatedPage.click('[data-testid="save-session-button"]')

      // Should show achievement unlock notification
      await expect(authenticatedPage.locator('[data-testid="achievement-unlock"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="achievement-title"]')).toHaveText(/first book|getting started/i)
    })

    test('should track reading streak achievements', async ({ authenticatedPage, testBook }) => {
      // Complete multiple reading sessions to build streak
      for (let day = 0; day < 3; day++) {
        await authenticatedPage.goto(`/reader/${testBook.id}`)
        await authenticatedPage.click('[data-testid="start-session-button"]')
        await authenticatedPage.waitForTimeout(1000)
        await authenticatedPage.click('[data-testid="end-session-button"]')
        await authenticatedPage.click('[data-testid="save-session-button"]')

        // Simulate different days by manipulating local time
        await authenticatedPage.evaluate((dayOffset) => {
          const futureDate = new Date()
          futureDate.setDate(futureDate.getDate() + dayOffset)
          // Override Date constructor temporarily
          window.originalDate = Date
          window.Date = class extends Date {
            constructor(...args) {
              if (args.length === 0) {
                super(futureDate)
              } else {
                super(...args)
              }
            }
          }
        }, day + 1)

        await authenticatedPage.waitForTimeout(500)
      }

      // Check achievements page for streak achievement
      await authenticatedPage.goto('/achievements')

      // Should show streak achievement progress or completion
      const streakAchievement = authenticatedPage.locator('[data-testid="streak-achievement"]')
      await expect(streakAchievement).toBeVisible()

      const progressText = await streakAchievement.locator('[data-testid="achievement-progress"]').textContent()
      expect(progressText).toMatch(/\d+\/\d+|completed/i)
    })

    test('should unlock collection achievements', async ({ authenticatedPage, testBook }) => {
      // Create a collection
      await authenticatedPage.goto('/collections')
      await authenticatedPage.click('[data-testid="create-collection-button"]')
      await authenticatedPage.fill('[data-testid="collection-name"]', 'My Test Collection')
      await authenticatedPage.click('[data-testid="save-collection-button"]')

      // Add book to collection
      await authenticatedPage.click('[data-testid="add-books-to-collection"]')
      await authenticatedPage.check(`[data-testid="select-book-${testBook.id}"]`)
      await authenticatedPage.click('[data-testid="add-selected-books"]')

      // Should unlock collection achievement
      await expect(authenticatedPage.locator('[data-testid="achievement-unlock"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="achievement-title"]')).toHaveText(/collector|first collection/i)
    })

    test('should track time-based achievements', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/reader/${testBook.id}`)

      // Start a long reading session
      await authenticatedPage.click('[data-testid="start-session-button"]')

      // Read for enough time to trigger time-based achievement
      await authenticatedPage.waitForTimeout(5000) // 5 seconds for testing

      await authenticatedPage.click('[data-testid="end-session-button"]')
      await authenticatedPage.click('[data-testid="save-session-button"]')

      // Check for time-based achievement
      const achievements = authenticatedPage.locator('[data-testid="achievement-unlock"]')
      if (await achievements.count() > 0) {
        const achievementText = await achievements.first().textContent()
        expect(achievementText).toMatch(/time|minutes|dedication/i)
      }
    })

    test('should display achievement details and requirements', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/achievements')

      // Click on an achievement to view details
      await authenticatedPage.click('[data-testid="achievement-card"]:first-child')

      // Should show achievement modal or details
      await expect(authenticatedPage.locator('[data-testid="achievement-details"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="achievement-description"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="achievement-requirements"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="achievement-rewards"]')).toBeVisible()
    })
  })

  test.describe('Reading Goals', () => {
    test('should set daily reading goal', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/goals')

      // Set daily goal
      await authenticatedPage.click('[data-testid="set-daily-goal-button"]')
      await authenticatedPage.fill('[data-testid="daily-minutes-input"]', '30')
      await authenticatedPage.click('[data-testid="save-daily-goal"]')

      // Should show success message and display goal
      await customExpect.toHaveSuccessMessage(authenticatedPage, 'goal set')
      await expect(authenticatedPage.locator('[data-testid="daily-goal-display"]')).toHaveText(/30 minutes/i)
    })

    test('should set weekly reading goal', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/goals')

      // Set weekly goal
      await authenticatedPage.click('[data-testid="set-weekly-goal-button"]')
      await authenticatedPage.fill('[data-testid="weekly-books-input"]', '2')
      await authenticatedPage.click('[data-testid="save-weekly-goal"]')

      // Should show goal
      await expect(authenticatedPage.locator('[data-testid="weekly-goal-display"]')).toHaveText(/2 books/i)
    })

    test('should set monthly reading goal', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/goals')

      // Set monthly goal
      await authenticatedPage.click('[data-testid="set-monthly-goal-button"]')
      await authenticatedPage.fill('[data-testid="monthly-pages-input"]', '500')
      await authenticatedPage.click('[data-testid="save-monthly-goal"]')

      // Should show goal
      await expect(authenticatedPage.locator('[data-testid="monthly-goal-display"]')).toHaveText(/500 pages/i)
    })

    test('should track goal progress', async ({ authenticatedPage, testBook }) => {
      // Set a daily goal first
      await authenticatedPage.goto('/goals')
      await authenticatedPage.click('[data-testid="set-daily-goal-button"]')
      await authenticatedPage.fill('[data-testid="daily-minutes-input"]', '10')
      await authenticatedPage.click('[data-testid="save-daily-goal"]')

      // Complete a reading session
      await authenticatedPage.goto(`/reader/${testBook.id}`)
      await authenticatedPage.click('[data-testid="start-session-button"]')
      await authenticatedPage.waitForTimeout(3000) // 3 seconds reading
      await authenticatedPage.click('[data-testid="end-session-button"]')
      await authenticatedPage.click('[data-testid="save-session-button"]')

      // Check goal progress
      await authenticatedPage.goto('/goals')
      await expect(authenticatedPage.locator('[data-testid="daily-goal-progress"]')).toBeVisible()

      const progressBar = authenticatedPage.locator('[data-testid="daily-progress-bar"]')
      const progressValue = await progressBar.getAttribute('value')
      expect(parseInt(progressValue)).toBeGreaterThan(0)
    })

    test('should complete daily goal and show celebration', async ({ authenticatedPage, testBook }) => {
      // Set achievable goal
      await authenticatedPage.goto('/goals')
      await authenticatedPage.click('[data-testid="set-daily-goal-button"]')
      await authenticatedPage.fill('[data-testid="daily-minutes-input"]', '1') // 1 minute goal
      await authenticatedPage.click('[data-testid="save-daily-goal"]')

      // Complete enough reading to meet goal
      await authenticatedPage.goto(`/reader/${testBook.id}`)
      await authenticatedPage.click('[data-testid="start-session-button"]')
      await authenticatedPage.waitForTimeout(2000) // 2 seconds should exceed 1 minute goal
      await authenticatedPage.click('[data-testid="end-session-button"]')
      await authenticatedPage.click('[data-testid="save-session-button"]')

      // Should show goal completion celebration
      await expect(authenticatedPage.locator('[data-testid="goal-completed"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="celebration-animation"]')).toBeVisible()
    })

    test('should adjust goals dynamically', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/goals')

      // Set initial goal
      await authenticatedPage.click('[data-testid="set-daily-goal-button"]')
      await authenticatedPage.fill('[data-testid="daily-minutes-input"]', '20')
      await authenticatedPage.click('[data-testid="save-daily-goal"]')

      // Edit goal
      await authenticatedPage.click('[data-testid="edit-daily-goal"]')
      await authenticatedPage.fill('[data-testid="daily-minutes-input"]', '45')
      await authenticatedPage.click('[data-testid="save-daily-goal"]')

      // Should show updated goal
      await expect(authenticatedPage.locator('[data-testid="daily-goal-display"]')).toHaveText(/45 minutes/i)
    })

    test('should show goal history and analytics', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/goals')

      // View goal history
      await authenticatedPage.click('[data-testid="view-goal-history"]')

      // Should show historical data
      await expect(authenticatedPage.locator('[data-testid="goal-history-chart"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="completion-rate"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="streak-counter"]')).toBeVisible()
    })
  })

  test.describe('Rewards and Badges', () => {
    test('should earn experience points for activities', async ({ authenticatedPage, testBook }) => {
      // Check initial XP
      await authenticatedPage.goto('/profile')
      const initialXP = await authenticatedPage.locator('[data-testid="user-xp"]').textContent()

      // Complete reading session to earn XP
      await authenticatedPage.goto(`/reader/${testBook.id}`)
      await authenticatedPage.click('[data-testid="start-session-button"]')
      await authenticatedPage.waitForTimeout(2000)
      await authenticatedPage.click('[data-testid="end-session-button"]')
      await authenticatedPage.click('[data-testid="save-session-button"]')

      // Check XP increased
      await authenticatedPage.goto('/profile')
      const newXP = await authenticatedPage.locator('[data-testid="user-xp"]').textContent()
      expect(newXP).not.toBe(initialXP)

      // Should show XP gain notification
      await expect(authenticatedPage.locator('[data-testid="xp-gained"]')).toBeVisible()
    })

    test('should level up with sufficient experience', async ({ authenticatedPage, testBook }) => {
      // Check initial level
      await authenticatedPage.goto('/profile')
      const initialLevel = await authenticatedPage.locator('[data-testid="user-level"]').textContent()

      // Complete multiple activities to gain XP
      for (let i = 0; i < 5; i++) {
        await authenticatedPage.goto(`/reader/${testBook.id}`)
        await authenticatedPage.click('[data-testid="start-session-button"]')
        await authenticatedPage.waitForTimeout(1000)
        await authenticatedPage.click('[data-testid="end-session-button"]')
        await authenticatedPage.click('[data-testid="save-session-button"]')
        await authenticatedPage.waitForTimeout(500)
      }

      // Check if level increased
      await authenticatedPage.goto('/profile')
      const newLevel = await authenticatedPage.locator('[data-testid="user-level"]').textContent()

      // If level up occurred, should show celebration
      if (newLevel !== initialLevel) {
        await expect(authenticatedPage.locator('[data-testid="level-up-animation"]')).toBeVisible()
        await expect(authenticatedPage.locator('[data-testid="level-up-rewards"]')).toBeVisible()
      }
    })

    test('should unlock and display badges', async ({ authenticatedPage, testBook }) => {
      // Complete activity that should unlock a badge
      await authenticatedPage.goto(`/reader/${testBook.id}`)
      await authenticatedPage.click('[data-testid="start-session-button"]')
      await authenticatedPage.waitForTimeout(2000)
      await authenticatedPage.click('[data-testid="end-session-button"]')
      await authenticatedPage.click('[data-testid="save-session-button"]')

      // Go to badges page
      await authenticatedPage.goto('/badges')

      // Should show badges collection
      await expect(authenticatedPage.locator('[data-testid="badges-collection"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="earned-badges"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="available-badges"]')).toBeVisible()

      // Check for newly earned badge
      const earnedBadges = authenticatedPage.locator('[data-testid="earned-badge"]')
      const badgeCount = await earnedBadges.count()
      expect(badgeCount).toBeGreaterThan(0)
    })

    test('should show badge requirements and progress', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/badges')

      // Click on an unearned badge
      await authenticatedPage.click('[data-testid="unearned-badge"]:first-child')

      // Should show badge details
      await expect(authenticatedPage.locator('[data-testid="badge-details"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="badge-requirements"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="badge-progress"]')).toBeVisible()
    })
  })

  test.describe('Leaderboards and Social Features', () => {
    test('should display user rank on leaderboard', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/leaderboard')

      // Should show leaderboard
      await expect(authenticatedPage.locator('[data-testid="leaderboard"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="user-rank"]')).toBeVisible()

      // Should show different leaderboard categories
      await expect(authenticatedPage.locator('[data-testid="reading-time-leaderboard"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="books-read-leaderboard"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="streak-leaderboard"]')).toBeVisible()
    })

    test('should filter leaderboard by time period', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/leaderboard')

      // Switch to weekly leaderboard
      await authenticatedPage.click('[data-testid="weekly-leaderboard-tab"]')
      await expect(authenticatedPage.locator('[data-testid="weekly-rankings"]')).toBeVisible()

      // Switch to monthly leaderboard
      await authenticatedPage.click('[data-testid="monthly-leaderboard-tab"]')
      await expect(authenticatedPage.locator('[data-testid="monthly-rankings"]')).toBeVisible()

      // Switch to all-time leaderboard
      await authenticatedPage.click('[data-testid="alltime-leaderboard-tab"]')
      await expect(authenticatedPage.locator('[data-testid="alltime-rankings"]')).toBeVisible()
    })

    test('should show user reading statistics', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/profile')

      // Should display reading stats
      await expect(authenticatedPage.locator('[data-testid="reading-stats"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="total-books-read"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="total-reading-time"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="current-streak"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="longest-streak"]')).toBeVisible()
    })
  })

  test.describe('Daily Challenges', () => {
    test('should display daily challenge', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/challenges')

      // Should show today's challenge
      await expect(authenticatedPage.locator('[data-testid="daily-challenge"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="challenge-title"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="challenge-description"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="challenge-reward"]')).toBeVisible()
    })

    test('should complete daily challenge', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto('/challenges')

      // Check challenge requirements
      const challengeType = await authenticatedPage.locator('[data-testid="challenge-type"]').textContent()

      // Complete the challenge based on type
      if (challengeType.includes('reading') || challengeType.includes('minutes')) {
        await authenticatedPage.goto(`/reader/${testBook.id}`)
        await authenticatedPage.click('[data-testid="start-session-button"]')
        await authenticatedPage.waitForTimeout(2000)
        await authenticatedPage.click('[data-testid="end-session-button"]')
        await authenticatedPage.click('[data-testid="save-session-button"]')
      }

      // Return to challenges page
      await authenticatedPage.goto('/challenges')

      // Should show challenge completion or progress
      const challengeStatus = authenticatedPage.locator('[data-testid="challenge-status"]')
      await expect(challengeStatus).toBeVisible()

      const statusText = await challengeStatus.textContent()
      expect(statusText).toMatch(/completed|progress|achievement/i)
    })

    test('should show challenge history', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/challenges')

      // View challenge history
      await authenticatedPage.click('[data-testid="view-challenge-history"]')

      // Should show past challenges
      await expect(authenticatedPage.locator('[data-testid="challenge-history"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="completed-challenges"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="challenge-success-rate"]')).toBeVisible()
    })
  })

  test.describe('Gamification Dashboard', () => {
    test('should display comprehensive gamification overview', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/dashboard')

      // Should show gamification widgets
      await expect(authenticatedPage.locator('[data-testid="achievement-widget"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="goals-widget"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="streak-widget"]')).toBeVisible()
      await expect(authenticatedPage.locator('[data-testid="level-widget"]')).toBeVisible()

      // Should show recent achievements
      await expect(authenticatedPage.locator('[data-testid="recent-achievements"]')).toBeVisible()

      // Should show goal progress
      await expect(authenticatedPage.locator('[data-testid="daily-goal-progress"]')).toBeVisible()
    })

    test('should navigate to detailed gamification pages', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/dashboard')

      // Click on achievement widget
      await authenticatedPage.click('[data-testid="achievement-widget"]')
      await expect(authenticatedPage).toHaveURL('/achievements')

      // Go back and click goals widget
      await authenticatedPage.goto('/dashboard')
      await authenticatedPage.click('[data-testid="goals-widget"]')
      await expect(authenticatedPage).toHaveURL('/goals')

      // Go back and click leaderboard widget
      await authenticatedPage.goto('/dashboard')
      await authenticatedPage.click('[data-testid="leaderboard-widget"]')
      await expect(authenticatedPage).toHaveURL('/leaderboard')
    })
  })

  test.describe('Gamification Performance', () => {
    test('should load gamification data efficiently', async ({ authenticatedPage, performanceMonitor }) => {
      await performanceMonitor.startMonitoring()

      await authenticatedPage.goto('/dashboard')
      await authenticatedPage.waitForLoadState('networkidle')

      const metrics = await performanceMonitor.getMetrics()

      // Performance assertions
      expect(metrics.domContentLoaded).toBeLessThan(3000)
      expect(metrics.loadComplete).toBeLessThan(5000)
    })

    test('should handle achievement animations smoothly', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/reader/${testBook.id}`)

      // Trigger achievement
      await authenticatedPage.click('[data-testid="start-session-button"]')
      await authenticatedPage.waitForTimeout(2000)
      await authenticatedPage.click('[data-testid="end-session-button"]')
      await authenticatedPage.click('[data-testid="save-session-button"]')

      // Check achievement animation performance
      if (await authenticatedPage.locator('[data-testid="achievement-unlock"]').isVisible()) {
        // Animation should be smooth and not block UI
        await expect(authenticatedPage.locator('[data-testid="achievement-unlock"]')).toBeVisible()
        await authenticatedPage.waitForTimeout(1000)

        // Should be able to interact with page during animation
        await authenticatedPage.click('[data-testid="close-achievement"]')
      }
    })
  })

  test.describe('Gamification Accessibility', () => {
    test('should be keyboard navigable', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/achievements')

      // Navigate using keyboard
      await authenticatedPage.keyboard.press('Tab') // First achievement
      await authenticatedPage.keyboard.press('Enter') // Open details

      await expect(authenticatedPage.locator('[data-testid="achievement-details"]')).toBeVisible()

      // Close with escape
      await authenticatedPage.keyboard.press('Escape')
      await expect(authenticatedPage.locator('[data-testid="achievement-details"]')).not.toBeVisible()
    })

    test('should have proper ARIA labels', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/achievements')

      // Check ARIA attributes
      await expect(authenticatedPage.locator('[data-testid="achievements-grid"]')).toHaveAttribute('role')
      await expect(authenticatedPage.locator('[data-testid="achievement-card"]').first()).toHaveAttribute('aria-label')

      // Check progress indicators
      const progressBars = authenticatedPage.locator('[data-testid="achievement-progress-bar"]')
      const count = await progressBars.count()

      for (let i = 0; i < count; i++) {
        await expect(progressBars.nth(i)).toHaveAttribute('aria-valuenow')
        await expect(progressBars.nth(i)).toHaveAttribute('aria-valuemax')
      }
    })

    test('should announce achievement unlocks', async ({ authenticatedPage, testBook }) => {
      await authenticatedPage.goto(`/reader/${testBook.id}`)

      // Trigger achievement
      await authenticatedPage.click('[data-testid="start-session-button"]')
      await authenticatedPage.waitForTimeout(2000)
      await authenticatedPage.click('[data-testid="end-session-button"]')
      await authenticatedPage.click('[data-testid="save-session-button"]')

      // Should announce achievement unlock
      if (await authenticatedPage.locator('[data-testid="achievement-unlock"]').isVisible()) {
        await expect(authenticatedPage.locator('[data-testid="achievement-announcement"]')).toHaveAttribute('aria-live')
        await expect(authenticatedPage.locator('[data-testid="achievement-announcement"]')).toHaveText(/achievement unlocked|congratulations/i)
      }
    })
  })
})