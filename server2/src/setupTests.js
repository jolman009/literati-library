// Test setup file for server-side tests
import { jest } from '@jest/globals'

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key-for-testing-only'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only'
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key'
process.env.SUPABASE_KEY = 'test-anon-key'

// Factory to create a chainable query builder (shared by all Supabase mocks)
const createQueryBuilder = (defaultData = null) => {
  let mockData = defaultData;
  let mockError = null;

  const builder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockImplementation(() => {
      mockData = mockData || {
        id: 'mock-id-' + Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return builder;
    }),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockImplementation(() =>
      Promise.resolve({ data: mockData, error: mockError })
    ),
    then: jest.fn().mockImplementation((resolve) =>
      Promise.resolve({ data: mockData ? [mockData] : [], error: mockError }).then(resolve)
    ),
    _setMockData: (data) => { mockData = data; return builder; },
    _setMockError: (error) => { mockError = error; return builder; }
  };
  return builder;
};

// Factory to create a mock Supabase client
const createMockSupabaseClient = () => ({
  from: jest.fn((table) => createQueryBuilder()),
  auth: {
    signUp: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
    signIn: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null })
  },
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'test-url' } }),
      remove: jest.fn().mockResolvedValue({ data: null, error: null })
    }))
  }
});

// Mock @supabase/supabase-js package - catches ALL direct imports
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => createMockSupabaseClient())
}));

// Mock Supabase client module
jest.mock('./config/supabaseClient.js', () => ({
  supabase: createMockSupabaseClient(),
  default: createMockSupabaseClient()
}))

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('test-salt')
}))

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('test-jwt-token'),
  verify: jest.fn().mockReturnValue({ id: 'test-user-id', email: 'test@example.com' }),
  decode: jest.fn().mockReturnValue({ id: 'test-user-id', email: 'test@example.com' })
}))

// Mock securityStore — prevents real DB calls from the persistent security store
jest.mock('./services/securityStore.js', () => {
  const store = {
    initialize: jest.fn().mockResolvedValue(undefined),
    shutdown: jest.fn(),
    blacklistToken: jest.fn(),
    isTokenBlacklisted: jest.fn().mockReturnValue(false),
    storeTokenFamily: jest.fn(),
    getTokenFamily: jest.fn().mockReturnValue(undefined),
    familyHasToken: jest.fn().mockReturnValue(false),
    removeTokenFromFamily: jest.fn(),
    removeTokenFamily: jest.fn(),
    getFamiliesForUser: jest.fn().mockReturnValue([]),
    recordFailedLogin: jest.fn().mockResolvedValue(undefined),
    getFailedAttempts: jest.fn().mockReturnValue({ count: 0, lastAttempt: 0, lockedUntil: 0 }),
    clearFailedAttempts: jest.fn().mockResolvedValue(undefined),
    isAccountLocked: jest.fn().mockReturnValue(false),
    cleanup: jest.fn().mockResolvedValue(undefined),
    tokenBlacklist: new Set(),
    refreshTokenFamilies: new Map(),
    loginAttempts: new Map(),
    initialized: true
  }
  return {
    securityStore: store,
    default: store,
    PersistentSecurityStore: jest.fn(() => store),
    hashToken: jest.fn((t) => 'mock-hash-' + t)
  }
})

// Mock multer
jest.mock('multer', () => {
  const multer = () => ({
    single: () => (req, res, next) => {
      req.file = {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test file content'),
        size: 1024
      }
      next()
    },
    array: () => (req, res, next) => {
      req.files = []
      next()
    }
  })
  multer.memoryStorage = jest.fn()
  return multer
})

// Mock external APIs
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({ data: 'test-response' }),
  text: jest.fn().mockResolvedValue('test-response')
})

// Console suppression for cleaner test output
const originalLog = console.log
const originalError = console.error
const originalWarn = console.warn

beforeEach(() => {
  // Suppress console output during tests unless explicitly needed
  console.log = jest.fn()
  console.error = jest.fn()
  console.warn = jest.fn()
})

afterEach(() => {
  // Restore console functions
  console.log = originalLog
  console.error = originalError
  console.warn = originalWarn

  // Clear all mocks
  jest.clearAllMocks()
})

// Global test utilities
global.testUtils = {
  createMockRequest: (overrides = {}) => ({
    body: {},
    query: {},
    params: {},
    headers: {},
    user: { id: 'test-user-id', email: 'test@example.com' },
    ...overrides
  }),

  createMockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis()
    }
    return res
  },

  createMockNext: () => jest.fn(),

  expectValidationError: (response, field) => {
    expect(response.status).toHaveBeenCalledWith(400)
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(String)
      })
    )
  },

  expectSuccessResponse: (response, data) => {
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining(data)
    )
  }
}
