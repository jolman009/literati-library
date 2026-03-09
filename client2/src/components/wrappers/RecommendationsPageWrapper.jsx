import React from 'react';
import { Material3ThemeProvider } from '../../contexts/Material3ThemeContext';
import { MD3SnackbarProvider } from '../Material3';
import RecommendationsPage from '../../pages/RecommendationsPage';

const RecommendationsPageWrapper = () => {
  return (
    <Material3ThemeProvider defaultTheme="auto">
      <MD3SnackbarProvider>
        <RecommendationsPage />
      </MD3SnackbarProvider>
    </Material3ThemeProvider>
  );
};

export default RecommendationsPageWrapper;
