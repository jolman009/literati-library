// src/pages/legal/LegalPageLayout.jsx - Wrapper for legal pages to ensure theme is applied
import React from 'react';
import { useMaterial3Theme } from '../../contexts/Material3ThemeContext';
import './LegalPages.css';

const LegalPageLayout = ({ children }) => {
  const { actualTheme } = useMaterial3Theme();

  return (
    <div
      className="legal-page-wrapper"
      data-theme={actualTheme}
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--md-sys-color-background)',
        color: 'var(--md-sys-color-on-background)',
      }}
    >
      {children}
    </div>
  );
};

export default LegalPageLayout;
