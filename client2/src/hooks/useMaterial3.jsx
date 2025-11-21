import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { useSnackbar } from '../components/Material3/MD3Snackbar';

/**
 * Main hook for accessing Material Design 3 functionality
 * Combines theme management and snackbar functionality
 */
export const useMaterial3 = () => {
  const themeContext = useMaterial3Theme();
  const snackbarContext = useSnackbar();

  return {
    // Theme functionality
    ...themeContext,
    
    // Snackbar functionality  
    ...snackbarContext,
    
    // Utility functions
    applyDynamicTheme: async (imageUrl) => {
      // TODO: Implement dynamic color extraction from book covers
      console.warn('Dynamic theme extraction from:', imageUrl);
    },
    
    // Color utilities
    getSemanticColor: (colorName) => {
      const root = document.documentElement;
      return getComputedStyle(root).getPropertyValue(`--md-sys-color-${colorName}`);
    }
  };
};

// Re-export theme hook for direct access
export { useMaterial3Theme } from '../contexts/Material3ThemeContext';

// Default export
export default useMaterial3;