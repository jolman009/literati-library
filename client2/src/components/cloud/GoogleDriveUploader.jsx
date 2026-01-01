import React, { useEffect, useState } from 'react';
import useDrivePicker from 'react-google-drive-picker';
import { useAuth } from '../../contexts/AuthContext';
import { config } from '../../config/environment';
import { api } from '../../config/api'; // Assuming you have an API wrapper
import './GoogleDriveUploader.css';

// Ensure you install this package: npm install react-google-drive-picker
// Or use the hook implementation below if you prefer fewer dependencies.

const GoogleDriveUploader = ({ onUploadSuccess, onUploadStart, onError }) => {
  const [openPicker, authResponse] = useDrivePicker();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const handleOpenPicker = () => {
    openPicker({
      clientId: config.google.clientId,
      developerKey: config.google.apiKey,
      viewId: 'DOCS',
      // Determine views to show (PDFs and EPUBs)
      showUploadView: true,
      showUploadFolders: true,
      supportDrives: true,
      multiselect: false,
      setIncludeFolders: true,
      setSelectFolderEnabled: false,
      // Filter for relevant mime types
      mimeTypes: 'application/pdf,application/epub+zip',
      customScopes: ['https://www.googleapis.com/auth/drive.file'],
      callbackFunction: (data) => {
        if (data.action === 'cancel') {
          console.log('User clicked cancel/close button');
        }
        if (data.action === 'picked') {
          processPickedFile(data.docs[0]);
        }
      },
    });
  };

  const processPickedFile = async (doc) => {
    // We need the OAuth token to download the file. 
    // react-google-drive-picker handles getting the token for the picker,
    // but we need to ensure we pass the active token to our backend.
    
    // Note: The library usually returns the oauth token in the second return value 
    // of the hook, or we might need to grab it from window.gapi.client.getToken()
    const token = window.gapi?.client?.getToken()?.access_token;

    if (!token || !doc) {
      onError('Authentication error: Could not retrieve Google Access Token');
      return;
    }

    try {
      setIsUploading(true);
      if (onUploadStart) onUploadStart();

      const response = await api.post('/api/cloud-storage/drive/upload', {
        fileId: doc.id,
        accessToken: token,
        fileName: doc.name,
        mimeType: doc.mimeType,
        userId: user?.id
      });

      if (response.data.success) {
        // Success! Pass the Supabase path back to the parent
        onUploadSuccess({
            path: response.data.path, // This is what we save to the DB
            filename: response.data.filename,
            originalName: doc.name,
            mimeType: doc.mimeType
        });
      }
    } catch (err) {
      console.error('Upload failed', err);
      onError(err.response?.data?.error || 'Failed to upload from Google Drive');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="google-drive-uploader">
      <button 
        type="button"
        className={`drive-button ${isUploading ? 'loading' : ''}`}
        onClick={handleOpenPicker}
        disabled={isUploading}
      >
        <img 
            src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" 
            alt="Drive" 
            width="20" 
        />
        {isUploading ? 'Importing...' : 'Select from Google Drive'}
      </button>
    </div>
  );
};

export default GoogleDriveUploader;