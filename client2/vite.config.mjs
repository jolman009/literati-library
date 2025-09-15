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
      includeAssets: ['favicon.ico', 'logo192.png', 'logo512.png'],
      manifest: {
        name: 'My Library App',
        short_name: 'Library',
        description: 'A progressive web app for managing your digital library',
        theme_color: '#3B82F6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'logo192.png', sizes: '192x192', type: 'image/png' },
          { src: 'logo512.png', sizes: '512x512', type: 'image/png' },
          // add a maskable icon if you have it:
          // { src: 'logo512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
      },
      workbox: {
        // Ensure SPA works on deep links when offline
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],

        // Runtime caching rules tuned for your app
        runtimeCaching: [
          // API calls (Render)
          {
            urlPattern: /^https:\/\/library-server-m6gr\.onrender\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }, // 24h
            },
          },

          // PDFs — fast reading once cached; version with ?v= to bust
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.pdf'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'pdf-cache',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7d
            },
          },

          // Images / covers
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'img-cache',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 14 }, // 14d
            },
          },

          // JS/CSS/workers (static assets)
          {
            urlPattern: ({ request }) =>
              ['style', 'script', 'worker'].includes(request.destination),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'asset-cache',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30d
            },
          },
        ],
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
          // Core React chunks
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-core';
          }
          if (id.includes('node_modules/react-router-dom')) {
            return 'react-router';
          }
          
          // Material UI chunks (heavy library)
          if (id.includes('node_modules/@mui') || id.includes('node_modules/@emotion')) {
            return 'material-ui';
          }
          
          // PDF processing (very heavy)
          if (id.includes('node_modules/pdfjs-dist') || id.includes('node_modules/react-pdf')) {
            return 'pdf-processing';
          }
          
          // EPUB processing
          if (id.includes('node_modules/epubjs') || id.includes('node_modules/react-reader')) {
            return 'epub-processing';
          }
          
          // External services
          if (id.includes('node_modules/@supabase')) {
            return 'supabase';
          }
          
          // Utility libraries
          if (id.includes('node_modules/axios') || 
              id.includes('node_modules/clsx') || 
              id.includes('node_modules/react-dropzone') ||
              id.includes('node_modules/react-window')) {
            return 'utils';
          }
          
          // Icon libraries
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          
          // CSS modules and styles
          if (id.includes('.css')) {
            return 'styles';
          }
          
          // All other node_modules as vendor
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },

  server: {
    port: 3000,
    strictPort: true,  // fail if 3000 is busy (helps avoid multiple dev servers)
    open: true,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
    },
  },
})


