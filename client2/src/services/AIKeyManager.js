// AIKeyManager.js - Secure API Key Management for LLM Services
import { encrypt, decrypt } from '../utils/crypto';

class AIKeyManager {
  constructor() {
    this.keys = new Map();
    this.loadStoredKeys();
  }

  // ===== SUPPORTED AI PROVIDERS =====
  
  static PROVIDERS = {
    GEMINI: 'gemini',
    OPENAI: 'openai',
    ANTHROPIC: 'anthropic',
    PERPLEXITY: 'perplexity'
  };

  // ===== KEY VALIDATION PATTERNS =====
  
  static KEY_PATTERNS = {
    [AIKeyManager.PROVIDERS.GEMINI]: /^AIza[0-9A-Za-z-_]{35}$/,
    [AIKeyManager.PROVIDERS.OPENAI]: /^sk-[A-Za-z0-9]{32,}$/,
    [AIKeyManager.PROVIDERS.ANTHROPIC]: /^sk-ant-api\d{2}-[A-Za-z0-9_-]{95,}$/,
    [AIKeyManager.PROVIDERS.PERPLEXITY]: /^pplx-[A-Za-z0-9]{32,}$/
  };

  // ===== SECURE KEY STORAGE =====

  /**
   * Store API key securely in encrypted localStorage
   */
  async storeKey(provider, apiKey, options = {}) {
    try {
      // Validate provider
      if (!Object.values(AIKeyManager.PROVIDERS).includes(provider)) {
        throw new Error(`Unsupported AI provider: ${provider}`);
      }

      // Validate key format
      if (!this.validateKeyFormat(provider, apiKey)) {
        throw new Error(`Invalid API key format for ${provider}`);
      }

      // Test the key with the provider
      const isValid = await this.validateKeyWithProvider(provider, apiKey);
      if (!isValid) {
        throw new Error(`API key validation failed for ${provider}`);
      }

      // Encrypt and store
      const encryptedKey = encrypt(apiKey);
      const keyData = {
        encrypted: encryptedKey,
        provider,
        createdAt: new Date().toISOString(),
        lastUsed: null,
        metadata: {
          keyPrefix: apiKey.substring(0, 8),
          userId: options.userId || 'default',
          permissions: options.permissions || ['read', 'analyze']
        }
      };

      localStorage.setItem(`ai_key_${provider}`, JSON.stringify(keyData));
      this.keys.set(provider, keyData);

      return {
        success: true,
        provider,
        message: `${provider} API key stored successfully`
      };

    } catch (error) {
      console.error('Key storage failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Retrieve and decrypt API key
   */
  getKey(provider) {
    try {
      const keyData = this.keys.get(provider);
      if (!keyData) {
        return null;
      }

      // Update last used timestamp
      keyData.lastUsed = new Date().toISOString();
      localStorage.setItem(`ai_key_${provider}`, JSON.stringify(keyData));

      return decrypt(keyData.encrypted);
    } catch (error) {
      console.error('Key retrieval failed:', error);
      return null;
    }
  }

  /**
   * Check if valid key exists for provider
   */
  hasValidKey(provider) {
    const keyData = this.keys.get(provider);
    return keyData && keyData.encrypted;
  }

  /**
   * Remove key from storage
   */
  removeKey(provider) {
    try {
      localStorage.removeItem(`ai_key_${provider}`);
      this.keys.delete(provider);
      return true;
    } catch (error) {
      console.error('Key removal failed:', error);
      return false;
    }
  }

  /**
   * Get all configured providers
   */
  getConfiguredProviders() {
    return Array.from(this.keys.keys()).filter(provider => 
      this.hasValidKey(provider)
    );
  }

  // ===== KEY VALIDATION =====

  /**
   * Validate key format against provider patterns
   */
  validateKeyFormat(provider, key) {
    const pattern = AIKeyManager.KEY_PATTERNS[provider];
    return pattern ? pattern.test(key) : false;
  }

  /**
   * Test key with actual provider API
   */
  async validateKeyWithProvider(provider, apiKey) {
    try {
      switch (provider) {
        case AIKeyManager.PROVIDERS.GEMINI:
          return await this.testGeminiKey(apiKey);
        case AIKeyManager.PROVIDERS.OPENAI:
          return await this.testOpenAIKey(apiKey);
        case AIKeyManager.PROVIDERS.ANTHROPIC:
          return await this.testAnthropicKey(apiKey);
        case AIKeyManager.PROVIDERS.PERPLEXITY:
          return await this.testPerplexityKey(apiKey);
        default:
          return false;
      }
    } catch (error) {
      console.error(`Key validation failed for ${provider}:`, error);
      return false;
    }
  }

  /**
   * Test Gemini API key
   */
  async testGeminiKey(apiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test OpenAI API key
   */
  async testOpenAIKey(apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test Anthropic API key
   */
  async testAnthropicKey(apiKey) {
    try {
      // Note: Anthropic doesn't have a simple validation endpoint
      // This is a basic format check - real validation happens on first use
      return apiKey.startsWith('sk-ant-api') && apiKey.length > 95;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test Perplexity API key
   */
  async testPerplexityKey(apiKey) {
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        })
      });
      return response.ok || response.status === 400; // 400 might indicate valid auth but bad request
    } catch (error) {
      return false;
    }
  }

  // ===== AUTHENTICATION CHECKS =====

  /**
   * Verify API key before making AI requests
   */
  async authenticateRequest(provider, operation = 'general') {
    if (!this.hasValidKey(provider)) {
      throw new Error(`No valid API key found for ${provider}. Please configure your API key first.`);
    }

    const key = this.getKey(provider);
    if (!key) {
      throw new Error(`Failed to retrieve API key for ${provider}.`);
    }

    // Additional permission checks could go here
    return {
      apiKey: key,
      provider,
      authenticated: true
    };
  }

  /**
   * Get authentication headers for API requests
   */
  getAuthHeaders(provider) {
    const key = this.getKey(provider);
    if (!key) return {};

    switch (provider) {
      case AIKeyManager.PROVIDERS.GEMINI:
        return {}; // Gemini uses query param, not header
      case AIKeyManager.PROVIDERS.OPENAI:
        return {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        };
      case AIKeyManager.PROVIDERS.ANTHROPIC:
        return {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        };
      case AIKeyManager.PROVIDERS.PERPLEXITY:
        return {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        };
      default:
        return {};
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Load stored keys from localStorage
   */
  loadStoredKeys() {
    Object.values(AIKeyManager.PROVIDERS).forEach(provider => {
      try {
        const stored = localStorage.getItem(`ai_key_${provider}`);
        if (stored) {
          const keyData = JSON.parse(stored);
          this.keys.set(provider, keyData);
        }
      } catch (error) {
        console.error(`Failed to load stored key for ${provider}:`, error);
      }
    });
  }

  /**
   * Get key metadata without exposing the key
   */
  getKeyInfo(provider) {
    const keyData = this.keys.get(provider);
    if (!keyData) return null;

    return {
      provider,
      keyPrefix: keyData.metadata.keyPrefix,
      createdAt: keyData.createdAt,
      lastUsed: keyData.lastUsed,
      hasValidKey: true
    };
  }

  /**
   * Clear all stored keys (for security)
   */
  clearAllKeys() {
    Object.values(AIKeyManager.PROVIDERS).forEach(provider => {
      this.removeKey(provider);
    });
    this.keys.clear();
  }

  /**
   * Get primary provider (first available)
   */
  getPrimaryProvider() {
    const configured = this.getConfiguredProviders();
    return configured.length > 0 ? configured[0] : null;
  }

  /**
   * Check if any AI provider is configured
   */
  hasAnyProvider() {
    return this.getConfiguredProviders().length > 0;
  }

  /**
   * Debug method to inspect stored key data
   */
  debugKeyData(provider) {
    try {
      const stored = localStorage.getItem(`ai_key_${provider}`);
      console.warn(`Debug ${provider} localStorage:`, stored);

      if (stored) {
        const parsed = JSON.parse(stored);
        console.warn(`Debug ${provider} parsed:`, parsed);
        return parsed;
      }
      return null;
    } catch (error) {
      console.error(`Debug ${provider} failed:`, error);
      return null;
    }
  }

  /**
   * Clean corrupted key data for a provider
   */
  cleanCorruptedData(provider) {
    try {
      localStorage.removeItem(`ai_key_${provider}`);
      this.keys.delete(provider);
      console.warn(`Cleaned corrupted data for ${provider}`);
      return true;
    } catch (error) {
      console.error(`Failed to clean ${provider}:`, error);
      return false;
    }
  }
}

const aiKeyManagerInstance = new AIKeyManager();

// Make globally accessible for debugging
if (typeof window !== 'undefined') {
  window.AIKeyManager = aiKeyManagerInstance;
}

// Export both the instance and the class for flexibility
export default aiKeyManagerInstance;
export { AIKeyManager };