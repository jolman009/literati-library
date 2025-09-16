import '@testing-library/jest-dom'
import { expect, afterEach, vi, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Make vi globally available
global.vi = vi

// Mock modules that cause issues in test environment
vi.mock('epubjs', () => ({
  default: vi.fn(() => ({
    renderTo: vi.fn(),
    open: vi.fn(),
    destroy: vi.fn()
  })),
  Book: vi.fn()
}))

vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(() => Promise.resolve({
    numPages: 1,
    getPage: vi.fn(() => Promise.resolve({
      render: vi.fn(),
      getViewport: vi.fn(() => ({ width: 100, height: 100 }))
    }))
  })),
  GlobalWorkerOptions: {
    workerSrc: ''
  }
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Extend expect with jest-dom matchers
expect.extend({})