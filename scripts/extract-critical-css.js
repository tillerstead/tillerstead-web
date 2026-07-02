/**
 * Critical CSS Extraction Script
 * Extracts and inlines critical above-the-fold CSS
 */

import { generate } from 'critical';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_DIR = path.join(__dirname, '..', '_site');

const criticalPages = [
  { src: 'index.html', dest: 'index.html' },
  { src: 'services.html', dest: 'services.html' },
  { src: 'portfolio.html', dest: 'portfolio.html' },
  { src: 'contact.html', dest: 'contact.html' },
  { src: 'about.html', dest: 'about.html' },
];

const criticalOptions = {
  // Dimensions for above-the-fold calculation
  dimensions: [
    { width: 375, height: 667 }, // Mobile
    { width: 768, height: 1024 }, // Tablet
    { width: 1920, height: 1080 }, // Desktop
  ],

  // Inline critical CSS and defer the rest
  inline: true,
  extract: true,

  // CSS optimization
  minify: true,

  // Penthouse options for accuracy
  penthouse: {
    timeout: 30000,
    maxEmbeddedBase64Length: 1000,
    keepLargerMediaQueries: false,
  },

  // Ignore problematic assets
  ignore: {
    atrule: ['@font-face', '@import'],
    rule: [/\.hidden/, /\.mobile-nav/, /\.dropdown/],
  },
};

async function extractCriticalCSS(page) {
  const _srcPath = path.join(SITE_DIR, page.src);
  const _destPath = path.join(SITE_DIR, page.dest);

  try {
    console.log(`Processing ${page.src}...`);

    const { html: _html } = await generate({
      ...criticalOptions,
      base: SITE_DIR,
      src: page.src,
      target: {
        html: page.dest,
      },
    });

    console.log(`✓ Generated critical CSS for ${page.src}`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing ${page.src}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🎨 Extracting critical CSS...\n');

  // Check if _site directory exists
  try {
    await fs.access(SITE_DIR);
  } catch (_error) {
    console.error('❌ _site directory not found. Run Jekyll build first.');
    process.exit(1);
  }

  let successCount = 0;
  let failCount = 0;

  for (const page of criticalPages) {
    const success = await extractCriticalCSS(page);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${failCount}`);
  console.log('\n✨ Critical CSS extraction complete!');
}

main();
