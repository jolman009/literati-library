// Extension environment configuration.
// Reads VITE_* vars at build time and exposes them via a simple config object.

class ExtensionEnvironmentConfig {
  constructor() {
    this.apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    this.environment = import.meta.env.VITE_ENVIRONMENT || 'development';
    this.isDevelopment = this.environment === 'development';
    this.isProduction = this.environment === 'production';
  }

  getDefaultHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Client-Type': 'extension',
    };
  }
}

const environmentConfig = new ExtensionEnvironmentConfig();
export default environmentConfig;
