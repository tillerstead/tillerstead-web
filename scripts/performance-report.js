/**
 * Performance Report Generator
 * Analyzes bundle sizes and generates optimization recommendations
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_DIR = path.join(__dirname, '..', '_site');
const _ASSETS_DIR = path.join(__dirname, '..', 'assets');

// File size limits (in bytes)
const LIMITS = {
  js: 300 * 1024, // 300 KB
  css: 150 * 1024, // 150 KB
  images: 200 * 1024, // 200 KB per image
  fonts: 100 * 1024, // 100 KB per font
  html: 50 * 1024, // 50 KB per page
};

async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

async function analyzeDirectory(dir, extension) {
  const files = [];

  async function traverse(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        await traverse(fullPath);
      } else if (entry.name.endsWith(extension)) {
        const size = await getFileSize(fullPath);
        files.push({
          path: path.relative(SITE_DIR, fullPath),
          size,
          sizeKB: (size / 1024).toFixed(2),
        });
      }
    }
  }

  await traverse(dir);
  return files;
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function main() {
  console.log('📊 Generating Performance Report...\n');

  try {
    await fs.access(SITE_DIR);
  } catch {
    console.error('❌ _site directory not found. Run Jekyll build first.');
    process.exit(1);
  }

  const report = {
    timestamp: new Date().toISOString(),
    files: {},
    warnings: [],
    recommendations: [],
  };

  // Analyze JavaScript files
  console.log('Analyzing JavaScript files...');
  const jsFiles = await analyzeDirectory(path.join(SITE_DIR, 'assets', 'js'), '.js');
  report.files.javascript = jsFiles;

  jsFiles.forEach(file => {
    if (file.size > LIMITS.js) {
      report.warnings.push(`Large JS file: ${file.path} (${file.sizeKB} KB)`);
      report.recommendations.push(`Consider code splitting or lazy loading for ${file.path}`);
    }
  });

  // Analyze CSS files
  console.log('Analyzing CSS files...');
  const cssFiles = await analyzeDirectory(path.join(SITE_DIR, 'assets', 'css'), '.css');
  report.files.css = cssFiles;

  cssFiles.forEach(file => {
    if (file.size > LIMITS.css) {
      report.warnings.push(`Large CSS file: ${file.path} (${file.sizeKB} KB)`);
      report.recommendations.push(`Consider using PurgeCSS on ${file.path}`);
    }
  });

  // Analyze images
  console.log('Analyzing images...');
  const imageFiles = [];
  for (const ext of ['.jpg', '.jpeg', '.png', '.webp', '.avif']) {
    const files = await analyzeDirectory(path.join(SITE_DIR, 'assets', 'images'), ext);
    imageFiles.push(...files);
  }
  report.files.images = imageFiles;

  imageFiles.forEach(file => {
    if (file.size > LIMITS.images) {
      report.warnings.push(`Large image: ${file.path} (${file.sizeKB} KB)`);
      report.recommendations.push(`Optimize ${file.path} with Sharp or ImageOptim`);
    }
  });

  // Analyze fonts
  console.log('Analyzing fonts...');
  const fontFiles = [];
  for (const ext of ['.woff', '.woff2', '.ttf', '.otf']) {
    const files = await analyzeDirectory(path.join(SITE_DIR, 'assets', 'fonts'), ext);
    fontFiles.push(...files);
  }
  report.files.fonts = fontFiles;

  // Calculate totals
  const totals = {
    js: jsFiles.reduce((sum, f) => sum + f.size, 0),
    css: cssFiles.reduce((sum, f) => sum + f.size, 0),
    images: imageFiles.reduce((sum, f) => sum + f.size, 0),
    fonts: fontFiles.reduce((sum, f) => sum + f.size, 0),
  };

  // Print report
  console.log('\n📦 Bundle Size Report:');
  console.log('='.repeat(50));
  console.log(`JavaScript: ${formatSize(totals.js)} (${jsFiles.length} files)`);
  console.log(`CSS:        ${formatSize(totals.css)} (${cssFiles.length} files)`);
  console.log(`Images:     ${formatSize(totals.images)} (${imageFiles.length} files)`);
  console.log(`Fonts:      ${formatSize(totals.fonts)} (${fontFiles.length} files)`);
  console.log('='.repeat(50));
  console.log(`Total:      ${formatSize(Object.values(totals).reduce((a, b) => a + b, 0))}`);

  if (report.warnings.length > 0) {
    console.log(`\n⚠️  ${report.warnings.length} warnings:`);
    report.warnings.forEach(w => console.log(`   • ${w}`));
  }

  if (report.recommendations.length > 0) {
    console.log(`\n💡 Recommendations:`);
    report.recommendations.forEach(r => console.log(`   • ${r}`));
  }

  // Save report
  const reportPath = path.join(__dirname, '..', 'performance-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 Full report saved to: ${path.basename(reportPath)}`);
  console.log('\n✨ Performance report complete!');
}

main();
