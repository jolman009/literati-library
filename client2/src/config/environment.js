// src/config/environment.js - Centralized Configuration Module
class EnvironmentConfig {
  constructor() {
    this.config = this.loadConfiguration();
    this.validateConfig();

    // Log configuration in development mode
    if (this.isDevelopment) {
      console.log('🔧 Environment Configuration Loaded:', {
        mode: this.config.mode,
        apiUrl: this.config.apiUrl,
        environment: this.config.environment,
        features: this.config.features
      });
    }
  }

  loadConfiguration() {
    // Base configuration from environment variables
    const baseConfig = {
      // Environment detection
      mode: import.meta.env.MODE || 'development',
      isDev: import.meta.env.DEV || false,
      isProd: import.meta.env.PROD || false,

      // API Configuration
      apiUrl: import.meta.env.VITE_API_BASE_URL,
      apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,

      // Environment-specific settings
      environment: import.meta.env.VITE_ENVIRONMENT || this.detectEnvironment(),

      // Feature flags
      features: {
        analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
        crashReporting: import.meta.env.VITE_ENABLE_CRASH_REPORTING === 'true',
        offlineMode: import.meta.env.VITE_ENABLE_OFFLINE !== 'false', // Default true
        gamification: import.meta.env.VITE_ENABLE_GAMIFICATION !== 'false', // Default true
        aiFeatures: import.meta.env.VITE_ENABLE_AI_FEATURES === 'true'
      },

      // Security settings
      security: {
        tokenKey: import.meta.env.VITE_TOKEN_KEY || 'literati_token',
        useSecureCookies: import.meta.env.VITE_USE_SECURE_COOKIES === 'true',
        enforceHttps: import.meta.env.VITE_ENFORCE_HTTPS !== 'false' // Default true for prod
      },

      // Storage configuration
      storage: {
        indexedDbName: 'literati-books',
        indexedDbVersion: 2,
        cachePrefix: 'literati_cache_'
      },

      // App metadata
      app: {
        name: import.meta.env.VITE_APP_NAME || 'Literati',
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        buildHash: import.meta.env.VITE_BUILD_HASH || 'dev'
      }
    };

    return baseConfig;
  }

  detectEnvironment() {
    // Fallback environment detection based on hostname
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;

      if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        return 'development';
      } else if (hostname.includes('staging') || hostname.includes('dev')) {
        return 'staging';
      } else {
        return 'production';
      }
    }

    return this.config?.mode || 'development';
  }

  validateConfig() {
    const errors = [];

    // Validate required API URL
    if (!this.config.apiUrl) {
      // Provide helpful fallback for development
      if (this.config.mode === 'development') {
        console.warn('⚠️ VITE_API_BASE_URL not set, falling back to localhost:5000');
        this.config.apiUrl = 'http://localhost:5000';
      } else {
        errors.push('VITE_API_BASE_URL environment variable is required for production');
      }
    }

    // Validate API URL format
    if (this.config.apiUrl && !this.isValidUrl(this.config.apiUrl)) {
      errors.push(`Invalid API URL format: ${this.config.apiUrl}`);
    }

    // Security validation for production
    if (this.config.environment === 'production') {
      if (!this.config.apiUrl.startsWith('https://')) {
        console.warn('⚠️ Production environment should use HTTPS for API endpoints');
      }

      if (!this.config.security.enforceHttps) {
        console.warn('⚠️ HTTPS enforcement disabled in production');
      }
    }

    if (errors.length > 0) {
      const errorMessage = `Configuration validation failed:\n${errors.join('\n')}`;
      console.error('❌ Configuration Error:', errorMessage);

      // Throw error only in production to prevent broken deployments
      if (this.config.environment === 'production') {
        throw new Error(errorMessage);
      }
    }
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Getter methods for easy access
  get apiUrl() {
    return this.config.apiUrl;
  }

  get apiTimeout() {
    return this.config.apiTimeout;
  }

  get environment() {
    return this.config.environment;
  }

  get isDevelopment() {
    return this.config.mode === 'development';
  }

  get isProduction() {
    return this.config.environment === 'production';
  }

  get isStaging() {
    return this.config.environment === 'staging';
  }

  get features() {
    return this.config.features;
  }

  get security() {
    return this.config.security;
  }

  get storage() {
    return this.config.storage;
  }

  get app() {
    return this.config.app;
  }

  // Utility methods
  getTokenKey() {
    return this.security.tokenKey;
  }

  shouldUseSecureCookies() {
    return this.security.useSecureCookies || this.isProduction;
  }

  isFeatureEnabled(feature) {
    return this.features[feature] || false;
  }

  // Debug method for troubleshooting
  dumpConfig() {
    if (this.isDevelopment) {
      console.table(this.config);
    }
    return this.config;
  }

  // Method to get API endpoint with base URL
  getApiEndpoint(path = '') {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.apiUrl}${cleanPath}`;
  }

  // Method to get headers for API requests
  getDefaultHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-App-Version': this.app.version,
      'X-Environment': this.environment
    };
  }

  // Method to get authenticated headers
  getAuthHeaders(token = null) {
    const headers = this.getDefaultHeaders();

    // Try to get token from storage if not provided
    if (!token && typeof window !== 'undefined') {
      try {
        token = localStorage.getItem(this.getTokenKey()) ||
                sessionStorage.getItem(this.getTokenKey());
      } catch (error) {
        console.warn('Failed to retrieve token from storage:', error);
      }
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }
}

// Create singleton instance
const environmentConfig = new EnvironmentConfig();

// Export both the instance and the class
export { environmentConfig, EnvironmentConfig };
export default environmentConfig;

// Export individual getters for convenience
export const {
  apiUrl,
  apiTimeout,
  environment,
  isDevelopment,
  isProduction,
  isStaging,
  features,
  security,
  storage,
  app
} = environmentConfig;