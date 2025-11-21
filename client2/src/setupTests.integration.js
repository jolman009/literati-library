// Integration-specific test setup: use actual app contexts instead of global mocks
import { vi } from 'vitest';
import './setupTests.js'

// Override global mocks from setupTests to use the real implementations
// Vitest tip: re-mock module to its actual exports
vi.mock('./contexts/ReadingSessionContext', async () => {
  return await vi.importActual('./contexts/ReadingSessionContext')
})

// Keep AuthContext and GamificationContext mocked from setupTests to avoid
// requiring full provider wiring or real network calls in integration tests.
