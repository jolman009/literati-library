// file-structure-check.js
// Run this in your project root to verify all required files exist

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  // Core App Files
  'src/App.jsx',
  'src/App.css',
  
  // Pages
  'src/pages/DashboardPage.jsx',
  'src/pages/UploadPage.jsx', 
  'src/pages/NotesPage.jsx',
  'src/pages/Login.jsx',
  'src/pages/ReadBook.jsx',
  
  // Components
  'src/components/AppLayout.jsx',
  'src/components/EnhancedBookLibraryApp.jsx',
  
  // Contexts
  'src/contexts/AuthContext.jsx',
  'src/contexts/ReadingSessionContext.jsx',
  
  // Styles
  'src/styles/material3.css',
  'src/styles/gamification.css',
  'src/styles/dashboard-unified.css'
];

const optionalFiles = [
  'src/contexts/GamificationContext.jsx',
  'src/components/Material3/index.js',
  'src/components/ReadingSessionUI/index.js'
];

console.log('🔍 Checking File Structure...\n');

let missingRequired = [];
let missingOptional = [];

// Check required files
requiredFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${filePath}`);
  } else {
    console.log(`❌ ${filePath} - MISSING`);
    missingRequired.push(filePath);
  }
});

console.log('\n📋 Optional Files:');
// Check optional files
optionalFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${filePath}`);
  } else {
    console.log(`⚠️  ${filePath} - MISSING (optional)`);
    missingOptional.push(filePath);
  }
});

console.log('\n📊 Summary:');
console.log(`✅ Required files found: ${requiredFiles.length - missingRequired.length}/${requiredFiles.length}`);
console.log(`⚠️  Optional files found: ${optionalFiles.length - missingOptional.length}/${optionalFiles.length}`);

if (missingRequired.length > 0) {
  console.log('\n🚨 CRITICAL MISSING FILES:');
  missingRequired.forEach(file => {
    console.log(`   - ${file}`);
  });
  console.log('\n⚡ Action Required: Create these files or fix the import paths in App.jsx');
}

if (missingOptional.length > 0) {
  console.log('\n💡 OPTIONAL MISSING FILES:');
  missingOptional.forEach(file => {
    console.log(`   - ${file}`);
  });
  console.log('\n⚡ These files are referenced but optional. You may need to comment out related imports.');
}

// Check for export verification
console.log('\n🔧 Export Verification:');
console.log('Run these commands to check exports:');
console.log('node -e "console.log(require(\'./src/pages/DashboardPage.jsx\'))"');
console.log('node -e "console.log(require(\'./src/pages/UploadPage.jsx\'))"');
console.log('node -e "console.log(require(\'./src/pages/NotesPage.jsx\'))"');

if (missingRequired.length === 0) {
  console.log('\n🎉 All required files found! The issue is likely:');
  console.log('   1. Missing default exports in page components');
  console.log('   2. Incorrect import paths in App.jsx');
  console.log('   3. Missing Material3 components');
  console.log('\n📖 See the troubleshooting guide for next steps.');
} else {
  console.log('\n❌ Missing required files detected. Fix these first before proceeding.');
}