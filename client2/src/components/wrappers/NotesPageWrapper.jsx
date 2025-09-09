import React from 'react';
import { Material3ThemeProvider } from '../../contexts/Material3ThemeContext';
import { MD3SnackbarProvider } from '../Material3';
import EnhancedNotesPage from '../../pages/EnhancedNotesPage';


const NotesPageWrapper = () => {
  return (
    <Material3ThemeProvider defaultTheme="auto">
      <MD3SnackbarProvider>
        <EnhancedNotesPage />
      </MD3SnackbarProvider>
    </Material3ThemeProvider>
  );
};

export default NotesPageWrapper;