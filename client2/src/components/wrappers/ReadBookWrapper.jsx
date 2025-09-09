// src/components/wrappers/ReadBookWrapper.jsx
import React from 'react';
import { MD3SnackbarProvider } from '../Material3';
import { Material3ThemeProvider } from '../../contexts/Material3ThemeContext';
import ReadBook from '../../pages/ReadBook';

const ReadBookWrapper = () => {
  return (
    <Material3ThemeProvider>
      <MD3SnackbarProvider>
        <ReadBook />
      </MD3SnackbarProvider>
    </Material3ThemeProvider>
  );
};

export default ReadBookWrapper;