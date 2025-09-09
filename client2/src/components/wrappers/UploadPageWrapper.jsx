import React from 'react';
import { Material3ThemeProvider, useMaterial3Theme } from '../../contexts/Material3ThemeContext';
import { MD3SnackbarProvider } from '../Material3';
import MD3UploadPage from '../../pages/MD3UploadPage';

// Inner component that uses theme
const UploadPageContent = () => {
  const { actualTheme } = useMaterial3Theme();
  
  return (
    <div style={{ 
      background: actualTheme === 'dark' ? '#0f172a' : '#f8fafc',
      minHeight: '100vh',
      transition: 'background 0.3s ease'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px'
      }}>
        <MD3UploadPage />
      </div>
    </div>
  );
};

const UploadPageWrapper = () => {
  return (
    <Material3ThemeProvider defaultTheme="auto">
      <MD3SnackbarProvider>
        <UploadPageContent />
      </MD3SnackbarProvider>
    </Material3ThemeProvider>
  );
};

export default UploadPageWrapper;