import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // App identifier - matches your Android app for consistency
  appId: 'org.shelfquest.app',
  appName: 'ShelfQuest',

  // Vite outputs to 'dist' by default
  webDir: 'dist',

  // iOS-specific configuration
  ios: {
    // Content inset behavior for notch/safe areas
    contentInset: 'automatic',
    // Allow navigation to external URLs
    allowsLinkPreview: true,
    // Scroll behavior
    scrollEnabled: true,
    // Background color while loading
    backgroundColor: '#FFFBFE',
  },

  // Server configuration for development
  server: {
    // For development: uncomment to use live reload from your dev server
    // url: 'http://192.168.1.x:5173', // Replace with your machine's local IP
    // cleartext: true,

    // Allow navigation to your API server
    allowNavigation: [
      'shelfquest.org',
      '*.shelfquest.org',
      'library-server-m6gr.onrender.com',
      '*.supabase.co',
    ],
  },

  // Plugins configuration
  plugins: {
    // Splash screen configuration
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#FFFBFE',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    // Status bar configuration
    StatusBar: {
      style: 'dark', // Use 'light' for dark backgrounds
      backgroundColor: '#56a0d3',
    },
    // Keyboard configuration
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
