/**
 * MD File Cleanup Script
 * Safely removes unnecessary markdown files from the project
 *
 * Usage:
 *   node cleanup-md-files.js --dry-run    # See what will be deleted
 *   node cleanup-md-files.js --backup     # Move files to backup folder
 *   node cleanup-md-files.js --delete     # Permanently delete files
 */

const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isBackup = args.includes('--backup');
const isDelete = args.includes('--delete');

const ROOT_DIR = __dirname;
const BACKUP_DIR = path.join(ROOT_DIR, '.md-cleanup-backup');

// Files categorized by reason for removal
const filesToRemove = {
  'Third-Party Packages (venv)': [
    'ai-service/venv/Lib/site-packages/idna-3.10.dist-info/LICENSE.md',
    'ai-service/venv/Lib/site-packages/uvicorn-0.35.0.dist-info/licenses/LICENSE.md',
    'ai-service/venv/Lib/site-packages/starlette-0.46.2.dist-info/licenses/LICENSE.md',
    'ai-service/venv/Lib/site-packages/pip-25.2.dist-info/licenses/src/pip/_vendor/idna/LICENSE.md',
  ],
  'Temporary Status/Task Files': [
    'DEPLOYMENT_STATUS_REPORT.md',
    'status_update.md',
    'BACKEND_INTEGRATION_COMPLETE.md',
    'ANDROID_SETUP_COMPLETE.md',
    'PWA_CLEANUP_SUMMARY.md',
    'ENVIRONMENT_SETUP_SUMMARY.md',
    'SECURITY_ENHANCEMENT_SUMMARY.md',
    'DOCUMENTATION_COMPLETION_SUMMARY.md',
    'GAMIFICATION_INTEGRATION_STATUS.md',
    'ANDROID_DEPLOYMENT_STATUS.md',
    'RELEASE_NOTES_v0.1.0-android-beta.md',
  ],
  'One-Time Fixes/Checklists': [
    'VERCEL_DEPLOYMENT_FIX.md',
    'QUICK_FIX_CHECKLIST.md',
    'QUICK_DEPLOY_CHECKLIST.md',
    'POST_MIGRATION_CHECKLIST.md',
    'DUPLICATE_TIMER_FIX.md',
    'DEBUG_INSTRUCTIONS.md',
    'TODO-EPUB-LOCATION.md',
    'client2/SIGNUP-INCOGNITO-FIX.md',
    'client2/CONFIGURATION_MIGRATION.md',
  ],
  'Redundant Documentation': [
    'MONOREPO_SUMMARY.md',
    'ENVIRONMENT_CONFIGURATION.md',
    'DEPLOYMENT_AUTOMATION_SETUP.md',
    'Production_Ready.md',
    'APP_Deployment_Readiness.md',
    'ShelfQuest-Production_Readiness_Review.md',
    'PRODUCTION_DEPLOYMENT_GUIDE.md',
  ],
  'Completed Analysis/Audit Files': [
    'MATERIAL3_COLOR_AUDIT.md',
    'READING_SESSION_ANALYSIS.md',
    'ACCESSIBILITY_AUDIT_REPORT.md',
    'DATABASE-PERFORMANCE-TEST.md',
    'CACHING-PERFORMANCE-REPORT.md',
  ],
  'Component-Specific Docs (Should be code comments)': [
    'pdfreader_OG.md',
    'docs/EBLA1668.md',
    'docs/BookCardEnhanced.md',
    'docs/LibraryPage.md',
    'docs/NEW_Markdown.md',
    'docs/PORT-3000-ISSUE.md',
    'client2/src/components/MD3Footer-Integration-Guide.md',
  ],
  'Android Setup Files (Consolidate into main guide)': [
    'android/INSTALL_JAVA_JDK.md',
    'android/INSTALL_ANDROID_SDK.md',
    'android/INSTALL_SDK_PLATFORM.md',
    'android/FIRST_TIME_ANDROID_STUDIO_SETUP.md',
    'android/NEXT_STEPS.md',
  ],
  'Offline Implementation Summaries': [
    'client2/OFFLINE_IMPLEMENTATION_SUMMARY.md',
    'client2/OFFLINE_SYSTEM_DIAGRAM.md',
  ],
  'Testing Plan Files (Completed)': [
    'GAMIFICATION_TESTING_PLAN.md',
    'ACCESSIBILITY_TESTING_GUIDE.md',
  ],
  'Integration Guide Files (Completed)': [
    'GAMIFICATION_INTEGRATION_GUIDE.md',
  ],
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    log(`✓ Created backup directory: ${BACKUP_DIR}`, 'green');
  }
}

function backupFile(relativeFilePath) {
  const sourcePath = path.join(ROOT_DIR, relativeFilePath);
  const backupPath = path.join(BACKUP_DIR, relativeFilePath);

  if (!fs.existsSync(sourcePath)) {
    log(`  ⚠ File not found: ${relativeFilePath}`, 'yellow');
    return false;
  }

  // Create backup directory structure
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Copy file to backup
  fs.copyFileSync(sourcePath, backupPath);
  return true;
}

function deleteFile(relativeFilePath) {
  const filePath = path.join(ROOT_DIR, relativeFilePath);

  if (!fs.existsSync(filePath)) {
    log(`  ⚠ File not found: ${relativeFilePath}`, 'yellow');
    return false;
  }

  fs.unlinkSync(filePath);
  return true;
}

function printSummary() {
  log('\n' + '='.repeat(80), 'cyan');
  log('MD FILE CLEANUP SUMMARY', 'bright');
  log('='.repeat(80) + '\n', 'cyan');

  let totalFiles = 0;
  let totalCategories = 0;

  for (const [category, files] of Object.entries(filesToRemove)) {
    totalCategories++;
    totalFiles += files.length;

    log(`${totalCategories}. ${category}`, 'magenta');
    log(`   Files: ${files.length}`, 'cyan');
    files.forEach(file => {
      const exists = fs.existsSync(path.join(ROOT_DIR, file));
      const status = exists ? '✓' : '✗';
      const statusColor = exists ? 'green' : 'yellow';
      log(`   ${status} ${file}`, statusColor);
    });
    console.log();
  }

  log('='.repeat(80), 'cyan');
  log(`Total Categories: ${totalCategories}`, 'bright');
  log(`Total Files: ${totalFiles}`, 'bright');
  log('='.repeat(80) + '\n', 'cyan');
}

function performCleanup() {
  if (isDryRun) {
    log('\n🔍 DRY RUN MODE - No files will be modified\n', 'yellow');
    printSummary();
    log('\nTo actually remove files, run with --backup or --delete', 'cyan');
    return;
  }

  if (isBackup) {
    log('\n📦 BACKUP MODE - Moving files to backup folder\n', 'blue');
    ensureBackupDir();

    let backedUp = 0;
    let notFound = 0;

    for (const [category, files] of Object.entries(filesToRemove)) {
      log(`\n${category}:`, 'magenta');
      for (const file of files) {
        if (backupFile(file)) {
          log(`  ✓ Backed up: ${file}`, 'green');
          deleteFile(file);
          backedUp++;
        } else {
          notFound++;
        }
      }
    }

    log(`\n${'='.repeat(80)}`, 'cyan');
    log(`✓ Backup complete!`, 'green');
    log(`  Files backed up: ${backedUp}`, 'green');
    log(`  Files not found: ${notFound}`, 'yellow');
    log(`  Backup location: ${BACKUP_DIR}`, 'cyan');
    log('='.repeat(80) + '\n', 'cyan');
    return;
  }

  if (isDelete) {
    log('\n🗑️  DELETE MODE - Permanently removing files\n', 'red');
    log('⚠️  WARNING: Files will be permanently deleted!', 'red');
    log('   Consider using --backup instead for safety.\n', 'yellow');

    let deleted = 0;
    let notFound = 0;

    for (const [category, files] of Object.entries(filesToRemove)) {
      log(`\n${category}:`, 'magenta');
      for (const file of files) {
        if (deleteFile(file)) {
          log(`  ✓ Deleted: ${file}`, 'red');
          deleted++;
        } else {
          notFound++;
        }
      }
    }

    log(`\n${'='.repeat(80)}`, 'cyan');
    log(`✓ Deletion complete!`, 'green');
    log(`  Files deleted: ${deleted}`, 'red');
    log(`  Files not found: ${notFound}`, 'yellow');
    log('='.repeat(80) + '\n', 'cyan');
    return;
  }

  // No valid flag provided
  log('\n⚠️  Please specify a mode:', 'yellow');
  log('  --dry-run    See what will be deleted', 'cyan');
  log('  --backup     Move files to backup folder (recommended)', 'cyan');
  log('  --delete     Permanently delete files', 'cyan');
  log('\nExample: node cleanup-md-files.js --dry-run\n', 'green');
}

// Run the cleanup
performCleanup();
