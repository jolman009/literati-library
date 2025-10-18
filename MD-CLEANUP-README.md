# MD File Cleanup Script

This script safely removes 53 unnecessary markdown files from the project, organized into 10 categories.

## 📋 What Will Be Removed

### Categories:
1. **Third-Party Packages (venv)** - 4 files from Python virtual environment
2. **Temporary Status/Task Files** - 11 completed task summaries
3. **One-Time Fixes/Checklists** - 9 temporary fix documentation files
4. **Redundant Documentation** - 7 files with duplicate information
5. **Completed Analysis/Audit Files** - 5 audit reports (completed)
6. **Component-Specific Docs** - 7 files that should be code comments
7. **Android Setup Files** - 5 files to consolidate into main guide
8. **Offline Implementation Summaries** - 2 summary files
9. **Testing Plan Files** - 2 completed testing plans
10. **Integration Guide Files** - 1 completed integration guide

**Total: 53 files**

## 🚀 Usage

### Step 1: Preview (Dry Run) - RECOMMENDED FIRST
See what will be removed without making any changes:
```bash
node cleanup-md-files.js --dry-run
```

### Step 2: Backup & Remove (SAFEST)
Move files to `.md-cleanup-backup/` folder before deleting:
```bash
node cleanup-md-files.js --backup
```

This is the **recommended approach** because:
- Files are preserved in `.md-cleanup-backup/`
- You can review backed-up files before permanently deleting
- Easy to restore if needed

### Step 3 (Optional): Permanent Delete
Skip backup and permanently delete files:
```bash
node cleanup-md-files.js --delete
```

⚠️ **Warning**: This permanently removes files! Use `--backup` first unless you're absolutely sure.

## 📂 What Happens to Backed Up Files

Files are moved to `.md-cleanup-backup/` with the same directory structure:
```
.md-cleanup-backup/
├── DEPLOYMENT_STATUS_REPORT.md
├── client2/
│   └── SIGNUP-INCOGNITO-FIX.md
├── android/
│   ├── INSTALL_JAVA_JDK.md
│   └── ...
└── ...
```

The backup folder is already added to `.gitignore` so it won't be committed.

## ✅ Files That Will Be KEPT

The script preserves all essential documentation:
- ✅ [README.md](README.md) - Main project README
- ✅ [docs/README.md](docs/README.md) - Documentation index
- ✅ [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - Production deployment guide
- ✅ [docs/API.md](docs/API.md) - API documentation
- ✅ [docs/DEVELOPER_ONBOARDING.md](docs/DEVELOPER_ONBOARDING.md) - Onboarding guide
- ✅ [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Debug guide
- ✅ [TESTING.md](TESTING.md) - Testing documentation
- ✅ [CI-CD-SETUP.md](CI-CD-SETUP.md) - CI/CD pipeline
- ✅ [REPOSITORY_ARCHITECTURE.md](REPOSITORY_ARCHITECTURE.md) - Architecture docs
- ✅ All legal docs ([legal/](legal/)) - Required for production
- ✅ All app store assets ([app-store-assets/](app-store-assets/)) - Required for publishing

## 🔄 Restore Backed Up Files

If you need to restore files from backup:

```bash
# Restore a single file
cp .md-cleanup-backup/DEPLOYMENT_STATUS_REPORT.md ./

# Restore entire category folder
cp -r .md-cleanup-backup/android/* android/

# Restore everything (careful!)
cp -r .md-cleanup-backup/* ./
```

## 🧹 Complete Cleanup Process

Recommended workflow:

```bash
# 1. Preview what will be removed
node cleanup-md-files.js --dry-run

# 2. Create backup and remove files
node cleanup-md-files.js --backup

# 3. Review the backup folder
ls -la .md-cleanup-backup/

# 4. If everything looks good, commit the changes
git add .
git commit -m "docs: remove 53 unnecessary markdown files"

# 5. (Optional) After confirming everything works, delete backup
rm -rf .md-cleanup-backup/
```

## 📊 Impact

**Before**: ~100+ markdown files scattered across the project
**After**: ~50 well-organized, essential markdown files

Benefits:
- ✅ Cleaner repository structure
- ✅ Easier to find relevant documentation
- ✅ Reduced confusion from outdated/duplicate docs
- ✅ Smaller repository size
- ✅ Faster searches and navigation

## ❓ Need Help?

- **File not in the list?** The script only removes files explicitly listed
- **Need to keep a file?** Edit `cleanup-md-files.js` and remove it from the list
- **Made a mistake?** Use the backup folder to restore files
- **Script not working?** Make sure you're running from the project root directory
