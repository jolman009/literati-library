// src/config/debug.js - Configuration Debugging Utilities
import environmentConfig from './environment.js';

/**
 * Debug utility for configuration troubleshooting
 */
export class ConfigDebugger {
  constructor() {
    this.config = environmentConfig;
  }

  /**
   * Print comprehensive configuration report
   */
  printConfigReport() {
    if (!this.config.isDevelopment) {
      console.warn('🚫 Config debugging disabled in production');
      return;
    }

    console.group('🔧 Literati Configuration Report');

    // Environment Info
    console.group('📍 Environment');
    console.table({
      'Mode': this.config.config.mode,
      'Environment': this.config.environment,
      'Is Development': this.config.isDevelopment,
      'Is Production': this.config.isProduction,
      'Is Staging': this.config.isStaging
    });
    console.groupEnd();

    // API Configuration
    console.group('🌐 API Configuration');
    console.table({
      'API URL': this.config.apiUrl,
      'API Timeout': `${this.config.apiTimeout}ms`,
      'Token Key': this.config.getTokenKey()
    });
    console.groupEnd();

    // Feature Flags
    console.group('🚩 Feature Flags');
    console.table(this.config.features);
    console.groupEnd();

    // Security Settings
    console.group('🔒 Security Settings');
    console.table(this.config.security);
    console.groupEnd();

    // App Metadata
    console.group('📱 App Information');
    console.table(this.config.app);
    console.groupEnd();

    // Raw Environment Variables
    console.group('🔬 Raw Environment Variables');
    const envVars = {};
    Object.keys(import.meta.env).forEach(key => {
      if (key.startsWith('VITE_')) {
        envVars[key] = import.meta.env[key];
      }
    });
    console.table(envVars);
    console.groupEnd();

    console.groupEnd();
  }

  /**
   * Validate current configuration
   */
  validateConfiguration() {
    const issues = [];
    const warnings = [];

    // Check required API URL
    if (!this.config.apiUrl) {
      issues.push('Missing VITE_API_BASE_URL environment variable');
    } else if (!this.config.isValidUrl(this.config.apiUrl)) {
      issues.push(`Invalid API URL format: ${this.config.apiUrl}`);
    }

    // Production-specific checks
    if (this.config.isProduction) {
      if (!this.config.apiUrl?.startsWith('https://')) {
        warnings.push('Production should use HTTPS for API endpoints');
      }
      if (!this.config.security.enforceHttps) {
        warnings.push('HTTPS enforcement disabled in production');
      }
      if (!this.config.features.analytics) {
        warnings.push('Analytics disabled in production');
      }
    }

    // Development-specific checks
    if (this.config.isDevelopment) {
      if (this.config.security.useSecureCookies) {
        warnings.push('Secure cookies enabled in development (may cause issues)');
      }
    }

    // Report results
    if (issues.length > 0) {
      console.group('❌ Configuration Issues');
      issues.forEach(issue => console.error(`• ${issue}`));
      console.groupEnd();
    }

    if (warnings.length > 0) {
      console.group('⚠️ Configuration Warnings');
      warnings.forEach(warning => console.warn(`• ${warning}`));
      console.groupEnd();
    }

    if (issues.length === 0 && warnings.length === 0) {
      console.log('✅ Configuration validation passed');
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings
    };
  }

  /**
   * Test API connectivity
   */
  async testApiConnectivity() {
    if (!this.config.apiUrl) {
      console.error('❌ Cannot test API - no URL configured');
      return false;
    }

    try {
      console.log(`🔍 Testing API connectivity to: ${this.config.apiUrl}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.config.apiUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ API connection successful');
        return true;
      } else {
        console.warn(`⚠️ API responded with status: ${response.status}`);
        return false;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('❌ API connection timeout');
      } else {
        console.error('❌ API connection failed:', error.message);
      }
      return false;
    }
  }

  /**
   * Export configuration for debugging
   */
  exportConfig() {
    return {
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      apiUrl: this.config.apiUrl,
      features: this.config.features,
      security: this.config.security,
      app: this.config.app,
      validation: this.validateConfiguration()
    };
  }
}

// Create singleton debugger
export const configDebugger = new ConfigDebugger();

// Auto-run debug report in development
if (environmentConfig.isDevelopment && typeof window !== 'undefined') {
  // Run after a short delay to avoid blocking initial load
  setTimeout(() => {
    configDebugger.printConfigReport();
    configDebugger.validateConfiguration();
  }, 1000);
}

// Expose on window for manual debugging
if (typeof window !== 'undefined' && environmentConfig.isDevelopment) {
  window.literatiDebug = {
    config: environmentConfig,
    debugger: configDebugger,
    printReport: () => configDebugger.printConfigReport(),
    validate: () => configDebugger.validateConfiguration(),
    testApi: () => configDebugger.testApiConnectivity(),
    export: () => configDebugger.exportConfig()
  };

  console.log('🔧 Debug utilities available at window.literatiDebug');
}

export default configDebugger;