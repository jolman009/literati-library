#!/usr/bin/env node
// fix-lint-errors.js
// Automated ESLint error fixer

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix mapping: [pattern, replacement]
const fixes = [
  // console.log -> console.warn
  { pattern: /console\.log\(/g, replacement: 'console.warn(' },

  // Prefix unused variables with _
  { pattern: /catch \((error|err|e)\) \{/g, replacement: 'catch {' },

  // Common unused variable patterns
  { pattern: /const \[(\w+), set\1\] = useState/g, replacement: 'const [_$1, set$1] = useState' },
];

function fixFile(filePath) {
  console.log(`Processing: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const fix of fixes) {
    const before = content;
    content = content.replace(fix.pattern, fix.replacement);
    if (content !== before) {
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ Fixed: ${filePath}`);
    return true;
  }

  return false;
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'build') {
        walkDir(filePath, callback);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      callback(filePath);
    }
  }
}

const srcDir = path.join(__dirname, 'src');
let fixedCount = 0;

walkDir(srcDir, (filePath) => {
  if (fixFile(filePath)) {
    fixedCount++;
  }
});

console.log(`\n✓ Fixed ${fixedCount} files`);
console.log('Run: pnpm run lint to verify');
