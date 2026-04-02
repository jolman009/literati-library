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

  // Android-specific configuration
  android: {
    // Use https scheme so cookies/CORS behave like production
    webContentsDebuggingEnabled: true, // Remove for production release
  },

  // Server configuration
  server: {
    // Use https scheme so service workers and secure contexts work
    androidScheme: 'https',

    // For development: uncomment to use live reload from dev server
    // url: 'http://10.0.2.2:5173',
    // cleartext: true,

    // Allow navigation to your API server
    allowNavigation: [
      'shelfquest.org',
      '*.shelfquest.org',
      'library-server-m6gr.onrender.com',
      '*.supabase.co',
      'checkout.stripe.com',
      '*.stripe.com',
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
