#!/usr/bin/env node
/**
 * Simple File Existence Check
 * Validates UX files are present - no complex operations
 */

const fs = require('fs');
const path = require('path');

console.log('\n=== UX File Verification ===\n');

const files = [
  'assets/js/ux-enhancements.js',
  'assets/css/ux-enhancements.css',
  'assets/js/main.js',
  '_includes/layout/head-clean.html',
  '_includes/layout/scripts.html',
];

let allPresent = true;

files.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(fullPath);

  if (exists) {
    const stats = fs.statSync(fullPath);
    console.log(`✓ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`✗ ${file} MISSING`);
    allPresent = false;
  }
});

console.log('\n=== Integration Check ===\n');

try {
  const headContent = fs.readFileSync(
    path.join(__dirname, '..', '_includes/layout/head-clean.html'),
    'utf8'
  );
  if (headContent.includes('ux-enhancements.css')) {
    console.log('✓ ux-enhancements.css referenced in head-clean.html');
  } else {
    console.log('✗ ux-enhancements.css NOT referenced');
    allPresent = false;
  }
} catch (_e) {
  console.log('✗ Error reading head-clean.html');
  allPresent = false;
}

try {
  const scriptsContent = fs.readFileSync(
    path.join(__dirname, '..', '_includes/layout/scripts.html'),
    'utf8'
  );
  if (scriptsContent.includes('ux-enhancements.js')) {
    console.log('✓ ux-enhancements.js referenced in scripts.html');
  } else {
    console.log('✗ ux-enhancements.js NOT referenced');
    allPresent = false;
  }
} catch (_e) {
  console.log('✗ Error reading scripts.html');
  allPresent = false;
}

console.log('\n=== Summary ===\n');

if (allPresent) {
  console.log('✅ All UX files present and properly integrated!\n');
  console.log('Next: Run "bundle exec jekyll build" to build the site.\n');
  process.exit(0);
} else {
  console.log('❌ Some files are missing or not integrated.\n');
  process.exit(1);
}
