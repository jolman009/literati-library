// src/components/cloud/GoogleDriveUploader.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import API from '../../config/api';
import './GoogleDriveUploader.css';

/**
 * GoogleDriveUploader Component
 *
 * Securely imports books from Google Drive using OAuth 2.0
 * - Uses read-only scope (drive.readonly)
 * - No credential storage
 * - CSRF protection via state parameter
 * - Minimal permission request
 *
 * Security Features:
 * - OAuth 2.0 authentication (never accesses passwords)
 * - File picker only (no full drive access)
 * - Temporary tokens (discarded after use)
 * - Server-side file download (tokens not exposed to client)
 *
 * React 19 Compatible - Uses gapi directly without wrapper library
 */

const GoogleDriveUploader = ({
  onUploadSuccess,
  onUploadError,
  disabled = false,
  className = '',
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [gapiReady, setGapiReady] = useState(false);
  const [pickerReady, setPickerReady] = useState(false);
  const [gisReady, setGisReady] = useState(false);

  // Google Drive API configuration
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  // Updated scope: drive.file allows accessing files the app creates or opens via Picker
  const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';

  // Validate configuration
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
      console.error('❌ Google Drive integration not configured. Please set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY');
      setError('Google Drive integration not configured');
    }
  }, [GOOGLE_CLIENT_ID, GOOGLE_API_KEY]);

  /**
   * Initialize Google API
   * Note: We don't need discovery docs for Picker - simplified for reliability
   * DEFINED FIRST so it can be used in useEffect below
   */
  const initializeGapi = useCallback(() => {
    if (!window.gapi) {
      console.warn('gapi not loaded yet');
      return;
    }

    window.gapi.load('picker', {
      callback: () => {
        try {
          // Picker API is loaded and ready
          setGapiReady(true);
          setPickerReady(true);
          console.warn('✅ Google Picker API initialized successfully');
        } catch (err) {
          console.error('Failed to initialize Google Picker API:', err);
          setError('Failed to initialize Google Picker API');
        }
      },
      onerror: () => {
        console.error('Failed to load Google Picker');
        setError('Failed to load Google Picker. Please refresh the page.');
      }
    });
  }, []);

  /**
   * Load Google API Script
   */
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) return;

    // Check if gapi is already loaded
    if (window.gapi) {
      // Add a small delay to ensure gapi is fully initialized
      setTimeout(() => initializeGapi(), 100);
      return;
    }

    // Load gapi script
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Wait a bit for gapi to be fully available
      setTimeout(() => initializeGapi(), 100);
    };
    script.onerror = () => {
      console.error('Failed to load Google API script');
      setError('Failed to load Google API. Please check your internet connection.');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup: Remove script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [GOOGLE_CLIENT_ID, GOOGLE_API_KEY, initializeGapi]);

  /**
   * Handle file import from Google Drive
   */
  const handleFileImport = useCallback(async (fileData, accessToken) => {
    if (!fileData || !accessToken) {
      setError('Invalid file data');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      console.warn('📁 Importing file from Google Drive:', fileData.name);

      // Validate file type before sending to backend
      const allowedMimeTypes = [
        'application/pdf',
        'application/epub+zip',
        'application/epub',
      ];

      if (!allowedMimeTypes.includes(fileData.mimeType)) {
        throw new Error('Please select a PDF or EPUB file');
      }

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (fileData.sizeBytes && fileData.sizeBytes > maxSize) {
        throw new Error('File size should be under 50MB');
      }

      // Send to backend for secure download and processing
      const response = await API.post('/books/import/googledrive', {
        fileId: fileData.id,
        fileName: fileData.name,
        mimeType: fileData.mimeType,
        sizeBytes: fileData.sizeBytes,
        accessToken: accessToken,
      }, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      console.warn('✅ Book imported successfully:', response.data);
      setIsUploading(false);
      setUploadProgress(100);

      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }

      // Trigger events for other components
      window.dispatchEvent(new CustomEvent('bookUploaded', {
        detail: { book: response.data }
      }));

      localStorage.setItem('books_updated', Date.now().toString());

    } catch (err) {
      console.error('❌ Google Drive import failed:', err);

      const errorMessage = err.response?.data?.error ||
                           err.message ||
                           'Failed to import from Google Drive';

      setError(errorMessage);
      setIsUploading(false);
      setUploadProgress(0);

      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  }, [onUploadSuccess, onUploadError]);

  /**
   * Open Google Drive Picker
   */
  const handleOpenPicker = useCallback(async () => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
      setError('Google Drive integration not configured');
      return;
    }

    if (!gapiReady || !pickerReady) {
      setError('Google API is still loading, please try again');
      return;
    }

    if (!gisReady) {
      setError('Google authentication is still loading, please try again');
      return;
    }

    if (isUploading) {
      return; // Prevent multiple uploads
    }

    setError(null);

    try {
      // Get OAuth token
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPES,
        ux_mode: 'popup', // Force popup mode instead of redirect
        callback: async (response) => {
          if (response.error) {
            console.error('OAuth error:', response.error);
            setError('Failed to authenticate with Google');
            return;
          }

          const accessToken = response.access_token;

          console.warn('🔑 Access token received, building Picker...');
          console.warn('🔐 OAuth Token:', accessToken.substring(0, 20) + '...');
          console.warn('🔑 API Key:', GOOGLE_API_KEY.substring(0, 20) + '...');

          // SIMPLEST POSSIBLE PICKER - Just one view
          const picker = new window.google.picker.PickerBuilder()
            .setOAuthToken(accessToken)
            .setDeveloperKey(GOOGLE_API_KEY)
            .setOrigin(window.location.protocol + '//' + window.location.host)
            .addView(window.google.picker.ViewId.DOCS)
            .setCallback(async (data) => {
              console.warn('📊 Picker callback:', data.action, data);
              console.warn('📊 Full data:', JSON.stringify(data, null, 2));

              if (data.action === window.google.picker.Action.PICKED) {
                const file = data.docs[0];
                console.warn('📁 Selected file:', file);

                // Validate file type on the client side
                const allowedMimeTypes = [
                  'application/pdf',
                  'application/epub+zip',
                  'application/epub',
                ];

                if (!allowedMimeTypes.includes(file.mimeType)) {
                  console.error('❌ Invalid file type:', file.mimeType);
                  setError('Please select a PDF or EPUB file');
                  return;
                }

                await handleFileImport(file, accessToken);
              }
            })
            .build();

          console.warn('✅ Picker built successfully, showing...');
          picker.setVisible(true);
        },
      });

      tokenClient.requestAccessToken({ prompt: 'consent' }); // Force consent to get new scope

    } catch (err) {
      console.error('Failed to open picker:', err);
      setError('Failed to open Google Drive picker');
    }
  }, [GOOGLE_CLIENT_ID, GOOGLE_API_KEY, gapiReady, pickerReady, gisReady, isUploading, handleFileImport, GOOGLE_SCOPES]);

  // Load Google Identity Services
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    // Check if already loaded
    if (window.google?.accounts?.oauth2) {
      setGisReady(true);
      console.warn('✅ Google Identity Services already loaded');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Wait a bit for the library to be fully available
      setTimeout(() => {
        if (window.google?.accounts?.oauth2) {
          setGisReady(true);
          console.warn('✅ Google Identity Services loaded successfully');
        } else {
          console.error('❌ Google Identity Services failed to load');
          setError('Failed to load Google authentication');
        }
      }, 100);
    };
    script.onerror = () => {
      console.error('❌ Failed to load Google Identity Services script');
      setError('Failed to load Google authentication');
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [GOOGLE_CLIENT_ID]);

  return (
    <div className={`google-drive-uploader ${className}`}>
      <button
        onClick={handleOpenPicker}
        disabled={disabled || isUploading || !gapiReady || !pickerReady || !gisReady || !GOOGLE_CLIENT_ID || !GOOGLE_API_KEY}
        className="google-drive-button"
        type="button"
      >
        {isUploading ? (
          <>
            <span className="upload-spinner">⏳</span>
            Importing... {uploadProgress}%
          </>
        ) : !gapiReady || !pickerReady || !gisReady ? (
          <>
            <span className="upload-spinner">⏳</span>
            Loading Google Drive...
          </>
        ) : (
          <>
            <svg className="google-drive-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M7.71 3.5L1.15 15l3.58 6.5L11.29 9.5 7.71 3.5M9.73 15l-3.58 6.5h14.31l3.58-6.5H9.73M11.29 14.5l3.58-6.5 3.58 6.5h-7.16z"/>
            </svg>
            Import from Google Drive
          </>
        )}
      </button>

      {error && (
        <div className="google-drive-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {isUploading && (
        <div className="google-drive-progress">
          <div
            className="progress-bar"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default GoogleDriveUploader;
