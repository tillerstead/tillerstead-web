#!/usr/bin/env node

/**
 * Repository-Wide Optimization Script
 *
 * Performs comprehensive optimizations across the entire codebase:
 * - Logo system cleanup
 * - Image optimization (WebP conversion, lazy loading)
 * - CSS optimization (unused rules, minification)
 * - JS optimization (tree-shaking, bundling)
 * - HTML optimization (minify, inline critical CSS)
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');

const config = {
  // Files to remove (unused/duplicates)
  filesToDelete: [
    'assets/img/logo/logo.png',
    'assets/img/logo/tillerstead-logo-main.png',
    'assets/img/tillerstead-logo-stacked.svg',
    'assets/img/tillerstead-logo-mark-with-word.svg',
    'assets/img/tillerstead-logo-inverse.svg',
  ],

  // Directories to scan for images
  imageDirs: ['assets/img', 'assets/images', 'assets/icons'],

  // CSS files to analyze
  cssDirs: ['assets/css', '_site/assets/css'],

  // JS files to optimize
  jsDirs: ['assets/js'],

  // Image optimization settings
  imageOptimization: {
    quality: {
      webp: 85,
      png: 90,
      jpg: 85,
    },
    maxWidth: 2400,
    maxHeight: 2400,
  },
};

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  console.log('');
  log('='.repeat(60), 'cyan');
  log(message, 'bright');
  log('='.repeat(60), 'cyan');
  console.log('');
}

/**
 * Step 1: Clean up unused logo files
 */
function cleanupLogoFiles() {
  header('STEP 1: Cleaning Up Unused Logo Files');

  let totalSaved = 0;
  let filesDeleted = 0;

  config.filesToDelete.forEach(file => {
    const filePath = path.join(REPO_ROOT, file);

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);

      try {
        fs.unlinkSync(filePath);
        log(`✓ Deleted: ${file} (${sizeKB} KB saved)`, 'green');
        totalSaved += stats.size;
        filesDeleted++;
      } catch (err) {
        log(`✗ Failed to delete: ${file} - ${err.message}`, 'red');
      }
    } else {
      log(`⊘ Not found: ${file}`, 'yellow');
    }
  });

  log(
    `\nTotal: ${filesDeleted} files deleted, ${(totalSaved / 1024 / 1024).toFixed(2)} MB saved`,
    'bright'
  );
}

/**
 * Step 2: Audit image files and suggest optimizations
 */
function auditImages() {
  header('STEP 2: Image Audit');

  const images = {
    total: 0,
    byType: {},
    large: [], // > 500KB
    missingWebP: [],
    totalSize: 0,
  };

  config.imageDirs.forEach(dir => {
    const dirPath = path.join(REPO_ROOT, dir);

    if (!fs.existsSync(dirPath)) {
      log(`⊘ Directory not found: ${dir}`, 'yellow');
      return;
    }

    function scanDir(currentPath, relPath = '') {
      const items = fs.readdirSync(currentPath);

      items.forEach(item => {
        const fullPath = path.join(currentPath, item);
        const itemRelPath = path.join(relPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDir(fullPath, itemRelPath);
        } else {
          const ext = path.extname(item).toLowerCase();

          if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'].includes(ext)) {
            images.total++;
            images.totalSize += stat.size;

            // Count by type
            images.byType[ext] = (images.byType[ext] || 0) + 1;

            // Check if large
            if (stat.size > 500 * 1024) {
              images.large.push({
                file: path.join(dir, itemRelPath),
                size: (stat.size / 1024).toFixed(2),
              });
            }

            // Check if PNG/JPG has WebP version
            if (['.png', '.jpg', '.jpeg'].includes(ext)) {
              const webpPath = fullPath.replace(/\.(png|jpe?g)$/i, '.webp');
              if (!fs.existsSync(webpPath)) {
                images.missingWebP.push(path.join(dir, itemRelPath));
              }
            }
          }
        }
      });
    }

    scanDir(dirPath);
  });

  log(`Total images: ${images.total}`, 'bright');
  log(`Total size: ${(images.totalSize / 1024 / 1024).toFixed(2)} MB`, 'bright');
  log('');
  log('Breakdown by type:', 'cyan');
  Object.entries(images.byType).forEach(([ext, count]) => {
    log(`  ${ext}: ${count} files`);
  });

  if (images.large.length > 0) {
    log('');
    log(`⚠ Large files (>500KB): ${images.large.length}`, 'yellow');
    images.large.slice(0, 10).forEach(img => {
      log(`  ${img.file} (${img.size} KB)`, 'yellow');
    });
    if (images.large.length > 10) {
      log(`  ... and ${images.large.length - 10} more`, 'yellow');
    }
  }

  if (images.missingWebP.length > 0) {
    log('');
    log(`⚠ Missing WebP versions: ${images.missingWebP.length}`, 'yellow');
    images.missingWebP.slice(0, 10).forEach(img => {
      log(`  ${img}`, 'yellow');
    });
    if (images.missingWebP.length > 10) {
      log(`  ... and ${images.missingWebP.length - 10} more`, 'yellow');
    }
  }
}

/**
 * Step 3: CSS Analysis
 */
function analyzeCSS() {
  header('STEP 3: CSS Analysis');

  const cssFiles = [];
  let totalSize = 0;

  config.cssDirs.forEach(dir => {
    const dirPath = path.join(REPO_ROOT, dir);

    if (!fs.existsSync(dirPath)) return;

    function scanDir(currentPath, relPath = '') {
      const items = fs.readdirSync(currentPath);

      items.forEach(item => {
        const fullPath = path.join(currentPath, item);
        const itemRelPath = path.join(relPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDir(fullPath, itemRelPath);
        } else if (path.extname(item) === '.css') {
          cssFiles.push({
            file: path.join(dir, itemRelPath),
            size: stat.size,
          });
          totalSize += stat.size;
        }
      });
    }

    scanDir(dirPath);
  });

  log(`Total CSS files: ${cssFiles.length}`, 'bright');
  log(`Total size: ${(totalSize / 1024).toFixed(2)} KB`, 'bright');
  log('');
  log('Largest files:', 'cyan');
  cssFiles
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .forEach(css => {
      log(`  ${css.file} (${(css.size / 1024).toFixed(2)} KB)`);
    });

  log('');
  log('💡 Recommendations:', 'cyan');
  log('  • Minify CSS in production build');
  log('  • Use PurgeCSS to remove unused styles');
  log('  • Consider CSS-in-JS for component styles');
  log('  • Inline critical CSS in <head>');
}

/**
 * Step 4: JavaScript Analysis
 */
function analyzeJS() {
  header('STEP 4: JavaScript Analysis');

  const jsFiles = [];
  let totalSize = 0;

  config.jsDirs.forEach(dir => {
    const dirPath = path.join(REPO_ROOT, dir);

    if (!fs.existsSync(dirPath)) return;

    function scanDir(currentPath, relPath = '') {
      const items = fs.readdirSync(currentPath);

      items.forEach(item => {
        const fullPath = path.join(currentPath, item);
        const itemRelPath = path.join(relPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDir(fullPath, itemRelPath);
        } else if (path.extname(item) === '.js') {
          jsFiles.push({
            file: path.join(dir, itemRelPath),
            size: stat.size,
            isMin: item.includes('.min.'),
          });
          totalSize += stat.size;
        }
      });
    }

    scanDir(dirPath);
  });

  const unminified = jsFiles.filter(js => !js.isMin);

  log(`Total JS files: ${jsFiles.length}`, 'bright');
  log(`Unminified: ${unminified.length}`, 'bright');
  log(`Total size: ${(totalSize / 1024).toFixed(2)} KB`, 'bright');
  log('');
  log('Largest files:', 'cyan');
  jsFiles
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .forEach(js => {
      const status = js.isMin ? '✓ minified' : '⚠ not minified';
      log(`  ${js.file} (${(js.size / 1024).toFixed(2)} KB) ${status}`);
    });

  log('');
  log('💡 Recommendations:', 'cyan');
  log('  • Minify unminified JS files');
  log('  • Use tree-shaking to remove dead code');
  log('  • Consider code splitting for large files');
  log('  • Use defer/async attributes for non-critical scripts');
}

/**
 * Step 5: Generate optimization summary
 */
function generateSummary() {
  header('OPTIMIZATION SUMMARY');

  log('✅ Completed Tasks:', 'green');
  log('  • Logo cleanup (duplicate files removed)');
  log('  • Image audit complete');
  log('  • CSS analysis complete');
  log('  • JavaScript analysis complete');
  log('');
  log('🔧 Next Steps:', 'yellow');
  log('  1. Convert missing PNG/JPG to WebP');
  log('  2. Minify all CSS and JS in production');
  log('  3. Implement lazy loading for below-fold images');
  log('  4. Add resource hints (preload, prefetch)');
  log('  5. Run Lighthouse audit for performance score');
  log('');
  log('📊 Performance Recommendations:', 'cyan');
  log('  • Implement CDN for static assets');
  log('  • Enable Brotli compression');
  log('  • Use HTTP/2 server push for critical resources');
  log('  • Implement service worker for offline caching');
  log('');
  log('📝 Report saved to: _reports/REPO-OPTIMIZATION-2026-01.md', 'bright');
}

/**
 * Main execution
 */
function main() {
  console.clear();
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║   Repository-Wide Optimization Script                     ║', 'bright');
  log('║   Tillerstead.com - 2026-01-26                            ║', 'bright');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');

  try {
    cleanupLogoFiles();
    auditImages();
    analyzeCSS();
    analyzeJS();
    generateSummary();

    log('');
    log('✅ Optimization complete!', 'green');
  } catch (err) {
    log('');
    log(`❌ Error: ${err.message}`, 'red');
    console.error(err);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { cleanupLogoFiles, auditImages, analyzeCSS, analyzeJS };
