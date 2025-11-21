// src/components/Material3/providers/ThemeProvider.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { createCSSCustomProperties } from '../../../design-tokens/material3';

const Material3ThemeContext = createContext();

export const Material3ThemeProvider = ({ children, defaultTheme = 'auto' }) => {
  const [theme, setTheme] = useState(defaultTheme);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const applyTheme = (themeName) => {
      console.warn('🎨 ThemeProvider: Applying theme:', themeName);
      
      try {
        const root = document.documentElement;
        const properties = createCSSCustomProperties(themeName === 'dark');
        
        console.warn('🎨 ThemeProvider: Generated properties count:', Object.keys(properties).length);
        console.warn('🎨 ThemeProvider: Sample properties:', {
          primary: properties['--md-sys-color-primary'],
          surface: properties['--md-sys-color-surface'],
          onSurface: properties['--md-sys-color-on-surface'],
          background: properties['--md-sys-color-background']
        });
        
        // Apply CSS custom properties with error handling
        let successCount = 0;
        let errorCount = 0;
        
        Object.entries(properties).forEach(([key, value]) => {
          try {
            root.style.setProperty(key, value);
            successCount++;
          } catch (error) {
            console.error(`🎨 ThemeProvider: Failed to set ${key}:`, error);
            errorCount++;
          }
        });
        
        console.warn(`🎨 ThemeProvider: Applied ${successCount} properties, ${errorCount} errors`);
        
        root.setAttribute('data-theme', themeName);
        setIsDark(themeName === 'dark');
        
        console.warn('🎨 ThemeProvider: Theme applied successfully. isDark:', themeName === 'dark');
        console.warn('🎨 ThemeProvider: Root data-theme attribute:', root.getAttribute('data-theme'));
        
        // Verify a few key properties were actually set
        const verifyProps = ['--md-sys-color-primary', '--md-sys-color-surface', '--md-sys-color-on-surface'];
        verifyProps.forEach(prop => {
          const computedValue = getComputedStyle(root).getPropertyValue(prop);
          console.warn(`🎨 ThemeProvider: Verified ${prop}:`, computedValue.trim() || 'NOT SET');
        });
        
      } catch (error) {
        console.error('🎨 ThemeProvider: Error applying theme:', error);
      }
    };

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches ? 'dark' : 'light');
      
      const handler = (e) => applyTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      // If currently auto, determine current state and toggle
      if (prev === 'auto') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        return mediaQuery.matches ? 'light' : 'dark';
      }
      // Normal toggle between light and dark
      return prev === 'dark' ? 'light' : 'dark';
    });
  };

  // Get the actual theme being used (resolves 'auto' to 'light' or 'dark')
  const getActualTheme = () => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      return mediaQuery.matches ? 'dark' : 'light';
    }
    return theme;
  };

  const actualTheme = getActualTheme();

  return (
    <Material3ThemeContext.Provider value={{
      theme,
      setTheme,
      isDark,
      toggleTheme,
      actualTheme
    }}>
      {children}
    </Material3ThemeContext.Provider>
  );
};

export const useMaterial3Theme = () => {
  const context = useContext(Material3ThemeContext);
  if (!context) {
    throw new Error('useMaterial3Theme must be used within Material3ThemeProvider');
  }
  return context;
};

// Hook to get theme colors
export const useThemeColors = () => {
  const { actualTheme } = useMaterial3Theme();
  
  // Get computed CSS custom properties
  const getColor = (colorName) => {
    const root = document.documentElement;
    return getComputedStyle(root).getPropertyValue(`--md-sys-color-${colorName}`).trim();
  };

  return {
    primary: getColor('primary'),
    onPrimary: getColor('on-primary'),
    surface: getColor('surface'),
    onSurface: getColor('on-surface'),
    background: getColor('background'),
    onBackground: getColor('on-background'),
    surfaceVariant: getColor('surface-variant'),
    onSurfaceVariant: getColor('on-surface-variant'),
    outline: getColor('outline'),
    outlineVariant: getColor('outline-variant'),
    isDark: actualTheme === 'dark'
  };
};