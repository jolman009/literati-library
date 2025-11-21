// src/contexts/Material3ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const Material3ThemeContext = createContext();

export const useMaterial3Theme = () => {
  const context = useContext(Material3ThemeContext);
  if (!context) {
    // Return safe default values instead of throwing error
    console.warn('useMaterial3Theme: No Material3ThemeProvider found, using default theme');
    return {
      theme: 'light',
      isLight: true,
      isDark: false,
      actualTheme: 'light',
      toggleTheme: () => console.warn('toggleTheme called outside Material3ThemeProvider'),
      setLightTheme: () => console.warn('setLightTheme called outside Material3ThemeProvider'),
      setDarkTheme: () => console.warn('setDarkTheme called outside Material3ThemeProvider'),
      setSystemTheme: () => console.warn('setSystemTheme called outside Material3ThemeProvider'),
      generateThemeFromImage: () => Promise.resolve(null),
      applyDynamicColors: () => console.warn('applyDynamicColors called outside Material3ThemeProvider')
    };
  }
  return context;
};

export const Material3ThemeProvider = ({ children, defaultTheme = 'auto' }) => {
  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('shelfquest-theme');
      if (stored && ['light', 'dark'].includes(stored)) return stored;
      
      if (defaultTheme === 'auto') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return defaultTheme;
    } catch (error) {
      console.warn('Failed to read theme from localStorage:', error);
      return 'light';
    }
  });

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      try {
        if (!localStorage.getItem('shelfquest-theme')) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      } catch (error) {
        console.warn('Failed to handle system theme change:', error);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    try {
      const root = document.documentElement;

      // Set data-theme attribute for MD3 unified colors
      root.setAttribute('data-theme', theme);

      // Also set class for compatibility with existing components
      root.classList.remove('light', 'dark');
      root.classList.add(theme);

      // Store user preference
      localStorage.setItem('shelfquest-theme', theme);

      console.warn(`🎨 Theme applied: ${theme}`);
    } catch (error) {
      console.warn('Failed to apply theme to DOM:', error);
    }
  }, [theme]);

  // Theme switching functions
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setLightTheme = () => setTheme('light');
  const setDarkTheme = () => setTheme('dark');
  
  const setSystemTheme = () => {
    try {
      localStorage.removeItem('shelfquest-theme');
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } catch (error) {
      console.warn('Failed to set system theme:', error);
      setTheme('light');
    }
  };

  // Dynamic color generation from book covers
  const generateThemeFromImage = async (imageUrl) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve) => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 100;
            canvas.height = 100;
            ctx.drawImage(img, 0, 0, 100, 100);
            
            const imageData = ctx.getImageData(0, 0, 100, 100);
            const data = imageData.data;
            
            // Simple dominant color extraction
            let r = 0, g = 0, b = 0;
            const pixelCount = data.length / 4;
            
            for (let i = 0; i < data.length; i += 4) {
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
            }
            
            r = Math.floor(r / pixelCount);
            g = Math.floor(g / pixelCount);
            b = Math.floor(b / pixelCount);
            
            // Convert to HSL for better color manipulation
            const hsl = rgbToHsl(r, g, b);
            
            // Generate Material 3 color scheme
            const primaryHue = hsl.h;
            const colors = generateMD3Palette(primaryHue);
            
            resolve(colors);
          } catch (error) {
            console.warn('Error processing image for theme:', error);
            resolve(null);
          }
        };
        
        img.onerror = () => {
          console.warn('Failed to load image for theme generation');
          resolve(null);
        };
        img.src = imageUrl;
      });
    } catch (error) {
      console.error('Error generating theme from image:', error);
      return null;
    }
  };

  // Apply dynamic colors to CSS custom properties
  const applyDynamicColors = (colors) => {
    if (!colors) return;
    
    try {
      const root = document.documentElement;
      Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(`--md-dynamic-${key}`, value);
      });
    } catch (error) {
      console.warn('Failed to apply dynamic colors:', error);
    }
  };

  // Memoized context value
  const contextValue = useMemo(() => ({
    theme,
    isLight: theme === 'light',
    isDark: theme === 'dark',
    actualTheme: theme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setSystemTheme,
    generateThemeFromImage,
    applyDynamicColors,
  }), [theme]);

  return (
    <Material3ThemeContext.Provider value={contextValue}>
      {children}
    </Material3ThemeContext.Provider>
  );
};

// Helper functions for color manipulation
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function generateMD3Palette(hue) {
  // Simplified Material 3 palette generation
  return {
    primary: `hsl(${hue}, 70%, 50%)`,
    'primary-container': `hsl(${hue}, 70%, 90%)`,
    secondary: `hsl(${(hue + 60) % 360}, 30%, 60%)`,
    'secondary-container': `hsl(${(hue + 60) % 360}, 30%, 95%)`,
    tertiary: `hsl(${(hue + 120) % 360}, 40%, 65%)`,
    'tertiary-container': `hsl(${(hue + 120) % 360}, 40%, 95%)`,
  };
}

export default Material3ThemeProvider;