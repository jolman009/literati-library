// Builds a zip from dist/ for Chrome Web Store submission.
// Usage: node scripts/zip.js

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const artifactsDir = path.join(root, 'artifacts');

if (!existsSync(distDir)) {
  console.error('dist/ not found — run `pnpm run build` first.');
  process.exit(1);
}

if (!existsSync(artifactsDir)) {
  mkdirSync(artifactsDir, { recursive: true });
}

const pkg = JSON.parse(
  (await import('fs')).readFileSync(path.join(root, 'package.json'), 'utf8'),
);
const zipName = `shelfquest-extension-v${pkg.version}.zip`;
const zipPath = path.join(artifactsDir, zipName);

// Use PowerShell's Compress-Archive on Windows, zip on Unix
const isWin = process.platform === 'win32';
if (isWin) {
  execSync(
    `powershell -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${zipPath}' -Force"`,
  );
} else {
  execSync(`cd "${distDir}" && zip -r "${zipPath}" .`);
}

console.log(`Created ${zipPath}`);
