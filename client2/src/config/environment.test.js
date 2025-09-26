// src/config/environment.test.js - Configuration Module Tests
import { describe, test, expect, beforeEach } from 'vitest';
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

// Mock import.meta
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: mockEnv
    }
  }
});

describe('EnvironmentConfig', () => {
  let config;

  beforeEach(() => {
    config = new EnvironmentConfig();
  });

  test('should load configuration from environment variables', () => {
    expect(config.apiUrl).toBe('http://localhost:5000');
    expect(config.environment).toBe('development');
    expect(config.getTokenKey()).toBe('test_token');
  });

  test('should provide correct environment detection', () => {
    expect(config.isDevelopment).toBe(false); // MODE is 'test'
    expect(config.isProduction).toBe(false);
    expect(config.environment).toBe('development'); // VITE_ENVIRONMENT
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
    expect(headers).toHaveProperty('X-Environment', 'development');
  });

  test('should provide auth headers with token', () => {
    const token = 'test-token-123';
    const headers = config.getAuthHeaders(token);
    expect(headers).toHaveProperty('Authorization', `Bearer ${token}`);
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
    Object.defineProperty(globalThis, 'import', {
      value: { meta: { env: envWithoutApiUrl } }
    });

    // Should not throw in development mode
    expect(() => new EnvironmentConfig()).not.toThrow();
  });

  test('should provide sensible defaults', () => {
    const minimalEnv = { MODE: 'development', DEV: true };
    Object.defineProperty(globalThis, 'import', {
      value: { meta: { env: minimalEnv } }
    });

    const config = new EnvironmentConfig();
    expect(config.apiUrl).toBe('http://localhost:5000'); // Fallback
    expect(config.getTokenKey()).toBe('literati_token'); // Default
    expect(config.features.offlineMode).toBe(true); // Default enabled
  });
});