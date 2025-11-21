// APIKeyConfiguration.jsx - Secure API Key Entry Interface
import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Save,
  Trash2,
  Shield,
  Info
} from 'lucide-react';
import AIKeyManager, { AIKeyManager as AIKeyManagerClass } from '../services/AIKeyManager';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import './APIKeyConfiguration.css';

const APIKeyConfiguration = ({ onKeysUpdated, showTitle = true }) => {
  const { actualTheme } = useMaterial3Theme();
  
  const [activeProvider, setActiveProvider] = useState('gemini');
  const [keyInputs, setKeyInputs] = useState({});
  const [showKeys, setShowKeys] = useState({});
  const [validationStatus, setValidationStatus] = useState({});
  const [isValidating, setIsValidating] = useState({});
  const [configuredProviders, setConfiguredProviders] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadConfiguredKeys();
  }, []);

  const loadConfiguredKeys = () => {
    const providers = AIKeyManager.getConfiguredProviders();
    setConfiguredProviders(providers);
    
    // Load key info for display
    const keyInfo = {};
    providers.forEach(provider => {
      const info = AIKeyManager.getKeyInfo(provider);
      if (info) {
        keyInfo[provider] = info;
      }
    });
    setValidationStatus(keyInfo);
  };

  const handleKeyInput = (provider, value) => {
    setKeyInputs({
      ...keyInputs,
      [provider]: value
    });
    
    // Clear previous validation
    setValidationStatus({
      ...validationStatus,
      [provider]: null
    });
  };

  const toggleKeyVisibility = (provider) => {
    setShowKeys({
      ...showKeys,
      [provider]: !showKeys[provider]
    });
  };

  const validateAndSaveKey = async (provider) => {
    const apiKey = keyInputs[provider];
    if (!apiKey || !apiKey.trim()) {
      setValidationStatus({
        ...validationStatus,
        [provider]: { error: 'Please enter an API key' }
      });
      return;
    }

    setIsValidating({ ...isValidating, [provider]: true });
    
    try {
      const result = await AIKeyManager.storeKey(provider, apiKey.trim());
      
      if (result.success) {
        setValidationStatus({
          ...validationStatus,
          [provider]: { 
            success: true, 
            message: result.message,
            keyPrefix: apiKey.substring(0, 8)
          }
        });
        
        // Clear the input
        setKeyInputs({
          ...keyInputs,
          [provider]: ''
        });
        
        // Refresh configured providers
        loadConfiguredKeys();
        
        // Notify parent component
        if (onKeysUpdated) {
          onKeysUpdated();
        }
      } else {
        setValidationStatus({
          ...validationStatus,
          [provider]: { error: result.error }
        });
      }
    } catch (_error) {
      setValidationStatus({
        ...validationStatus,
        [provider]: { error: 'Validation failed. Please check your key.' }
      });
    } finally {
      setIsValidating({ ...isValidating, [provider]: false });
    }
  };

  const removeKey = (provider) => {
    if (window.confirm(`Remove ${provider} API key? This will disable AI features for this provider.`)) {
      AIKeyManager.removeKey(provider);
      loadConfiguredKeys();
      
      // Clear validation status
      setValidationStatus({
        ...validationStatus,
        [provider]: null
      });
      
      if (onKeysUpdated) {
        onKeysUpdated();
      }
    }
  };

  const ProviderInfo = ({ provider }) => {
    const providerDetails = {
      gemini: {
        name: 'Google Gemini',
        description: 'Advanced reasoning and analysis',
        keyFormat: 'AIza[35 characters]',
        getKeyUrl: 'https://makersuite.google.com/app/apikey'
      },
      openai: {
        name: 'OpenAI GPT',
        description: 'Natural language processing',
        keyFormat: 'sk-[32+ characters]',
        getKeyUrl: 'https://platform.openai.com/api-keys'
      },
      anthropic: {
        name: 'Anthropic Claude',
        description: 'Thoughtful analysis and reasoning',
        keyFormat: 'sk-ant-[32+ characters]',
        getKeyUrl: 'https://console.anthropic.com/account/keys'
      },
      perplexity: {
        name: 'Perplexity',
        description: 'Search-enhanced AI reasoning',
        keyFormat: 'pplx-[32+ characters]',
        getKeyUrl: 'https://www.perplexity.ai/settings/api'
      }
    };

    const details = providerDetails[provider];
    if (!details) return null;

    return (
      <div className="provider-info">
        <h4>{details.name}</h4>
        <p className="provider-description">{details.description}</p>
        <p className="key-format">Format: <code>{details.keyFormat}</code></p>
        <a 
          href={details.getKeyUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="get-key-link"
        >
          Get API Key →
        </a>
      </div>
    );
  };

  const ProviderKeyForm = ({ provider }) => {
    const isConfigured = configuredProviders.includes(provider);
    const status = validationStatus[provider];
    const isValidatingProvider = isValidating[provider];

    return (
      <div className={`provider-key-form ${isConfigured ? 'configured' : ''}`}>
        <div className="form-header">
          <div className="provider-status">
            {isConfigured ? (
              <CheckCircle className="status-icon success" size={20} />
            ) : (
              <AlertTriangle className="status-icon warning" size={20} />
            )}
            <span className="status-text">
              {isConfigured ? 'Configured' : 'Not Configured'}
            </span>
          </div>
        </div>

        {isConfigured && status ? (
          <div className="configured-key-info">
            <p className="key-prefix">Key: {status.keyPrefix}...</p>
            <p className="key-date">
              Added: {status.createdAt ? new Date(status.createdAt).toLocaleDateString() : 'Unknown date'}
            </p>
            {status.lastUsed && (
              <p className="key-usage">
                Last used: {new Date(status.lastUsed).toLocaleDateString()}
              </p>
            )}
            <button
              onClick={() => removeKey(provider)}
              className="remove-key-button"
            >
              <Trash2 size={16} />
              Remove Key
            </button>
          </div>
        ) : (
          <div className="key-input-section">
            <div className="key-input-wrapper">
              <input
                type={showKeys[provider] ? 'text' : 'password'}
                placeholder={`Enter ${provider} API key`}
                value={keyInputs[provider] || ''}
                onChange={(e) => handleKeyInput(provider, e.target.value)}
                className="key-input"
                disabled={isValidatingProvider}
              />
              <button
                type="button"
                onClick={() => toggleKeyVisibility(provider)}
                className="toggle-visibility"
              >
                {showKeys[provider] ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <button
              onClick={() => validateAndSaveKey(provider)}
              disabled={!keyInputs[provider] || isValidatingProvider}
              className="save-key-button"
            >
              {isValidatingProvider ? (
                <div className="loading-spinner small" />
              ) : (
                <Save size={16} />
              )}
              {isValidatingProvider ? 'Validating...' : 'Save & Validate'}
            </button>
          </div>
        )}

        {status?.error && (
          <div className="validation-error">
            <AlertTriangle size={16} />
            {status.error}
          </div>
        )}

        {status?.success && (
          <div className="validation-success">
            <CheckCircle size={16} />
            {status.message}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`api-key-configuration theme-${actualTheme}`}>
      {showTitle && (
        <div className="config-header">
          <div className="header-content">
            <Shield className="header-icon" />
            <div>
              <h2>API Key Configuration</h2>
              <p>Configure your AI provider API keys for personalized literary mentoring</p>
            </div>
          </div>
        </div>
      )}

      <div className="security-notice">
        <Info className="notice-icon" />
        <div className="notice-content">
          <p><strong>Security Notice:</strong> API keys are encrypted and stored locally. They never leave your device except for direct API calls to the respective providers.</p>
        </div>
      </div>

      <div className="provider-tabs">
        {Object.values(AIKeyManagerClass.PROVIDERS).map(provider => (
          <button
            key={provider}
            className={`provider-tab ${activeProvider === provider ? 'active' : ''}`}
            onClick={() => setActiveProvider(provider)}
          >
            <div className="tab-content">
              <span className="tab-name">{provider}</span>
              {configuredProviders.includes(provider) && (
                <CheckCircle className="tab-check" size={14} />
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="provider-configuration">
        <div className="provider-details">
          <ProviderInfo provider={activeProvider} />
        </div>
        
        <div className="provider-form">
          <ProviderKeyForm provider={activeProvider} />
        </div>
      </div>

      {configuredProviders.length > 0 && (
        <div className="configuration-summary">
          <h4>Configured Providers</h4>
          <div className="provider-list">
            {configuredProviders.map(provider => (
              <div key={provider} className="provider-item">
                <CheckCircle className="provider-check" size={16} />
                <span>{provider}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="advanced-options">
        <button
          className="toggle-advanced"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          Advanced Options {showAdvanced ? '▲' : '▼'}
        </button>
        
        {showAdvanced && (
          <div className="advanced-content">
            <button
              onClick={() => {
                if (window.confirm('This will remove all API keys. Are you sure?')) {
                  AIKeyManager.clearAllKeys();
                  loadConfiguredKeys();
                  if (onKeysUpdated) onKeysUpdated();
                }
              }}
              className="clear-all-button"
            >
              <Trash2 size={16} />
              Clear All Keys
            </button>
            
            <div className="debug-info">
              <h5>Debug Information</h5>
              <p>Configured providers: {configuredProviders.length}</p>
              <p>Primary provider: {AIKeyManager.getPrimaryProvider() || 'None'}</p>
              <button
                onClick={() => {
                  console.warn('=== DEBUG: Anthropic Key Data ===');
                  AIKeyManager.debugKeyData('anthropic');
                  console.warn('=== END DEBUG ===');
                }}
                className="debug-button"
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  background: 'var(--md-sys-color-tertiary-container)',
                  color: 'var(--md-sys-color-on-tertiary-container)',
                  border: 'none',
                  borderRadius: '4px',
                  marginTop: '8px',
                  cursor: 'pointer'
                }}
              >
                Debug Anthropic Data
              </button>
              <button
                onClick={() => {
                  AIKeyManager.cleanCorruptedData('anthropic');
                  loadConfiguredKeys();
                  if (onKeysUpdated) onKeysUpdated();
                }}
                className="clean-button"
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  background: 'var(--md-sys-color-error-container)',
                  color: 'var(--md-sys-color-on-error-container)',
                  border: 'none',
                  borderRadius: '4px',
                  marginTop: '4px',
                  marginLeft: '8px',
                  cursor: 'pointer'
                }}
              >
                Clean Anthropic Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default APIKeyConfiguration;