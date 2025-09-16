import { chromium } from '@playwright/test'

async function globalTeardown() {
  console.log('🧹 Starting global E2E test teardown...')

  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Clean up test data
    await cleanupTestData(page)

    console.log('✅ Global E2E test teardown completed')
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
  } finally {
    await browser.close()
  }
}

async function cleanupTestData(page) {
  console.log('🧹 Cleaning up test data...')

  try {
    // Login as test user to clean up their data
    const loginResponse = await page.request.post('http://localhost:5000/auth/login', {
      data: {
        email: 'e2e.test@example.com',
        password: 'TestPassword123!'
      }
    })

    if (loginResponse.status() === 200) {
      const { token } = await loginResponse.json()

      // Delete test books
      try {
        const booksResponse = await page.request.get('http://localhost:5000/books', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (booksResponse.status() === 200) {
          const books = await booksResponse.json()

          for (const book of books) {
            await page.request.delete(`http://localhost:5000/books/${book.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cleaning up books:', error.message)
      }

      // Delete test notes
      try {
        const notesResponse = await page.request.get('http://localhost:5000/notes', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (notesResponse.status() === 200) {
          const notes = await notesResponse.json()

          for (const note of notes) {
            await page.request.delete(`http://localhost:5000/notes/${note.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cleaning up notes:', error.message)
      }

      // Delete test user (optional - might want to keep for future runs)
      // await page.request.delete('http://localhost:5000/auth/account', {
      //   headers: {
      //     'Authorization': `Bearer ${token}`
      //   }
      // })
    }
  } catch (error) {
    console.warn('⚠️ Could not login test user for cleanup:', error.message)
  }

  console.log('✅ Test data cleaned up')
}

export default globalTeardown