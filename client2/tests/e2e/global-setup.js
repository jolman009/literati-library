import { chromium } from '@playwright/test'

async function globalSetup() {
  console.log('🚀 Starting global E2E test setup...')

  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Wait for services to be ready
    console.log('⏳ Waiting for client to be ready...')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
    console.log('✅ Client is ready')

    console.log('⏳ Waiting for server to be ready...')
    await page.goto('http://localhost:5000/health', { waitUntil: 'networkidle' })
    console.log('✅ Server is ready')

    // Set up test environment
    await setupTestEnvironment(page)

  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }

  console.log('✅ Global E2E test setup completed')
}

async function setupTestEnvironment(page) {
  // Clear any existing data
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  // Create test user if needed
  try {
    const response = await page.request.post('http://localhost:5000/auth/register', {
      data: {
        email: 'e2e.test@example.com',
        password: 'TestPassword123!',
        name: 'E2E Test User'
      }
    })

    if (response.status() === 201) {
      console.log('✅ Test user created successfully')
    } else if (response.status() === 409) {
      console.log('ℹ️ Test user already exists')
    } else {
      console.warn('⚠️ Unexpected response creating test user:', response.status())
    }
  } catch (error) {
    console.warn('⚠️ Could not create test user:', error.message)
  }

  // Seed test data if needed
  await seedTestData(page)
}

async function seedTestData(page) {
  console.log('🌱 Seeding test data...')

  // You can add test books, notes, etc. here
  // This would typically involve API calls to create test data

  console.log('✅ Test data seeded')
}

export default globalSetup