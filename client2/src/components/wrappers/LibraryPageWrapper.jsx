// src/components/wrappers/LibraryPageWrapper.jsx
import React from 'react';
import LibraryPage from '../../pages/LibraryPage';

const LibraryPageWrapper = () => {
  // Thin wrapper to keep routing consistent while using the current LibraryPage
  return <LibraryPage />;
};

export default LibraryPageWrapper;

