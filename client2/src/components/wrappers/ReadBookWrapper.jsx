// src/components/wrappers/ReadBookWrapper.jsx
import React from 'react';
import ReadBook from '../../pages/ReadBook';

// NOTE: Material3ThemeProvider and MD3SnackbarProvider are already provided
// by App.jsx at the root level, so we don't need to wrap again here.
// Double-wrapping was causing context conflicts and errors.
const ReadBookWrapper = () => {
  return <ReadBook />;
};

export default ReadBookWrapper;