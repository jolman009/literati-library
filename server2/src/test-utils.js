import request from 'supertest'
import jwt from 'jsonwebtoken'

// Test data factories
export const createTestUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashedpassword',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createTestBook = (overrides = {}) => ({
  id: 'test-book-id',
  title: 'Test Book',
  author: 'Test Author',
  description: 'A test book description',
  file_path: '/uploads/books/test-book.pdf',
  cover_image: '/uploads/covers/test-cover.jpg',
  file_type: 'pdf',
  file_size: 1024000,
  pages: 200,
  user_id: 'test-user-id',
  reading_progress: 0,
  is_favorite: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createTestNote = (overrides = {}) => ({
  id: 'test-note-id',
  book_id: 'test-book-id',
  content: 'This is a test note content',
  page_number: 1,
  user_id: 'test-user-id',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createTestReadingSession = (overrides = {}) => ({
  id: 'test-session-id',
  book_id: 'test-book-id',
  user_id: 'test-user-id',
  start_time: new Date().toISOString(),
  end_time: new Date(Date.now() + 3600000).toISOString(),
  duration: 3600, // 1 hour in seconds
  pages_read: 10,
  start_page: 1,
  end_page: 10,
  created_at: new Date().toISOString(),
  ...overrides
})

export const createTestAchievement = (overrides = {}) => ({
  id: 'test-achievement-id',
  user_id: 'test-user-id',
  type: 'books_read',
  title: 'First Book',
  description: 'Read your first book',
  threshold: 1,
  current_progress: 1,
  unlocked_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  ...overrides
})

export const createTestGoal = (overrides = {}) => ({
  id: 'test-goal-id',
  user_id: 'test-user-id',
  type: 'books_per_month',
  target: 5,
  current_progress: 2,
  period_start: new Date().toISOString(),
  period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  status: 'active',
  created_at: new Date().toISOString(),
  ...overrides
})

// JWT Token utilities
export const createTestToken = (payload = {}) => {
  const defaultPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
  }

  return jwt.sign(
    { ...defaultPayload, ...payload },
    process.env.JWT_SECRET || 'test-secret'
  )
}

export const createExpiredToken = (payload = {}) => {
  const expiredPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    exp: Math.floor(Date.now() / 1000) - 1800  // 30 minutes ago (expired)
  }

  return jwt.sign(
    { ...expiredPayload, ...payload },
    process.env.JWT_SECRET || 'test-secret'
  )
}

// Request helpers
export const makeAuthenticatedRequest = (app, method, url, token = null) => {
  const testToken = token || createTestToken()
  return request(app)[method](url).set('Authorization', `Bearer ${testToken}`)
}

export const makeUnauthenticatedRequest = (app, method, url) => {
  return request(app)[method](url)
}

// File upload helpers
export const createTestFile = (filename = 'test.pdf', mimetype = 'application/pdf', size = 1024) => {
  return {
    originalname: filename,
    mimetype,
    size,
    buffer: Buffer.from('test file content'),
    filename,
    path: `/tmp/${filename}`
  }
}

export const createTestImageFile = (filename = 'test.jpg') => {
  return createTestFile(filename, 'image/jpeg', 2048)
}

// Mock Supabase responses
export const mockSupabaseSelect = (data = [], error = null) => ({
  data,
  error,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK'
})

export const mockSupabaseInsert = (data = null, error = null) => ({
  data: data ? [data] : [],
  error,
  status: error ? 400 : 201,
  statusText: error ? 'Bad Request' : 'Created'
})

export const mockSupabaseUpdate = (data = null, error = null) => ({
  data: data ? [data] : [],
  error,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK'
})

export const mockSupabaseDelete = (error = null) => ({
  data: [],
  error,
  status: error ? 400 : 204,
  statusText: error ? 'Bad Request' : 'No Content'
})

export const mockSupabaseStorage = {
  upload: (data = { path: 'test-path' }, error = null) => Promise.resolve({ data, error }),
  download: (data = new Blob(['test content']), error = null) => Promise.resolve({ data, error }),
  remove: (data = [], error = null) => Promise.resolve({ data, error }),
  getPublicUrl: (publicUrl = 'https://example.com/test.jpg') => ({
    data: { publicUrl }
  })
}

const wrapWithJest = (fn) => (typeof jest !== 'undefined' ? jest.fn(fn) : fn)

export const mockSupabaseClient = (overrides = {}) => {
  const ok = {
    data: null,
    error: null,
    status: 200,
    statusText: 'OK'
  }

  const queryBuilder = {
    select: wrapWithJest(() => Promise.resolve(ok)),
    insert: wrapWithJest(() => Promise.resolve(ok)),
    update: wrapWithJest(() => Promise.resolve(ok)),
    delete: wrapWithJest(() => Promise.resolve(ok)),
    upsert: wrapWithJest(() => Promise.resolve(ok)),
    single: wrapWithJest(() => Promise.resolve(ok)),
    eq: wrapWithJest(() => queryBuilder),
    order: wrapWithJest(() => queryBuilder),
    range: wrapWithJest(() => queryBuilder)
  }

  const client = {
    auth: {
      getUser: wrapWithJest(() => Promise.resolve(ok)),
      signInWithPassword: wrapWithJest(() => Promise.resolve(ok)),
      signUp: wrapWithJest(() => Promise.resolve(ok)),
      signOut: wrapWithJest(() => Promise.resolve(ok))
    },
    from: wrapWithJest(() => queryBuilder),
    storage: {
      from: wrapWithJest(() => ({
        upload: wrapWithJest(() => Promise.resolve(ok)),
        remove: wrapWithJest(() => Promise.resolve(ok)),
        getPublicUrl: wrapWithJest(() => ({
          data: { publicUrl: '' },
          error: null
        }))
      }))
    },
    ...overrides
  }

  return client
}

export const installSupabaseMock = (overrides = {}) => {
  const client = mockSupabaseClient(overrides)
  jest.doMock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => client)
  }))
  return client
}

// Database test helpers
export const setupTestDatabase = async () => {
  // This would typically set up a test database
  // For now, we'll rely on mocks
  console.log('Setting up test database...')
}

export const cleanupTestDatabase = async () => {
  // This would typically clean up test data
  // For now, we'll rely on mocks
  console.log('Cleaning up test database...')
}

// Validation helpers
const getErrorPayload = (body = {}) =>
  body.errors || body.details || body.error || body.message

export const expectValidationError = (response, field) => {
  expect(response.status).toBe(400)
  const payload = getErrorPayload(response.body)
  expect(payload).toBeDefined()

  if (Array.isArray(payload) && field) {
    expect(payload).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          param: field
        })
      ])
    )
  }
}

export const expectAuthenticationError = (response) => {
  expect(response.status).toBe(401)
  const payload = getErrorPayload(response.body)
  expect(payload).toBeTruthy()
  const message =
    typeof payload === 'string'
      ? payload
      : payload?.message || JSON.stringify(payload)
  expect(message).toMatch(/unauthorized|authentication/i)
}

export const expectAuthorizationError = (response) => {
  expect(response.status).toBe(403)
  const payload = getErrorPayload(response.body)
  expect(payload).toBeTruthy()
  const message =
    typeof payload === 'string'
      ? payload
      : payload?.message || JSON.stringify(payload)
  expect(message).toMatch(/forbidden|authorization/i)
}

export const expectNotFoundError = (response) => {
  expect(response.status).toBe(404)
  const payload = getErrorPayload(response.body)
  expect(payload).toBeTruthy()
  const message =
    typeof payload === 'string'
      ? payload
      : payload?.message || JSON.stringify(payload)
  expect(message).toMatch(/not found/i)
}

export const expectSuccessResponse = (response, expectedData = null) => {
  expect(response.status).toBeGreaterThanOrEqual(200)
  expect(response.status).toBeLessThan(300)
  if (expectedData) {
    expect(response.body).toMatchObject(expectedData)
  }
}

// Rate limiting test helpers
export const simulateRateLimitExceeded = async (app, method, url, attempts = 10) => {
  const requests = []
  for (let i = 0; i < attempts; i++) {
    requests.push(request(app)[method](url))
  }

  const responses = await Promise.all(requests)
  return responses[responses.length - 1] // Return the last response
}

// Security test helpers
export const testSQLInjection = (payload) => {
  const sqlInjectionPayloads = [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "1' UNION SELECT * FROM users --",
    "admin'--",
    "' OR 1=1#"
  ]

  return sqlInjectionPayloads.includes(payload)
}

export const testXSSPayload = (payload) => {
  const xssPayloads = [
    "<script>alert('xss')</script>",
    "javascript:alert('xss')",
    "<img src=x onerror=alert('xss')>",
    "';alert('xss');//"
  ]

  return xssPayloads.some(xss => payload.includes(xss))
}

// Performance test helpers
export const measureResponseTime = async (requestFn) => {
  const start = Date.now()
  const response = await requestFn()
  const end = Date.now()

  return {
    response,
    responseTime: end - start
  }
}

// Environment helpers
export const isTestEnvironment = () => process.env.NODE_ENV === 'test'

export const requireTestEnvironment = () => {
  if (!isTestEnvironment()) {
    throw new Error('This function should only be called in test environment')
  }
}

// Cleanup utility
export const cleanupTest = () => {
  jest.clearAllMocks()
  jest.resetAllMocks()
}

// Error simulation helpers
export const simulateSupabaseError = (message = 'Database error') => ({
  error: { message, code: 'PGRST000' },
  data: null,
  status: 500,
  statusText: 'Internal Server Error'
})

export const simulateNetworkError = () => {
  const error = new Error('Network error')
  error.code = 'NETWORK_ERROR'
  throw error
}

export const simulateTimeoutError = () => {
  const error = new Error('Request timeout')
  error.code = 'TIMEOUT'
  throw error
}

// Mock implementations
export const mockSuccessfulSupabaseOperation = (data) => {
  return jest.fn().mockResolvedValue({
    data,
    error: null,
    status: 200,
    statusText: 'OK'
  })
}

export const mockFailedSupabaseOperation = (errorMessage = 'Operation failed') => {
  return jest.fn().mockResolvedValue({
    data: null,
    error: { message: errorMessage },
    status: 400,
    statusText: 'Bad Request'
  })
}

export default {
  createTestUser,
  createTestBook,
  createTestNote,
  createTestReadingSession,
  createTestAchievement,
  createTestGoal,
  createTestToken,
  createExpiredToken,
  makeAuthenticatedRequest,
  makeUnauthenticatedRequest,
  createTestFile,
  createTestImageFile,
  mockSupabaseSelect,
  mockSupabaseInsert,
  mockSupabaseUpdate,
  mockSupabaseDelete,
  mockSupabaseStorage,
  expectValidationError,
  expectAuthenticationError,
  expectAuthorizationError,
  expectNotFoundError,
  expectSuccessResponse,
  cleanupTest,
  mockSupabaseClient,
  installSupabaseMock
}
