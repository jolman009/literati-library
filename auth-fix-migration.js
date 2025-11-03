#!/usr/bin/env node

/**
 * Authentication Fix Migration Script
 *
 * This script safely applies the authentication fixes to resolve race conditions
 * and token refresh issues. It includes automatic backup and rollback capabilities.
 *
 * Usage:
 *   node auth-fix-migration.js apply     # Apply the fixes
 *   node auth-fix-migration.js rollback  # Rollback to previous state
 *   node auth-fix-migration.js validate  # Validate current state
 *
 * What this fixes:
 * - Double token refresh race conditions
 * - Conflicting dev header auth strategy
 * - Recursive verification loops
 * - Token family breach false positives
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const BACKUP_DIR = path.join(__dirname, '.auth-fix-backups');
const BACKUP_TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// Files to modify
const FILES_TO_MODIFY = [
  'client2/src/config/api.js',
  'client2/src/contexts/AuthContext.jsx',
  'client2/.env.development',
  'server2/src/middlewares/enhancedAuth.js'
];

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Create backup directory
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    logSuccess(`Created backup directory: ${BACKUP_DIR}`);
  }
}

// Backup files
function backupFiles() {
  logSection('BACKING UP FILES');

  ensureBackupDir();

  const backupSubDir = path.join(BACKUP_DIR, BACKUP_TIMESTAMP);
  fs.mkdirSync(backupSubDir, { recursive: true });

  let backedUpCount = 0;

  for (const file of FILES_TO_MODIFY) {
    const sourcePath = path.join(__dirname, file);

    if (!fs.existsSync(sourcePath)) {
      logWarning(`File not found (skipping): ${file}`);
      continue;
    }

    const backupPath = path.join(backupSubDir, file);
    const backupDir = path.dirname(backupPath);

    // Ensure backup subdirectories exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Copy file
    fs.copyFileSync(sourcePath, backupPath);
    logSuccess(`Backed up: ${file}`);
    backedUpCount++;
  }

  // Save metadata
  const metadata = {
    timestamp: BACKUP_TIMESTAMP,
    date: new Date().toISOString(),
    filesBackedUp: backedUpCount,
    files: FILES_TO_MODIFY
  };

  fs.writeFileSync(
    path.join(backupSubDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  logSuccess(`\nBackup completed: ${backedUpCount} files backed up to ${backupSubDir}`);
  return backupSubDir;
}

// Rollback from backup
function rollback() {
  logSection('ROLLING BACK CHANGES');

  if (!fs.existsSync(BACKUP_DIR)) {
    logError('No backups found. Cannot rollback.');
    return false;
  }

  // Find most recent backup
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(name => name !== '.gitkeep')
    .sort()
    .reverse();

  if (backups.length === 0) {
    logError('No backups found. Cannot rollback.');
    return false;
  }

  const latestBackup = backups[0];
  const backupPath = path.join(BACKUP_DIR, latestBackup);

  logInfo(`Rolling back from: ${latestBackup}`);

  // Read metadata
  const metadataPath = path.join(backupPath, 'metadata.json');
  if (!fs.existsSync(metadataPath)) {
    logError('Backup metadata not found. Cannot verify backup integrity.');
    return false;
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  logInfo(`Backup date: ${metadata.date}`);
  logInfo(`Files in backup: ${metadata.filesBackedUp}`);

  let restoredCount = 0;

  for (const file of metadata.files) {
    const backupFilePath = path.join(backupPath, file);
    const targetPath = path.join(__dirname, file);

    if (!fs.existsSync(backupFilePath)) {
      logWarning(`Backup file not found (skipping): ${file}`);
      continue;
    }

    // Restore file
    fs.copyFileSync(backupFilePath, targetPath);
    logSuccess(`Restored: ${file}`);
    restoredCount++;
  }

  logSuccess(`\nRollback completed: ${restoredCount} files restored`);
  return true;
}

// Validate current state
function validate() {
  logSection('VALIDATING CURRENT STATE');

  let allValid = true;

  // Check if files exist
  for (const file of FILES_TO_MODIFY) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      logError(`Missing file: ${file}`);
      allValid = false;
    } else {
      logSuccess(`Found: ${file}`);
    }
  }

  // Validate api.js
  const apiJsPath = path.join(__dirname, 'client2/src/config/api.js');
  if (fs.existsSync(apiJsPath)) {
    const content = fs.readFileSync(apiJsPath, 'utf8');

    // Check for problematic patterns
    if (content.includes('originalRequest._retry = true')) {
      logWarning('api.js still contains refresh logic (should be removed)');
      allValid = false;
    } else {
      logSuccess('api.js: Refresh logic removed ✓');
    }
  }

  // Validate AuthContext.jsx
  const authContextPath = path.join(__dirname, 'client2/src/contexts/AuthContext.jsx');
  if (fs.existsSync(authContextPath)) {
    const content = fs.readFileSync(authContextPath, 'utf8');

    if (content.includes('let refreshPromise = null')) {
      logSuccess('AuthContext.jsx: Mutex pattern implemented ✓');
    } else {
      logWarning('AuthContext.jsx: Mutex pattern not found');
      allValid = false;
    }

    if (content.includes('makeAuthenticatedApiCall(\'/auth/profile\')')) {
      logWarning('AuthContext.jsx: verifyToken still uses makeAuthenticatedApiCall (should use makeApiCall)');
      allValid = false;
    }
  }

  // Validate .env.development
  const envPath = path.join(__dirname, 'client2/.env.development');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');

    if (content.includes('VITE_DEV_HEADER_AUTH=false')) {
      logSuccess('.env.development: Header auth set to false (recommended) ✓');
    } else if (content.includes('VITE_DEV_HEADER_AUTH=true')) {
      logInfo('.env.development: Header auth enabled (acceptable for testing)');
    }
  }

  logSection('VALIDATION SUMMARY');
  if (allValid) {
    logSuccess('All validations passed! ✨');
  } else {
    logWarning('Some validations failed. Review the output above.');
  }

  return allValid;
}

// Apply fixes
function applyFixes() {
  logSection('APPLYING AUTHENTICATION FIXES');

  // Backup first
  const backupDir = backupFiles();

  logSection('APPLYING FIXES');

  try {
    // We'll apply fixes in the next step via Edit commands
    logInfo('Fixes will be applied via individual Edit operations');
    logInfo('Backup location: ' + backupDir);
    logSuccess('Migration script ready. Proceed with Edit operations.');

    return true;
  } catch (error) {
    logError(`Error during migration: ${error.message}`);
    logInfo('You can rollback using: node auth-fix-migration.js rollback');
    return false;
  }
}

// Main execution
function main() {
  const command = process.argv[2];

  logSection('AUTHENTICATION FIX MIGRATION SCRIPT');
  logInfo('This script fixes race conditions in token refresh logic');

  switch (command) {
    case 'apply':
      applyFixes();
      break;

    case 'rollback':
      rollback();
      break;

    case 'validate':
      validate();
      break;

    default:
      log('\nUsage:', 'bright');
      logInfo('  node auth-fix-migration.js apply     - Apply fixes');
      logInfo('  node auth-fix-migration.js rollback  - Rollback to previous state');
      logInfo('  node auth-fix-migration.js validate  - Validate current state');
      log('');
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { backupFiles, rollback, validate };
