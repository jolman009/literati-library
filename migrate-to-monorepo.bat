@echo off
echo ========================================
echo LITERATI MONOREPO MIGRATION SCRIPT
echo ========================================
echo.

echo Step 1: Backing up current remote configuration...
git remote -v > current-remotes-backup.txt
echo Current remotes saved to current-remotes-backup.txt

echo.
echo Step 2: Removing current remotes...
git remote remove client2-origin
git remote remove server2-origin
git remote remove ai-repo

echo.
echo Step 3: Adding new unified remote...
echo IMPORTANT: Replace 'literati-monorepo' with your actual repository name!
set /p REPO_NAME=Enter your new repository name (e.g., literati-monorepo):
git remote add origin https://github.com/jolman009/%REPO_NAME%.git

echo.
echo Step 4: Setting main branch and pushing...
git branch -M main
git push -u origin main

echo.
echo ========================================
echo MIGRATION COMPLETED!
echo ========================================
echo.
echo Next steps:
echo 1. Update deployment services (Vercel, Render) to use new repository
echo 2. Copy GitHub secrets to new repository
echo 3. Test deployments
echo 4. Add deprecation notices to old repositories
echo.
echo Your monorepo is now live at:
echo https://github.com/jolman009/%REPO_NAME%
echo.
pause