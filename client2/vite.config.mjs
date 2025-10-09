// client2/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'literatiLOGO.png',
        'literati512.png',
        'favicon-96x96.png',
        'literatiLOGO_144x153.png'
      ],

      // Use the comprehensive manifest.json from public/ directory
      manifest: false, // This tells Vite to use public/manifest.json directly

      workbox: {
        // Ensure SPA works on deep links when offline
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /\.(pdf|epub)$/],

        // Comprehensive glob patterns for precaching
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff,woff2}',
          '**/manifest.json'
        ],

        // Clean up old caches automatically
        cleanupOutdatedCaches: true,

        // Skip waiting and claim clients immediately on update
        skipWaiting: true,
        clientsClaim: true,

        // Runtime caching rules optimized for Literati
        runtimeCaching: [
          // 1. API calls to backend (NetworkFirst with offline fallback)
          {
            urlPattern: /^https:\/\/library-server-m6gr\.onrender\.com\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'literati-api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            },
          },

          // 2. Supabase Storage - Book files (PDFs, EPUBs)
          {
            urlPattern: ({ url }) => {
              return url.pathname.includes('.pdf') ||
                     url.pathname.includes('.epub') ||
                     url.hostname.includes('supabase.co');
            },
            handler: 'CacheFirst',
            options: {
              cacheName: 'literati-books-cache',
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 50, // Store up to 50 books offline
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            },
          },

          // 3. Book covers and images (StaleWhileRevalidate for freshness)
          {
            urlPattern: ({ request, url }) => {
              return request.destination === 'image' ||
                     url.hostname.includes('covers.openlibrary.org') ||
                     url.hostname.includes('picsum.photos') ||
                     url.pathname.includes('/covers/');
            },
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'literati-images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 14 // 14 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            },
          },

          // 4. Google Fonts and Material Icons
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'literati-fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },

          // 5. Static assets (JS/CSS/Workers)
          {
            urlPattern: ({ request }) =>
              ['style', 'script', 'worker'].includes(request.destination),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'literati-assets-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
            },
          },
        ],
      },

      // Development options
      devOptions: {
        enabled: false, // Disable SW in development to avoid cache conflicts
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),

    // Enable with: ANALYZE=1 npm run build
    ...(process.env.ANALYZE
      ? [
          visualizer({
            filename: 'dist/stats.html',
            open: true,
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),

  ],

  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB to reduce noise
    minify: 'terser', // Use terser for better compression
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Navigation - React Router (needed for SPA)
          if (id.includes('node_modules/react-router-dom') || id.includes('node_modules/react-router')) {
            return 'react-router';
          }

          // Heavy processing libraries - separate for lazy loading
          if (id.includes('node_modules/pdfjs-dist') ||
              id.includes('node_modules/react-pdf') ||
              id.includes('node_modules/pdf-lib')) {
            return 'pdf-processing';
          }

          if (id.includes('node_modules/epubjs') ||
              id.includes('node_modules/react-reader') ||
              id.includes('node_modules/epub')) {
            return 'epub-processing';
          }

          // UI Framework - Material Design (medium priority)
          if (id.includes('node_modules/@mui') ||
              id.includes('node_modules/@emotion') ||
              id.includes('node_modules/@material')) {
            return 'material-ui';
          }

          // Data & Storage - Supabase and related
          if (id.includes('node_modules/@supabase') ||
              id.includes('node_modules/postgrest') ||
              id.includes('node_modules/gotrue')) {
            return 'supabase';
          }

          // Performance libraries - Virtual scrolling, lazy loading
          if (id.includes('node_modules/react-window') ||
              id.includes('node_modules/react-virtualized') ||
              id.includes('node_modules/react-intersection-observer')) {
            return 'performance';
          }

          // File handling - Upload, dropzone, file processing
          if (id.includes('node_modules/react-dropzone') ||
              id.includes('node_modules/file-type') ||
              id.includes('node_modules/mime')) {
            return 'file-handling';
          }

          // HTTP & API utilities
          if (id.includes('node_modules/axios') ||
              id.includes('node_modules/fetch') ||
              id.includes('node_modules/ky')) {
            return 'http-utils';
          }

          // Icons and graphics
          if (id.includes('node_modules/lucide-react') ||
              id.includes('node_modules/@tabler/icons') ||
              id.includes('node_modules/heroicons')) {
            return 'icons';
          }

          // Animation and transitions
          if (id.includes('node_modules/framer-motion') ||
              id.includes('node_modules/react-spring') ||
              id.includes('node_modules/lottie')) {
            return 'animations';
          }

          // Date and time utilities
          if (id.includes('node_modules/date-fns') ||
              id.includes('node_modules/moment') ||
              id.includes('node_modules/dayjs')) {
            return 'date-utils';
          }

          // Chart and visualization libraries
          if (id.includes('node_modules/chart.js') ||
              id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3')) {
            return 'charts';
          }

          // Utility libraries (lightweight)
          if (id.includes('node_modules/clsx') ||
              id.includes('node_modules/classnames') ||
              id.includes('node_modules/lodash') ||
              id.includes('node_modules/ramda')) {
            return 'utils';
          }

          // CSS and styling
          if (id.includes('.css') || id.includes('.scss') || id.includes('.sass')) {
            return 'styles';
          }

          // Service Workers and PWA
          if (id.includes('workbox') || id.includes('sw-')) {
            return 'pwa';
          }

          // All other node_modules as vendor (catch-all)
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },

  server: {
    host: '127.0.0.1',  // Use IPv4 localhost
    port: 5173,  // Port 3000 blocked by Windows (see docs/PORT-3000-ISSUE.md and fix-port-3000.ps1)
    strictPort: false,  // auto-increment if busy
    open: true,
    // Fix for SPA routing - ensures all routes serve index.html
    historyApiFallback: true,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
    },
  },
})


