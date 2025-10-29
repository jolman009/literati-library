// Integration-specific test setup: use actual app contexts instead of global mocks
import './setupTests.js'

// Override global mocks from setupTests to use the real implementations
// Vitest tip: re-mock module to its actual exports
vi.mock('./contexts/ReadingSessionContext', async () => {
  return await vi.importActual('./contexts/ReadingSessionContext')
})

vi.mock('./contexts/GamificationContext', async () => {
  return await vi.importActual('./contexts/GamificationContext')
})

vi.mock('./contexts/AuthContext', async () => {
  return await vi.importActual('./contexts/AuthContext')
})

