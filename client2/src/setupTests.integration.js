// Integration-specific test setup: use actual app contexts instead of global mocks
import { vi, beforeEach } from 'vitest';
import './setupTests.js'

// Override global mocks from setupTests to use the real implementations
// Vitest tip: re-mock module to its actual exports
vi.mock('./contexts/ReadingSessionContext', async () => {
  return await vi.importActual('./contexts/ReadingSessionContext')
})

// Replace the stub localStorage mock with a functional implementation for integration tests
// The global mock in setupTests.js uses vi.fn() which doesn't store data
const createFunctionalLocalStorage = () => {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(String(key), String(value)); },
    removeItem: (key) => { store.delete(String(key)); },
    clear: () => { store.clear(); },
    key: (index) => Array.from(store.keys())[Number(index)] ?? null,
    get length() { return store.size; }
  };
};

// Override localStorage before each test to get a fresh store
beforeEach(() => {
  const functionalStorage = createFunctionalLocalStorage();
  global.localStorage = functionalStorage;
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: functionalStorage,
      writable: true,
      configurable: true
    });
  }
});

// Keep AuthContext and GamificationContext mocked from setupTests to avoid
// requiring full provider wiring or real network calls in integration tests.
