// src/pages/settings/CloudStorageSettings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MD3Card, MD3Button } from '../../components/Material3';
import API from '../../config/api';
import './CloudStorageSettings.css';

/**
 * Cloud Storage Settings Page (Admin Only)
 *
 * Allows admin to:
 * - View connected cloud storage accounts
 * - Disconnect cloud storage providers
 * - View OAuth token status
 * - Manage cloud storage permissions
 */

const CloudStorageSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(null);
  const [message, setMessage] = useState(null);

  // Admin check - only for jolman009@yahoo.com
  const isAdmin = user && user.email === 'jolman009@yahoo.com';

  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    fetchConnections();
  }, [isAdmin, navigate]);

  /**
   * Fetch connected cloud storage accounts
   */
  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/cloud-storage/connections');
      setConnections(response.data || []);
    } catch (error) {
      console.error('Failed to fetch cloud connections:', error);
      // If endpoint doesn't exist yet, show empty state
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Disconnect a cloud storage provider
   */
  const handleDisconnect = async (provider) => {
    if (!confirm(`Are you sure you want to disconnect ${provider}? You can reconnect anytime.`)) {
      return;
    }

    try {
      setDisconnecting(provider);
      await API.post(`/api/cloud-storage/disconnect`, { provider });

      setMessage({
        type: 'success',
        text: `${provider} disconnected successfully`
      });

      // Refresh connections
      await fetchConnections();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to disconnect'
      });
    } finally {
      setDisconnecting(null);
    }
  };

  /**
   * Clear all OAuth tokens (emergency)
   */
  const handleClearAllTokens = async () => {
    if (!confirm('Are you sure? This will disconnect ALL cloud storage providers and clear all stored tokens. This action cannot be undone.')) {
      return;
    }

    try {
      await API.post('/api/cloud-storage/clear-all-tokens');
      setMessage({
        type: 'success',
        text: 'All OAuth tokens cleared successfully'
      });
      await fetchConnections();
    } catch (error) {
      console.error('Failed to clear tokens:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to clear tokens'
      });
    }
  };

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="cloud-storage-settings-page">
      <div className="cloud-storage-settings-container">
        {/* Header */}
        <div className="settings-header">
          <button
            onClick={() => navigate('/settings')}
            className="back-button"
          >
            ← Back to Settings
          </button>
          <h1 className="md-display-small">Cloud Storage</h1>
          <p className="md-body-large settings-subtitle">
            Manage your cloud storage connections and OAuth tokens
          </p>
          <div className="admin-badge">
            <span className="admin-icon">🔐</span>
            Admin Only
          </div>
        </div>

        {/* Status Messages */}
        {message && (
          <div className={`message-banner ${message.type}`}>
            <span className="message-icon">
              {message.type === 'success' ? '✅' : '⚠️'}
            </span>
            {message.text}
            <button
              onClick={() => setMessage(null)}
              className="message-close"
            >
              ×
            </button>
          </div>
        )}

        {/* Connected Services */}
        <MD3Card className="settings-card">
          <h2 className="md-title-large">Connected Services</h2>
          <p className="md-body-medium settings-description">
            Cloud storage providers you've connected to ShelfQuest for importing books
          </p>

          {loading ? (
            <div className="loading-state">
              <div className="spinner">⏳</div>
              <p>Loading connections...</p>
            </div>
          ) : connections.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">☁️</span>
              <h3 className="md-title-medium">No cloud storage connected</h3>
              <p className="md-body-small">
                Connect cloud storage when uploading books to import directly from Google Drive or Dropbox
              </p>
            </div>
          ) : (
            <div className="connections-list">
              {connections.map((connection) => (
                <div key={connection.provider} className="connection-item">
                  <div className="connection-info">
                    <div className="connection-icon">
                      {connection.provider === 'googledrive' ? '📊' : '📦'}
                    </div>
                    <div className="connection-details">
                      <h3 className="md-title-small">
                        {connection.provider === 'googledrive' ? 'Google Drive' : 'Dropbox'}
                      </h3>
                      <p className="md-body-small">
                        Connected: {new Date(connection.connected_at).toLocaleDateString()}
                      </p>
                      <p className="md-label-small">
                        Last used: {connection.last_used ?
                          new Date(connection.last_used).toLocaleDateString() :
                          'Never'
                        }
                      </p>
                    </div>
                  </div>
                  <MD3Button
                    variant="outlined"
                    onClick={() => handleDisconnect(connection.provider)}
                    disabled={disconnecting === connection.provider}
                  >
                    {disconnecting === connection.provider ? 'Disconnecting...' : 'Disconnect'}
                  </MD3Button>
                </div>
              ))}
            </div>
          )}
        </MD3Card>

        {/* Security Information */}
        <MD3Card className="settings-card">
          <h2 className="md-title-large">Security & Privacy</h2>
          <div className="security-info">
            <div className="security-item">
              <span className="security-icon">🔒</span>
              <div>
                <h3 className="md-title-small">OAuth 2.0 Authentication</h3>
                <p className="md-body-small">
                  We use industry-standard OAuth 2.0. We never store your cloud storage passwords.
                </p>
              </div>
            </div>
            <div className="security-item">
              <span className="security-icon">🔑</span>
              <div>
                <h3 className="md-title-small">Encrypted Token Storage</h3>
                <p className="md-body-small">
                  OAuth tokens are encrypted using AES-256 encryption and stored securely.
                </p>
              </div>
            </div>
            <div className="security-item">
              <span className="security-icon">🎯</span>
              <div>
                <h3 className="md-title-small">Minimal Permissions</h3>
                <p className="md-body-small">
                  We only request read-only access to files you explicitly select.
                </p>
              </div>
            </div>
          </div>
        </MD3Card>

        {/* Advanced Options */}
        <MD3Card className="settings-card danger-card">
          <h2 className="md-title-large">Advanced Options</h2>
          <p className="md-body-medium">
            These actions are permanent and cannot be undone
          </p>
          <div className="danger-actions">
            <MD3Button
              variant="outlined"
              className="danger-button"
              onClick={handleClearAllTokens}
            >
              Clear All OAuth Tokens
            </MD3Button>
            <p className="md-label-small">
              Disconnects all cloud storage providers and deletes all stored OAuth tokens
            </p>
          </div>
        </MD3Card>

        {/* Help Information */}
        <MD3Card className="settings-card">
          <h2 className="md-title-large">Need Help?</h2>
          <div className="help-links">
            <a href="/privacy" className="help-link">
              <span className="help-icon">📄</span>
              <div>
                <h3 className="md-title-small">Privacy Policy</h3>
                <p className="md-body-small">
                  Learn how we handle your cloud storage data
                </p>
              </div>
            </a>
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="help-link"
            >
              <span className="help-icon">🔗</span>
              <div>
                <h3 className="md-title-small">Manage Google Permissions</h3>
                <p className="md-body-small">
                  Revoke ShelfQuest's access in your Google Account
                </p>
              </div>
            </a>
            <a
              href="https://www.dropbox.com/account/connected_apps"
              target="_blank"
              rel="noopener noreferrer"
              className="help-link"
            >
              <span className="help-icon">🔗</span>
              <div>
                <h3 className="md-title-small">Manage Dropbox Apps</h3>
                <p className="md-body-small">
                  Revoke ShelfQuest's access in your Dropbox Account
                </p>
              </div>
            </a>
          </div>
        </MD3Card>
      </div>
    </div>
  );
};

export default CloudStorageSettings;
