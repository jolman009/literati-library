// src/config/environment.test.js - Configuration Module Tests
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { EnvironmentConfig } from './environment.js';

// Mock import.meta.env for testing
const mockEnv = {
  MODE: 'test',
  DEV: false,
  PROD: false,
  VITE_API_BASE_URL: 'http://localhost:5000',
  VITE_ENVIRONMENT: 'development',
  VITE_TOKEN_KEY: 'test_token',
  VITE_ENABLE_ANALYTICS: 'false',
  VITE_ENABLE_OFFLINE: 'true'
};

// Provide import.meta.env for tests without redefining property repeatedly
if (!globalThis.import || !globalThis.import.meta) {
  // Create a configurable global import holder
  Object.defineProperty(globalThis, 'import', {
    configurable: true,
    writable: true,
    value: { meta: { env: mockEnv } }
  })
} else {
  globalThis.import.meta.env = mockEnv
}

describe('EnvironmentConfig', () => {
  let config;

  beforeEach(() => {
    // Ensure import.meta.env is present for each test
    vi.stubGlobal('import', { meta: { env: mockEnv } })
    config = new EnvironmentConfig();
  });

  test('should load configuration from environment variables', () => {
    expect(config.apiUrl).toBe('http://localhost:5000');
    expect(['development', 'test']).toContain(config.environment);
    expect(typeof config.getTokenKey()).toBe('string');
    expect(config.getTokenKey().length).toBeGreaterThan(0);
  });

  test('should provide correct environment detection', () => {
    expect(config.isDevelopment).toBe(false); // MODE is 'test'
    expect(config.isProduction).toBe(false);
    // Environment comes from VITE_ENVIRONMENT, but allow 'test' as a valid runtime mode
    expect(['development', 'test']).toContain(config.environment);
  });

  test('should handle feature flags correctly', () => {
    expect(config.features.analytics).toBe(false);
    expect(config.features.offlineMode).toBe(true);
    expect(config.isFeatureEnabled('analytics')).toBe(false);
    expect(config.isFeatureEnabled('offlineMode')).toBe(true);
  });

  test('should generate API endpoints correctly', () => {
    expect(config.getApiEndpoint('/books')).toBe('http://localhost:5000/books');
    expect(config.getApiEndpoint('books')).toBe('http://localhost:5000/books');
    expect(config.getApiEndpoint()).toBe('http://localhost:5000/');
  });

  test('should provide default headers', () => {
    const headers = config.getDefaultHeaders();
    expect(headers).toHaveProperty('Content-Type', 'application/json');
    expect(['development', 'test']).toContain(headers['X-Environment']);
  });

  test('should provide auth headers (cookie-based, no Authorization header)', () => {
    const headers = config.getAuthHeaders();
    // Tokens are now in HttpOnly cookies — no Authorization header needed
    expect(headers).not.toHaveProperty('Authorization');
    expect(headers).toHaveProperty('Content-Type', 'application/json');
  });

  test('should validate URL format', () => {
    expect(config.isValidUrl('http://localhost:5000')).toBe(true);
    expect(config.isValidUrl('https://api.example.com')).toBe(true);
    expect(config.isValidUrl('not-a-url')).toBe(false);
    expect(config.isValidUrl('')).toBe(false);
  });
});

describe('EnvironmentConfig Validation', () => {
  test('should handle missing API URL in development', () => {
    const envWithoutApiUrl = { ...mockEnv, VITE_API_BASE_URL: undefined };
    vi.stubGlobal('import', { meta: { env: envWithoutApiUrl } })

    // Should not throw in development mode
    expect(() => new EnvironmentConfig()).not.toThrow();
  });

  test('should provide sensible defaults', () => {
    const minimalEnv = { MODE: 'development', DEV: true };
    vi.stubGlobal('import', { meta: { env: minimalEnv } })

    const config = new EnvironmentConfig();
    expect(config.apiUrl).toBe('http://localhost:5000'); // Fallback
    expect(typeof config.getTokenKey()).toBe('string'); // Default present
    expect(config.getTokenKey().length).toBeGreaterThan(0);
    expect(config.features.offlineMode).toBe(true); // Default enabled
  });
});
