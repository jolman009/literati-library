import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json' with { type: 'json' };
import path from 'path';
import fs from 'fs';

// CRXJS doesn't copy content_scripts CSS to dist — this plugin does.
function copyContentCss() {
  return {
    name: 'copy-content-css',
    writeBundle() {
      const src = path.resolve(__dirname, 'src/content/content.css');
      const destDir = path.resolve(__dirname, 'dist/src/content');
      if (fs.existsSync(src)) {
        fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(src, path.join(destDir, 'content.css'));
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
    copyContentCss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
