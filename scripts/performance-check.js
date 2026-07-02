/**
 * Pre-Build Performance Check
 * Validates that all performance optimizations are ready
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const checks = [];

async function checkFileExists(filePath, name) {
  try {
    await fs.access(filePath);
    checks.push({ name, status: '✓', message: 'Found' });
    return true;
  } catch {
    checks.push({ name, status: '✗', message: 'Missing' });
    return false;
  }
}

async function checkPackageInstalled(packageName) {
  try {
    const packagePath = path.join(__dirname, '..', 'node_modules', packageName);
    await fs.access(packagePath);
    checks.push({ name: packageName, status: '✓', message: 'Installed' });
    return true;
  } catch {
    checks.push({ name: packageName, status: '✗', message: 'Not installed' });
    return false;
  }
}

async function main() {
  console.log('🔍 Running Pre-Build Performance Checks...\n');

  // Check configuration files
  console.log('📄 Configuration Files:');
  await checkFileExists(path.join(__dirname, '..', 'workbox-config.cjs'), 'workbox-config.cjs');
  await checkFileExists(path.join(__dirname, '..', 'lighthouserc.js'), 'lighthouserc.js');
  await checkFileExists(path.join(__dirname, '..', 'webpack.config.js'), 'webpack.config.js');

  // Check optimization scripts
  console.log('\n📜 Optimization Scripts:');
  await checkFileExists(path.join(__dirname, 'minify-html.js'), 'minify-html.js');
  await checkFileExists(path.join(__dirname, 'extract-critical-css.js'), 'extract-critical-css.js');
  await checkFileExists(path.join(__dirname, 'web-vitals-monitor.js'), 'web-vitals-monitor.js');
  await checkFileExists(path.join(__dirname, 'performance-report.js'), 'performance-report.js');

  // Check critical packages
  console.log('\n📦 Performance Packages:');
  await checkPackageInstalled('critical');
  await checkPackageInstalled('html-minifier-terser');
  await checkPackageInstalled('workbox-cli');
  await checkPackageInstalled('web-vitals');
  await checkPackageInstalled('brotli-webpack-plugin');
  await checkPackageInstalled('compression-webpack-plugin');
  await checkPackageInstalled('sharp');

  // Check asset directories
  console.log('\n📁 Asset Directories:');
  await checkFileExists(path.join(__dirname, '..', 'assets', 'css'), 'assets/css');
  await checkFileExists(path.join(__dirname, '..', 'assets', 'js'), 'assets/js');
  await checkFileExists(path.join(__dirname, '..', 'assets', 'images'), 'assets/images');

  // Check Jekyll
  console.log('\n💎 Jekyll:');
  const gemfilePath = path.join(__dirname, '..', 'Gemfile');
  await checkFileExists(gemfilePath, 'Gemfile');

  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('RESULTS:');
  console.log('='.repeat(60));

  const passed = checks.filter(c => c.status === '✓').length;
  const failed = checks.filter(c => c.status === '✗').length;

  checks.forEach(check => {
    console.log(`${check.status} ${check.name.padEnd(35)} ${check.message}`);
  });

  console.log('='.repeat(60));
  console.log(`Total: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log('\n⚠️  Some checks failed. Run:');
    console.log('   npm install');
    console.log('   bundle install');
    process.exit(1);
  } else {
    console.log('\n✨ All performance tools ready!');
    console.log('\n🚀 Run: npm run build:prod');
  }
}

main();
