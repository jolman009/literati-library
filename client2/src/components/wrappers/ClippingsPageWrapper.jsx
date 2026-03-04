import React from 'react';
import { Material3ThemeProvider } from '../../contexts/Material3ThemeContext';
import { MD3SnackbarProvider } from '../Material3';
import ClippingsPage from '../../pages/ClippingsPage';

const ClippingsPageWrapper = () => {
  return (
    <Material3ThemeProvider defaultTheme="auto">
      <MD3SnackbarProvider>
        <ClippingsPage />
      </MD3SnackbarProvider>
    </Material3ThemeProvider>
  );
};

export default ClippingsPageWrapper;
