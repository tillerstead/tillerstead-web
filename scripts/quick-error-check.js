#!/usr/bin/env node
/**
 * Quick Error Check - Fast UX Scan
 * Checks for common blocking errors without running full linters
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const errors = [];
const warnings = [];

// Color codes
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const green = '\x1b[32m';
const cyan = '\x1b[36m';
const reset = '\x1b[0m';

console.log(`${cyan}🔍 Quick Error Check - UX Scan${reset}\n`);

// Check JavaScript files for common issues
function checkJSFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = filePath.replace(rootDir + path.sep, '');

    // Check for syntax errors (unclosed braces, etc.)
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push(`${relativePath}: Mismatched braces (${openBraces} open, ${closeBraces} close)`);
    }

    if (openParens !== closeParens) {
      errors.push(
        `${relativePath}: Mismatched parentheses (${openParens} open, ${closeParens} close)`
      );
    }

    // Check for blocking console statements in production
    const consoleDebug = content.match(/console\.(log|debug)\(/g);
    if (consoleDebug && !relativePath.includes('debug') && !relativePath.includes('test')) {
      warnings.push(`${relativePath}: Found ${consoleDebug.length} console.log/debug statements`);
    }

    // Check for unclosed strings
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      // Skip comments
      if (line.trim().startsWith('//')) return;

      // Check for common string issues
      const singleQuotes = (line.match(/'/g) || []).length;
      const _doubleQuotes = (line.match(/"/g) || []).length;
      const _backticks = (line.match(/`/g) || []).length;

      if (singleQuotes % 2 !== 0 && !line.includes("\\'")) {
        warnings.push(`${relativePath}:${idx + 1}: Possible unclosed string (single quote)`);
      }
    });
  } catch (e) {
    errors.push(`${filePath}: Failed to read - ${e.message}`);
  }
}

// Recursively scan directory
// eslint-disable-next-line no-unused-vars
function scanDirectory(dir, fileHandler, exts) {
  const skipDirs = [
    'node_modules',
    '_site',
    'test-results',
    'playwright-report',
    'dist',
    'build',
    '.git',
  ];

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!skipDirs.includes(item)) {
          scanDirectory(fullPath, fileHandler, exts);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (exts.includes(ext)) {
          fileHandler(fullPath);
        }
      }
    }
  } catch (_e) {
    // Skip inaccessible directories
  }
}

// Scan JavaScript files
console.log('Scanning JavaScript files...');
const jsDir = path.join(rootDir, 'assets', 'js');
let jsCount = 0;

try {
  const files = fs.readdirSync(jsDir);
  files.forEach(file => {
    if (file.endsWith('.js') && !file.includes('.min.') && !file.includes('bundle.')) {
      checkJSFile(path.join(jsDir, file));
      jsCount++;
    }
  });
} catch (e) {
  errors.push(`Failed to scan JS directory: ${e.message}`);
}

console.log(`  ✓ Scanned ${jsCount} JavaScript files\n`);

// Check for blocking UX errors
console.log('Checking for UX blocking errors...');

// Check if critical files exist
const criticalFiles = [
  path.join('assets', 'js', 'ux-enhancements.js'),
  path.join('assets', 'css', 'ux-enhancements.css'),
  path.join('assets', 'js', 'main.js'),
];

criticalFiles.forEach(file => {
  const fullPath = path.join(rootDir, file);
  try {
    fs.statSync(fullPath);
    console.log(`  ${green}✓${reset} ${file} exists`);
  } catch (_e) {
    errors.push(`Missing critical file: ${file}`);
  }
});

// Report results
console.log(`\n${'='.repeat(60)}\n`);

if (errors.length === 0 && warnings.length === 0) {
  console.log(`${green}✅ No blocking errors found!${reset}`);
  console.log(`${green}✅ UX scan passed${reset}\n`);
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log(`${red}❌ ${errors.length} ERROR(S) FOUND:${reset}\n`);
    errors.forEach(err => console.log(`  ${red}•${reset} ${err}`));
    console.log();
  }

  if (warnings.length > 0) {
    console.log(`${yellow}⚠️  ${warnings.length} WARNING(S):${reset}\n`);
    warnings.slice(0, 10).forEach(warn => console.log(`  ${yellow}•${reset} ${warn}`));
    if (warnings.length > 10) {
      console.log(`  ... and ${warnings.length - 10} more`);
    }
    console.log();
  }

  if (errors.length > 0) {
    console.log(`${red}Fix errors above before deploying${reset}\n`);
    process.exit(1);
  } else {
    console.log(`${yellow}Warnings are non-critical${reset}\n`);
    process.exit(0);
  }
}
